-- DISPOSABLE LOCAL CONTRACT ONLY, NOT A HOSTED MIGRATION.
-- The separate verifier must authenticate the actual transaction/actor and consume
-- the independent authority execution claim before calling admit. SQL cannot prove it.
CREATE ROLE cvi_tx_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE cvi_tx_verifier NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE cvi_tx_writer NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE cvi_tx_rotator NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE cvi_tx_fencer NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE cvi_tx_signer NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE cvi_tx_observer NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE SCHEMA cvi_tx_fixture AUTHORIZATION cvi_tx_owner;
REVOKE ALL ON SCHEMA cvi_tx_fixture FROM PUBLIC;
SET ROLE cvi_tx_owner;
ALTER DEFAULT PRIVILEGES IN SCHEMA cvi_tx_fixture REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
CREATE TABLE cvi_tx_fixture.state(id boolean PRIMARY KEY CHECK(id), payload jsonb NOT NULL);
CREATE TABLE cvi_tx_fixture.admissions(
 operation_id uuid PRIMARY KEY, claim_hash text UNIQUE NOT NULL CHECK(claim_hash ~ '^[a-f0-9]{64}$'),
 principal name NOT NULL, kind text NOT NULL CHECK(kind IN ('activate','fence','apply','release')),
 transaction_id xid8 NOT NULL UNIQUE, previous jsonb NOT NULL, target jsonb NOT NULL,
 record_hash text, deadline timestamptz NOT NULL, consumed boolean NOT NULL DEFAULT false);
CREATE TABLE cvi_tx_fixture.executions(operation_id uuid PRIMARY KEY REFERENCES cvi_tx_fixture.admissions, transaction_id xid8 NOT NULL UNIQUE);
CREATE TABLE cvi_tx_fixture.releases(record_hash text PRIMARY KEY CHECK(record_hash ~ '^[a-f0-9]{64}$'), operation_id uuid NOT NULL UNIQUE REFERENCES cvi_tx_fixture.executions);
ALTER TABLE cvi_tx_fixture.state ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvi_tx_fixture.state FORCE ROW LEVEL SECURITY;
ALTER TABLE cvi_tx_fixture.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvi_tx_fixture.admissions FORCE ROW LEVEL SECURITY;
ALTER TABLE cvi_tx_fixture.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvi_tx_fixture.executions FORCE ROW LEVEL SECURITY;
ALTER TABLE cvi_tx_fixture.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvi_tx_fixture.releases FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_state ON cvi_tx_fixture.state TO cvi_tx_owner USING(true) WITH CHECK(true);
CREATE POLICY owner_admission ON cvi_tx_fixture.admissions TO cvi_tx_owner USING(true) WITH CHECK(true);
CREATE POLICY owner_execution ON cvi_tx_fixture.executions TO cvi_tx_owner USING(true) WITH CHECK(true);
CREATE POLICY owner_release ON cvi_tx_fixture.releases TO cvi_tx_owner USING(true) WITH CHECK(true);
CREATE FUNCTION cvi_tx_fixture.valid_state(p jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT coalesce(jsonb_typeof(p)='object' AND (SELECT count(*) FROM jsonb_object_keys(p))=5
  AND p ?& ARRAY['generation','fenced','owner','boot','head']
  AND jsonb_typeof(p->'generation')='number' AND (p->>'generation') ~ '^(0|[1-9][0-9]{0,14})$'
  AND jsonb_typeof(p->'fenced')='boolean'
  AND jsonb_typeof(p->'owner')='string' AND jsonb_typeof(p->'boot')='string' AND jsonb_typeof(p->'head')='string'
  AND (p->>'owner') ~ '^[a-f0-9]{64}$' AND (p->>'boot') ~ '^[a-f0-9]{64}$'
  AND (p->>'head') ~ '^[a-f0-9]{64}$',false)
$$;
CREATE FUNCTION cvi_tx_fixture.admit(op uuid, claim text, actor name, kind text, tx xid8, previous jsonb, target jsonb, record text, expires timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,cvi_tx_fixture AS $$
DECLARE expected_role text; memberships integer;
BEGIN
 IF NOT pg_has_role(session_user,'cvi_tx_verifier','MEMBER') THEN RAISE EXCEPTION 'transaction held' USING ERRCODE='42501'; END IF;
 expected_role:=CASE kind WHEN 'activate' THEN 'cvi_tx_rotator' WHEN 'fence' THEN 'cvi_tx_fencer' WHEN 'apply' THEN 'cvi_tx_writer' WHEN 'release' THEN 'cvi_tx_signer' END;
 SELECT count(*) INTO memberships FROM pg_roles WHERE rolname IN ('cvi_tx_rotator','cvi_tx_fencer','cvi_tx_writer','cvi_tx_signer','cvi_tx_verifier','cvi_tx_observer') AND pg_has_role(actor,oid,'MEMBER');
 IF expected_role IS NULL OR NOT pg_has_role(actor,expected_role,'MEMBER') OR memberships<>1
  OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=actor AND rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication)
  OR claim !~ '^[a-f0-9]{64}$' OR NOT cvi_tx_fixture.valid_state(previous) OR NOT cvi_tx_fixture.valid_state(target)
  OR expires<=clock_timestamp() OR expires>clock_timestamp()+interval '8 seconds'
  OR (kind='release' AND (record IS NULL OR record !~ '^[a-f0-9]{64}$')) OR (kind<>'release' AND record IS NOT NULL)
 THEN RAISE EXCEPTION 'transaction held' USING ERRCODE='55000'; END IF;
 IF NOT (CASE kind
 WHEN 'activate' THEN (target->>'generation')::bigint=(previous->>'generation')::bigint+1 AND target->>'fenced'='false' AND target->'head'=previous->'head' AND target->'boot'<>previous->'boot'
 WHEN 'fence' THEN previous->>'fenced'='false' AND target=previous||'{"fenced":true}'::jsonb
 WHEN 'apply' THEN previous->>'fenced'='false' AND target->'head'<>previous->'head' AND target-'head'=previous-'head'
 WHEN 'release' THEN previous->>'fenced'='true' AND target=previous
 ELSE false END) THEN RAISE EXCEPTION 'transaction held' USING ERRCODE='55000'; END IF;
 INSERT INTO cvi_tx_fixture.admissions VALUES(op,claim,actor,kind,tx,previous,target,record,expires,false);
END $$;
CREATE FUNCTION cvi_tx_fixture.execute_admitted(op uuid, claim text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,cvi_tx_fixture AS $$
DECLARE a cvi_tx_fixture.admissions%ROWTYPE; current_state jsonb; expected_role text;
BEGIN
 SELECT * INTO a FROM cvi_tx_fixture.admissions WHERE operation_id=op FOR UPDATE;
 expected_role:=CASE a.kind WHEN 'activate' THEN 'cvi_tx_rotator' WHEN 'fence' THEN 'cvi_tx_fencer' WHEN 'apply' THEN 'cvi_tx_writer' WHEN 'release' THEN 'cvi_tx_signer' END;
 IF NOT FOUND OR a.consumed OR a.claim_hash IS DISTINCT FROM claim OR a.principal<>session_user
  OR a.transaction_id<>pg_current_xact_id() OR clock_timestamp()>=a.deadline
  OR NOT pg_has_role(session_user,expected_role,'MEMBER') THEN RAISE EXCEPTION 'transaction held' USING ERRCODE='55000'; END IF;
 SELECT payload INTO current_state FROM cvi_tx_fixture.state WHERE id FOR UPDATE;
 IF NOT FOUND OR current_state IS DISTINCT FROM a.previous THEN RAISE EXCEPTION 'transaction held' USING ERRCODE='55000'; END IF;
 UPDATE cvi_tx_fixture.state SET payload=a.target WHERE id;
 INSERT INTO cvi_tx_fixture.executions VALUES(op,pg_current_xact_id());
 IF a.kind='release' THEN INSERT INTO cvi_tx_fixture.releases VALUES(a.record_hash,op); END IF;
 UPDATE cvi_tx_fixture.admissions SET consumed=true WHERE operation_id=op;
 IF clock_timestamp()>=a.deadline THEN RAISE EXCEPTION 'transaction held' USING ERRCODE='55000'; END IF;
 RETURN jsonb_build_object('status','applied','operationId',op,'transactionId',pg_current_xact_id()::text,'target',a.target);
END $$;
CREATE VIEW cvi_tx_fixture.metadata WITH(security_barrier=true) AS SELECT payload FROM cvi_tx_fixture.state;
REVOKE ALL ON ALL TABLES IN SCHEMA cvi_tx_fixture FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA cvi_tx_fixture FROM PUBLIC;
GRANT USAGE ON SCHEMA cvi_tx_fixture TO cvi_tx_verifier,cvi_tx_writer,cvi_tx_rotator,cvi_tx_fencer,cvi_tx_signer,cvi_tx_observer;
GRANT EXECUTE ON FUNCTION cvi_tx_fixture.admit(uuid,text,name,text,xid8,jsonb,jsonb,text,timestamptz) TO cvi_tx_verifier;
GRANT EXECUTE ON FUNCTION cvi_tx_fixture.execute_admitted(uuid,text) TO cvi_tx_writer,cvi_tx_rotator,cvi_tx_fencer,cvi_tx_signer;
GRANT SELECT ON cvi_tx_fixture.metadata TO cvi_tx_observer;
RESET ROLE;
