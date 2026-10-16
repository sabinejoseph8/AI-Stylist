"""TEST-ONLY mandatory authenticated authority adapter. No raw-write fallback.

Control/domain state is compared under SQLite locks. A parent fixture supplies
fresh signed authority replies over a pipe; only public keys reach the verifier.
Real grant isolation and independent authority administration remain unproven.
"""
from contextlib import contextmanager
import json
import secrets
import subprocess
from unittest.mock import patch
import local_cvi_transaction as transactions
import local_cvi_receipts as receipts
import local_cvi_writer_lease as leases
from local_cvi_receipts import canonical,digest
from local_cvi_receipt_witness import metadata
from local_recovery_abuse import integer,RecoveryHeld

ROLES={'activate':'rotator','fence':'fencer','apply':'writer','release':'signer'}


def control_metadata(db,now):
    g=leases.gate(db,now);domain=metadata(db)
    grants=db.execute('SELECT generation,owner,boot,token_hash,issued,expires,state FROM writer_grants ORDER BY generation').fetchall()
    releases=db.execute('SELECT receipt_id,generation,owner,record_hash,state FROM writer_releases ORDER BY receipt_id').fetchall()
    if len(grants)>128 or len(releases)>128:raise RecoveryHeld('mandatory-adapter-unavailable')
    return dict(storeId=g['storeId'],policyDigest=g['policyDigest'],epochFloor=g['generation'],headFloor=digest(dict(storeId=g['storeId'],policyDigest=g['policyDigest'],generation=g['generation'])),observedClock=max(g['observedClock'],domain['observedClock']),historyDigest=digest(dict(domain=domain,gate=g,grants=grants,releases=releases)))


def validate_command(kind,args):
    fields={'activate':{'previous','owner','boot','ttl','token'},'fence':{'generation'},'apply':{'intent','lease'},'release':{'barrier','expectedDomain','record'}}
    if kind not in fields or not isinstance(args,dict) or set(args)!=fields[kind]:raise RecoveryHeld('mandatory-adapter-unavailable')
    if kind=='activate' and (not integer(args['previous']) or not integer(args['ttl']) or not all(leases.hex64(args[k]) for k in ('owner','boot','token'))):raise RecoveryHeld('mandatory-adapter-unavailable')
    if kind=='fence' and not integer(args['generation']):raise RecoveryHeld('mandatory-adapter-unavailable')


def release_admission(root,actor,args,now):
    record=args['record'];identity=digest(record['request'])
    with transactions.connection(root) as db:
        leases.assert_barrier(db,args['barrier'],now)
        if canonical(metadata(db))!=canonical(args['expectedDomain']):raise RecoveryHeld('mandatory-adapter-unavailable')
        saved=db.execute('SELECT record,state FROM committed_receipts WHERE id=?',(identity,)).fetchone()
        if not saved or saved[1]!='claimed' or canonical(json.loads(saved[0]))!=canonical(record) or db.execute('SELECT count(*) FROM writer_releases').fetchone()[0]>=128:raise RecoveryHeld('mandatory-adapter-unavailable')
        db.execute('INSERT INTO writer_releases VALUES(?,?,?,?,?)',(identity,args['barrier']['generation'],actor['principalDigest'],digest(record),'spent'))
        db.execute('UPDATE writer_gate SET observed=? WHERE id=1',(now,));db.commit()
        return dict(status='release-admitted')


def mutation(root,config,actor,kind,args):
    now=config['now']
    if kind=='activate':
        # The token is selected once by the trusted planner, never regenerated
        # between preview and COMMIT. Existing stored-hash checks still apply.
        with patch.object(leases.secrets,'token_hex',lambda n:args['token'] if n==32 else (_ for _ in ()).throw(ValueError())):
            return leases.activate(root,actor,args['previous'],args['owner'],args['boot'],now,args['ttl'])
    if kind=='fence':return leases.fence(root,actor,args['generation'],now)
    if kind=='apply':return leases.apply(root,config,args['intent'],args['lease'],lambda:now)
    return release_admission(root,actor,args,now)


class PreviewComplete(Exception):pass


def plan(root,config,actor,kind,args):
    validate_command(kind,args)
    if not leases.actor_ok(actor,ROLES[kind]):raise RecoveryHeld('mandatory-adapter-unavailable')
    base=transactions.connection;captured={}
    @contextmanager
    def preview(path):
        with base(path) as db:
            before=control_metadata(db,config['now'])
            class Commit:
                def execute(self,*a):return db.execute(*a)
                def commit(self):captured.update({'from':before,'to':control_metadata(db,config['now'])});raise PreviewComplete()
            yield Commit()
    try:
        with patch.object(transactions,'connection',preview),patch.object(receipts,'connection',preview):mutation(root,config,actor,kind,args)
    except PreviewComplete:pass
    if not captured:raise RecoveryHeld('mandatory-adapter-unavailable')
    body=dict(version=1,kind=kind,args=args,actor=actor,now=config['now'],**captured)
    return dict(id=digest(body),**body)


def verify(config,payload):
    result=subprocess.run([config['node'],config['verifier']],input=json.dumps(payload),text=True,capture_output=True,timeout=3)
    if result.returncode!=0:raise RecoveryHeld('mandatory-adapter-unavailable')


def fresh(config,intent,approval,rpc,phase):
    nonce=secrets.token_bytes(32).hex()
    evidence=rpc(dict(stage='authority-read',phase=phase,nonce=nonce,operationId=intent['id']))
    verify(config,dict(mode='read',phase=phase,nonce=nonce,intent=intent,approval=approval,evidence=evidence,pin=config['authorityPin'],readPrincipal=config['readPrincipal'],now=config['now']))


def execute(root,config,intent,approval,rpc,crash_at=None):
    if not isinstance(intent,dict) or set(intent)!={'id','version','kind','args','actor','now','from','to'}:raise RecoveryHeld('mandatory-adapter-unavailable')
    body={k:v for k,v in intent.items() if k!='id'};kind=intent['kind'];validate_command(kind,intent['args'])
    if type(intent['version']) is not int or intent['version']!=1 or digest(body)!=intent['id'] or not leases.actor_ok(intent['actor'],ROLES[kind]) or type(intent['now']) is not int or intent['now']!=config['now']:raise RecoveryHeld('mandatory-adapter-unavailable')
    verify(config,dict(mode='advanced',intent=intent,approval=approval,pin=config['authorityPin'],now=config['now']))
    base=transactions.connection;count=0
    @contextmanager
    def mandatory(path):
        nonlocal count
        with base(path) as db:
            if canonical(control_metadata(db,config['now']))!=canonical(intent['from']):raise RecoveryHeld('mandatory-adapter-unavailable')
            fresh(config,intent,approval,rpc,'claim')
            class Commit:
                def execute(self,*a):return db.execute(*a)
                def commit(self):
                    nonlocal count
                    count+=1
                    if count!=1 or canonical(control_metadata(db,config['now']))!=canonical(intent['to']):raise RecoveryHeld('mandatory-adapter-unavailable')
                    fresh(config,intent,approval,rpc,'pending')
                    if crash_at=='before-commit':raise RecoveryHeld('mandatory-adapter-unavailable')
                    db.commit()
                    if crash_at=='after-commit':raise RecoveryHeld('mandatory-adapter-unavailable')
            yield Commit()
    with patch.object(transactions,'connection',mandatory),patch.object(receipts,'connection',mandatory):result=mutation(root,config,intent['actor'],kind,intent['args'])
    if count!=1:raise RecoveryHeld('mandatory-adapter-unavailable')
    # Missing reconciliation never becomes an acknowledgment or signing fallback.
    rpc(dict(stage='reconcile',operationId=intent['id']))
    with base(root) as db:
        if canonical(control_metadata(db,config['now']))!=canonical(intent['to']):raise RecoveryHeld('mandatory-adapter-unavailable')
        fresh(config,intent,approval,rpc,'reconciled')
        if kind=='release':
            record=intent['args']['record'];leases.assert_barrier(db,intent['args']['barrier'],config['now'])
            payload=dict(record=record,now=config['now'],**config['signer'])
            signed=subprocess.run([config['node'],config['signer']['script']],input=json.dumps(payload),text=True,capture_output=True,timeout=3)
            if signed.returncode!=0:raise RecoveryHeld('mandatory-adapter-unavailable')
            if crash_at=='after-sign':raise RecoveryHeld('mandatory-adapter-unavailable')
            result=json.loads(signed.stdout)
    return result
