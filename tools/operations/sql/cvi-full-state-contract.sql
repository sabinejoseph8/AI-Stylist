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
CREATE FUNCTION cvi_tx_fixture.admit_full(op uuid,previous jsonb,target jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,cvi_tx_fixture AS $$
BEGIN
 IF NOT pg_has_role(session_user,'cvi_tx_verifier','MEMBER') THEN RAISE EXCEPTION 'full state held' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM cvi_tx_fixture.admissions WHERE operation_id=op AND NOT consumed)
  OR previous IS NULL OR target IS NULL OR NOT (target ?& ARRAY['version','history','projections','receipts','gate','grants','releases'])
 THEN RAISE EXCEPTION 'full state held' USING ERRCODE='55000'; END IF;
 INSERT INTO cvi_tx_fixture.full_admissions VALUES(op,previous,target);
END $$;
CREATE FUNCTION cvi_tx_fixture.execute_full(op uuid,claim text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,cvi_tx_fixture AS $$
DECLARE f cvi_tx_fixture.full_admissions%ROWTYPE;actual jsonb;result jsonb;
BEGIN
 SELECT * INTO f FROM cvi_tx_fixture.full_admissions WHERE operation_id=op;
 IF NOT FOUND THEN RAISE EXCEPTION 'full state held' USING ERRCODE='55000'; END IF;
 SELECT snapshot INTO actual FROM cvi_tx_fixture.full_states WHERE id FOR UPDATE;
 IF NOT FOUND OR actual IS DISTINCT FROM f.previous THEN RAISE EXCEPTION 'full state held' USING ERRCODE='55000'; END IF;
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
REVOKE ALL ON FUNCTION cvi_tx_fixture.admit_full(uuid,jsonb,jsonb),cvi_tx_fixture.execute_full(uuid,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION cvi_tx_fixture.execute_admitted(uuid,text) FROM cvi_tx_writer,cvi_tx_rotator,cvi_tx_fencer,cvi_tx_signer;
GRANT EXECUTE ON FUNCTION cvi_tx_fixture.admit_full(uuid,jsonb,jsonb) TO cvi_tx_verifier;
GRANT EXECUTE ON FUNCTION cvi_tx_fixture.execute_full(uuid,text) TO cvi_tx_writer,cvi_tx_rotator,cvi_tx_fencer,cvi_tx_signer;
GRANT SELECT ON cvi_tx_fixture.committed_full TO cvi_tx_observer;
RESET ROLE;
