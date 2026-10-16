"""TEST-ONLY SQLite writer leases and fenced receipt release.

Role/clock/key configuration is test-owned, never a request-body authority.
Only participating guarded writers are fenced. Full database rollback defeats
this model without an independently protected generation/claim authority.
"""
from contextlib import contextmanager
import hashlib
import json
import os
import secrets
import subprocess
from unittest.mock import patch
import local_cvi_transaction as transactions
import local_cvi_integration_intent as intents
from local_cvi_receipt_witness import metadata
from local_cvi_receipts import canonical,digest
from local_recovery_abuse import integer,RecoveryHeld


def hex64(v):return isinstance(v,str) and len(v)==64 and all(c in '0123456789abcdef' for c in v)
def actor_ok(actor,role):return isinstance(actor,dict) and set(actor)=={'principalDigest','role'} and hex64(actor['principalDigest']) and actor['role']==role


def bootstrap(root):
    with transactions.connection(root) as db:
        m=metadata(db)
        db.execute('CREATE TABLE writer_gate (id INTEGER PRIMARY KEY CHECK(id=1),store_id TEXT,policy TEXT,generation INTEGER,state TEXT,observed INTEGER)')
        db.execute('CREATE TABLE writer_grants (generation INTEGER PRIMARY KEY,owner TEXT,boot TEXT UNIQUE,token_hash TEXT,issued INTEGER,expires INTEGER,state TEXT)')
        db.execute('CREATE TABLE writer_releases (receipt_id TEXT PRIMARY KEY,generation INTEGER,owner TEXT,record_hash TEXT,state TEXT)')
        db.execute('INSERT INTO writer_gate VALUES(1,?,?,0,?,?)',(m['storeId'],m['policyDigest'],'fenced',m['observedClock']));db.commit()


def gate(db,now):
    rows=db.execute('SELECT store_id,policy,generation,state,observed FROM writer_gate WHERE id=1').fetchall()
    if len(rows)!=1:raise RecoveryHeld('lease-unavailable')
    store,policy,generation,state,observed=rows[0]
    if not integer(now) or not integer(generation) or not integer(observed) or now<observed or state not in ('active','fenced'):raise RecoveryHeld('lease-unavailable')
    m=metadata(db)
    if m['storeId']!=store or m['policyDigest']!=policy:raise RecoveryHeld('lease-unavailable')
    return dict(storeId=store,policyDigest=policy,generation=generation,state=state,observedClock=observed)


def activate(root,actor,previous,owner,boot,now,ttl=1000):
    if not actor_ok(actor,'rotator') or not integer(previous) or not hex64(owner) or not hex64(boot) or not integer(ttl) or not 1<=ttl<=8000:raise RecoveryHeld('lease-unavailable')
    with transactions.connection(root) as db:
        g=gate(db,now);snapshot=json.loads(db.execute('SELECT payload FROM history WHERE id=1').fetchone()[0])
        expires=min(now+ttl,snapshot['expiresAt'])
        if g['generation']!=previous or previous>=2**53-1 or not integer(expires) or now>=expires or db.execute('SELECT count(*) FROM writer_grants').fetchone()[0]>=128 or db.execute('SELECT 1 FROM writer_grants WHERE boot=?',(boot,)).fetchone():raise RecoveryHeld('lease-unavailable')
        token=secrets.token_hex(32);generation=previous+1
        db.execute("UPDATE writer_grants SET state='retired' WHERE state='active'")
        db.execute('INSERT INTO writer_grants VALUES(?,?,?,?,?,?,?)',(generation,owner,boot,hashlib.sha256(token.encode()).hexdigest(),now,expires,'active'))
        db.execute("UPDATE writer_gate SET generation=?,state='active',observed=? WHERE id=1",(generation,now));db.commit()
        return dict(storeId=g['storeId'],policyDigest=g['policyDigest'],generation=generation,ownerDigest=owner,bootDigest=boot,token=token,issuedAt=now,expiresAt=expires)


def fence(root,actor,generation,now):
    if not actor_ok(actor,'fencer') or not integer(generation):raise RecoveryHeld('lease-unavailable')
    with transactions.connection(root) as db:
        g=gate(db,now)
        if g['generation']!=generation or g['state']!='active':raise RecoveryHeld('lease-unavailable')
        db.execute("UPDATE writer_grants SET state='retired' WHERE state='active'");db.execute("UPDATE writer_gate SET state='fenced',observed=? WHERE id=1",(now,));db.commit()
        return dict(storeId=g['storeId'],policyDigest=g['policyDigest'],generation=generation,state='fenced')


def assert_writer(db,lease,owner,now):
    g=gate(db,now)
    if not isinstance(lease,dict) or set(lease)!={'storeId','policyDigest','generation','ownerDigest','bootDigest','token','issuedAt','expiresAt'} or not integer(lease['generation']) or not integer(lease['issuedAt']) or not integer(lease['expiresAt']) or not all(hex64(lease[k]) for k in ('ownerDigest','bootDigest','token')) or lease['ownerDigest']!=owner or lease['storeId']!=g['storeId'] or lease['policyDigest']!=g['policyDigest'] or g['state']!='active' or lease['generation']!=g['generation'] or not lease['issuedAt']<=now<lease['expiresAt']:raise RecoveryHeld('lease-unavailable')
    saved=db.execute('SELECT owner,boot,token_hash,issued,expires,state FROM writer_grants WHERE generation=?',(lease['generation'],)).fetchone()
    if saved!=(owner,lease['bootDigest'],hashlib.sha256(lease['token'].encode()).hexdigest(),lease['issuedAt'],lease['expiresAt'],'active'):raise RecoveryHeld('lease-unavailable')
    return g


def apply(root,config,intent,lease,clock,crash_at=None):
    base=transactions.connection;owner=digest(config['actor'])
    @contextmanager
    def guarded(path):
        with base(path) as db:
            assert_writer(db,lease,owner,clock())
            class Commit:
                def execute(self,*a):return db.execute(*a)
                def commit(self):
                    now=clock();assert_writer(db,lease,owner,now);db.execute('UPDATE writer_gate SET observed=? WHERE id=1',(now,));db.commit()
            yield Commit()
    with patch.object(transactions,'connection',guarded):return intents.apply(root,config,intent,crash_at)


def assert_barrier(db,barrier,now):
    g=gate(db,now)
    if not isinstance(barrier,dict) or set(barrier)!={'storeId','policyDigest','generation','state'} or type(barrier['generation']) is not int or canonical(barrier)!=canonical({k:g[k] for k in ('storeId','policyDigest','generation','state')}) or g['state']!='fenced':raise RecoveryHeld('lease-unavailable')


def release(root,actor,barrier,expected,record,signer_config,clock,crash_at=None,after_lock=None):
    if not actor_ok(actor,'signer'):raise RecoveryHeld('lease-unavailable')
    # The original live claim owner supplies this transient record. There is no
    # endpoint that reads an already-claimed record back for a new worker.
    identity=digest(record['request'])
    with transactions.connection(root) as db:
        now=clock();assert_barrier(db,barrier,now)
        if canonical(metadata(db))!=canonical(expected) or db.execute('SELECT count(*) FROM writer_releases').fetchone()[0]>=128:raise RecoveryHeld('lease-unavailable')
        saved=db.execute('SELECT record,state FROM committed_receipts WHERE id=?',(identity,)).fetchone()
        if not saved or saved[1]!='claimed' or canonical(json.loads(saved[0]))!=canonical(record):raise RecoveryHeld('lease-unavailable')
        db.execute('INSERT INTO writer_releases VALUES(?,?,?,?,?)',(identity,barrier['generation'],actor['principalDigest'],digest(record),'spent'))
        db.execute('UPDATE writer_gate SET observed=? WHERE id=1',(now,))
        if crash_at=='before-admission':os._exit(83)
        db.commit()
        if crash_at=='after-admission':os._exit(84)
    # No public resume/finish method. This process alone carries the handoff.
    with transactions.connection(root) as db:
        now=clock();assert_barrier(db,barrier,now)
        if canonical(metadata(db))!=canonical(expected):raise RecoveryHeld('lease-unavailable')
        if after_lock is not None:after_lock()
        payload=dict(record=record,now=now,**signer_config)
        response=subprocess.run([signer_config['node'],signer_config['script']],input=json.dumps(payload),text=True,capture_output=True,timeout=5)
        if response.returncode!=0:raise RecoveryHeld('lease-unavailable')
        reply=json.loads(response.stdout)
        if crash_at=='after-sign':os._exit(85)
        finished=clock();assert_barrier(db,barrier,finished)
        if not record['request']['issuedAt']<=finished<record['request']['expiresAt'] or finished>=record['request']['input']['projection']['expiresAt']:raise RecoveryHeld('lease-unavailable')
        return reply
