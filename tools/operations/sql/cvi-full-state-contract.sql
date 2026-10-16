-- DISPOSABLE FOLLOW-UP ONLY. Full logical export is verifier-validated, not SQL-validated domain behavior.
SET ROLE cvi_tx_owner;
CREATE TABLE cvi_tx_fixture.full_states(id boolean PRIMARY KEY CHECK(id),snapshot jsonb NOT NULL,operation_id uuid REFERENCES cvi_tx_fixture.executions);
CREATE TABLE cvi_tx_fixture.full_admissions(operation_id uuid PRIMARY KEY REFERENCES cvi_tx_fixture.admissions,previous jsonb NOT NULL,target jsonb NOT NULL);
ALTER TABLE cvi_tx_fixture.full_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvi_tx_fixture.full_states FORCE ROW LEVEL SECURITY;
ALTER TABLE cvi_tx_fixture.full_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvi_tx_fixture.full_admissions FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_full_state ON cvi_tx_fixture.full_states TO cvi_tx_owner USING(true) WITH CHECK(true);
CREATE POLICY owner_full_admit ON cvi_tx_fixture.full_admissions TO cvi_tx_owner USING(true) WITH CHECK(true);
-- Renewal is a strict native grant transition; other target kinds still use the
-- separately authenticated full-state verifier described by this contract.
CREATE FUNCTION cvi_tx_fixture.valid_renewal(p jsonb,t jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE pg jsonb;tg jsonb;old_grant jsonb;new_grant jsonb;slot bigint;old_count integer;new_count integer;cap numeric;
BEGIN
 IF jsonb_typeof(p) IS DISTINCT FROM 'object' OR jsonb_typeof(t) IS DISTINCT FROM 'object'
  OR (SELECT count(*) FROM jsonb_object_keys(p))<>7 OR (SELECT count(*) FROM jsonb_object_keys(t))<>7
  OR NOT (p ?& ARRAY['version','history','projections','receipts','gate','grants','releases'])
  OR NOT (t ?& ARRAY['version','history','projections','receipts','gate','grants','releases'])
  OR p->'version'<>'1'::jsonb OR t->'version'<>'1'::jsonb
  OR p-ARRAY['gate','grants'] IS DISTINCT FROM t-ARRAY['gate','grants']
  OR jsonb_array_length(p->'gate')<>1 OR jsonb_array_length(t->'gate')<>1
  OR jsonb_array_length(p->'grants')<>jsonb_array_length(t->'grants') OR jsonb_array_length(p->'grants')>128
 THEN RETURN false; END IF;
 pg:=p->'gate'->0;tg:=t->'gate'->0;
 IF jsonb_array_length(pg)<>5 OR jsonb_array_length(tg)<>5 OR pg-4 IS DISTINCT FROM tg-4
  OR pg->3<>'"active"'::jsonb OR jsonb_typeof(pg->4)<>'number' OR jsonb_typeof(tg->4)<>'number'
  OR (pg->>4)!~'^(0|[1-9][0-9]{0,15})$' OR (tg->>4)!~'^(0|[1-9][0-9]{0,15})$'
  OR (tg->>4)::numeric<(pg->>4)::numeric OR (tg->>4)::numeric>9007199254740991
 THEN RETURN false; END IF;
 SELECT count(*) INTO old_count FROM jsonb_array_elements(p->'grants') g WHERE g->>6='active';
 SELECT count(*) INTO new_count FROM jsonb_array_elements(t->'grants') g WHERE g->>6='active';
 IF old_count<>1 OR new_count<>1 THEN RETURN false; END IF;
 SELECT value,ordinality INTO old_grant,slot FROM jsonb_array_elements(p->'grants') WITH ORDINALITY WHERE value->>6='active';
 new_grant:=t->'grants'->(slot::integer-1);
 IF jsonb_array_length(old_grant)<>7 OR jsonb_array_length(new_grant)<>7 OR new_grant->>6<>'active'
  OR old_grant->0 IS DISTINCT FROM pg->2 OR new_grant->0 IS DISTINCT FROM old_grant->0
  OR new_grant->1 IS DISTINCT FROM old_grant->1 OR new_grant->2 IS DISTINCT FROM old_grant->2
  OR jsonb_typeof(old_grant->0) IS DISTINCT FROM 'number' OR (old_grant->>0)!~'^[1-9][0-9]{0,15}$' OR (old_grant->>0)::numeric>9007199254740991
  OR jsonb_typeof(old_grant->1) IS DISTINCT FROM 'string' OR (old_grant->>1)!~'^[a-f0-9]{64}$' OR jsonb_typeof(old_grant->2) IS DISTINCT FROM 'string' OR (old_grant->>2)!~'^[a-f0-9]{64}$'
  OR jsonb_typeof(old_grant->3) IS DISTINCT FROM 'string' OR (old_grant->>3)!~'^[a-f0-9]{64}$' OR new_grant->3=old_grant->3 OR jsonb_typeof(new_grant->3)<>'string' OR (new_grant->>3)!~'^[a-f0-9]{64}$'
 THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p->'grants') WITH ORDINALITY g WHERE g.ordinality<>slot AND g.value IS DISTINCT FROM t->'grants'->(g.ordinality::integer-1)) THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM (VALUES(old_grant->4),(old_grant->5),(new_grant->4),(new_grant->5)) v(n) WHERE jsonb_typeof(n) IS DISTINCT FROM 'number' OR n::text!~'^(0|[1-9][0-9]{0,15})$' OR n::text::numeric>9007199254740991) THEN RETURN false; END IF;
 IF jsonb_array_length(p->'history')<>1 OR jsonb_typeof((p->'history'->0->>0)::jsonb->'expiresAt') IS DISTINCT FROM 'number' OR ((p->'history'->0->>0)::jsonb->>'expiresAt')!~'^[1-9][0-9]{0,15}$' THEN RETURN false; END IF;
 cap:=((p->'history'->0->>0)::jsonb->>'expiresAt')::numeric;
 RETURN coalesce(cap IS NOT NULL AND cap<=9007199254740991
  AND (old_grant->>4)::numeric<(old_grant->>5)::numeric
  AND (pg->>4)::numeric>=(old_grant->>4)::numeric AND (pg->>4)::numeric<(old_grant->>5)::numeric
  AND (new_grant->>4)::numeric>=(old_grant->>4)::numeric
  AND (new_grant->>4)::numeric>=(pg->>4)::numeric
  AND (new_grant->>4)::numeric<(old_grant->>5)::numeric
  AND (tg->>4)::numeric>=(new_grant->>4)::numeric AND (tg->>4)::numeric<(old_grant->>5)::numeric
  AND (new_grant->>5)::numeric>(old_grant->>5)::numeric
  AND (new_grant->>5)::numeric>(new_grant->>4)::numeric
  AND (new_grant->>5)::numeric-(new_grant->>4)::numeric<=8000
  AND (new_grant->>5)::numeric<=cap,false);
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;
CREATE FUNCTION cvi_tx_fixture.admit_full(op uuid,previous jsonb,target jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,cvi_tx_fixture AS $$
DECLARE operation_kind text;reduced_previous jsonb;reduced_target jsonb;native_grant jsonb;native_projection jsonb;
BEGIN
 IF NOT pg_has_role(session_user,'cvi_tx_verifier','MEMBER') THEN RAISE EXCEPTION 'full state held' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM cvi_tx_fixture.admissions WHERE operation_id=op AND NOT consumed)
  OR previous IS NULL OR target IS NULL OR previous=target OR NOT (target ?& ARRAY['version','history','projections','receipts','gate','grants','releases'])
 THEN RAISE EXCEPTION 'full state held' USING ERRCODE='55000'; END IF;
 SELECT kind,a.previous,a.target INTO operation_kind,reduced_previous,reduced_target FROM cvi_tx_fixture.admissions a WHERE operation_id=op;
 IF operation_kind='renew' THEN
  IF NOT cvi_tx_fixture.valid_renewal(previous,target) THEN RAISE EXCEPTION 'full state held' USING ERRCODE='55000'; END IF;
  SELECT value INTO native_grant FROM jsonb_array_elements(previous->'grants') WHERE value->>6='active';
  native_projection:=jsonb_build_object('generation',previous->'gate'->0->2,'fenced',false,'owner',native_grant->1,'boot',native_grant->2,'head',previous->'history'->0->1);
  IF native_projection IS DISTINCT FROM reduced_previous OR native_projection IS DISTINCT FROM reduced_target THEN RAISE EXCEPTION 'full state held' USING ERRCODE='55000'; END IF;
 END IF;
 INSERT INTO cvi_tx_fixture.full_admissions VALUES(op,previous,target);
END $$;
CREATE FUNCTION cvi_tx_fixture.execute_full(op uuid,claim text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,cvi_tx_fixture AS $$
DECLARE f cvi_tx_fixture.full_admissions%ROWTYPE;actual jsonb;result jsonb;operation_kind text;
BEGIN
 SELECT * INTO f FROM cvi_tx_fixture.full_admissions WHERE operation_id=op;
 IF NOT FOUND THEN RAISE EXCEPTION 'full state held' USING ERRCODE='55000'; END IF;
 SELECT snapshot INTO actual FROM cvi_tx_fixture.full_states WHERE id FOR UPDATE;
 IF NOT FOUND OR actual IS DISTINCT FROM f.previous THEN RAISE EXCEPTION 'full state held' USING ERRCODE='55000'; END IF;
 SELECT kind INTO operation_kind FROM cvi_tx_fixture.admissions WHERE operation_id=op;
 IF operation_kind='renew' AND NOT cvi_tx_fixture.valid_renewal(actual,f.target) THEN RAISE EXCEPTION 'full state held' USING ERRCODE='55000'; END IF;
 result:=cvi_tx_fixture.execute_admitted(op,claim);
 UPDATE cvi_tx_fixture.full_states SET snapshot=f.target,operation_id=op WHERE id;
 RETURN result;
END $$;
CREATE VIEW cvi_tx_fixture.committed_full WITH(security_barrier=true) AS
 SELECT f.snapshot,s.payload AS projection,a.operation_id::text AS "operationId",e.transaction_id::text AS "transactionId",
 a.claim_hash AS "claimHash",a.consumed,
 (NOT has_function_privilege('cvi_tx_writer','cvi_tx_fixture.execute_admitted(uuid,text)','EXECUTE')
  AND NOT has_function_privilege('cvi_tx_rotator','cvi_tx_fixture.execute_admitted(uuid,text)','EXECUTE')
  AND NOT has_function_privilege('cvi_tx_fencer','cvi_tx_fixture.execute_admitted(uuid,text)','EXECUTE')
  AND NOT has_function_privilege('cvi_tx_signer','cvi_tx_fixture.execute_admitted(uuid,text)','EXECUTE')) AS protected
 FROM cvi_tx_fixture.full_states f JOIN cvi_tx_fixture.state s ON s.id=f.id
 JOIN cvi_tx_fixture.executions e ON e.operation_id=f.operation_id
 JOIN cvi_tx_fixture.admissions a ON a.operation_id=e.operation_id;
REVOKE ALL ON cvi_tx_fixture.full_states,cvi_tx_fixture.full_admissions,cvi_tx_fixture.committed_full FROM PUBLIC;
REVOKE ALL ON FUNCTION cvi_tx_fixture.valid_renewal(jsonb,jsonb),cvi_tx_fixture.admit_full(uuid,jsonb,jsonb),cvi_tx_fixture.execute_full(uuid,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cvi_tx_fixture.execute_admitted(uuid,text) FROM cvi_tx_writer,cvi_tx_rotator,cvi_tx_fencer,cvi_tx_signer;
GRANT EXECUTE ON FUNCTION cvi_tx_fixture.admit_full(uuid,jsonb,jsonb) TO cvi_tx_verifier;
GRANT EXECUTE ON FUNCTION cvi_tx_fixture.execute_full(uuid,text) TO cvi_tx_writer,cvi_tx_rotator,cvi_tx_fencer,cvi_tx_signer;
GRANT SELECT ON cvi_tx_fixture.committed_full TO cvi_tx_observer;
RESET ROLE;
