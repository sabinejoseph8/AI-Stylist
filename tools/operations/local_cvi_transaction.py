"""Disposable SQLite transaction rehearsal. No live DB, hosted role or credential.

The actual TypeScript domain validator runs while BEGIN IMMEDIATE holds the lock.
Trusted fixture configuration supplies Node/validator and synthetic actor/clock.
"""
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import secrets
import re
import sqlite3
import stat
import subprocess
from local_recovery_evidence import private_root
from local_recovery_abuse import encoded, integer, RecoveryHeld


def validate(config,snapshot,mode,command=None):
    x=dict(snapshot=snapshot,actor=config['actor'],mode=mode,command=command,now=config['now'])
    r=subprocess.run([config['node'],config['validator']],input=json.dumps(x),text=True,capture_output=True,timeout=5)
    if r.returncode!=0:raise RecoveryHeld('transaction-unavailable')
    return json.loads(r.stdout)


@contextmanager
def connection(root):
    root=private_root(root);p=root/'history.sqlite';mode=p.lstat().st_mode
    if not stat.S_ISREG(mode) or mode&0o077:raise RecoveryHeld('transaction-unavailable')
    db=sqlite3.connect(p.as_uri()+'?mode=rw',uri=True,timeout=0,isolation_level=None)
    try:
        db.execute('PRAGMA journal_mode=DELETE');db.execute('PRAGMA synchronous=FULL');db.execute('BEGIN IMMEDIATE');yield db
    finally:
        if db.in_transaction:db.rollback()
        db.close()


def prepare(root,snapshot,config):
    root=private_root(root)
    if list(root.iterdir()):raise RecoveryHeld('transaction-unavailable')
    checked=validate(config,snapshot,'inspect')
    if not integer(config['now']) or not snapshot['clock']<=config['now']<snapshot['expiresAt']:raise RecoveryHeld('transaction-unavailable')
    p=root/'history.sqlite'
    fd=os.open(p,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600);os.close(fd)
    with connection(root) as db:
        db.execute('CREATE TABLE history (id INTEGER PRIMARY KEY CHECK(id=1), payload TEXT NOT NULL, head TEXT NOT NULL, policy TEXT NOT NULL, observed INTEGER NOT NULL)')
        db.execute('CREATE TABLE projections (token TEXT PRIMARY KEY, owner TEXT NOT NULL, epoch INTEGER NOT NULL, head TEXT NOT NULL, at INTEGER NOT NULL, expires INTEGER NOT NULL, state TEXT NOT NULL)')
        db.execute('INSERT INTO history VALUES(1,?,?,?,?)',(json.dumps(snapshot),checked['head'],checked['policyDigest'],config['now']));db.commit()
    return {'storeId':snapshot['storeId'],'policyDigest':checked['policyDigest']}


def operation(root,mode,config,request=None,crash_at=None, receipt_context=None, witness=None, witness_crash_at=None):
    if witness is not None:
        from local_cvi_receipt_witness import protected_connection
    with (protected_connection(root,witness,witness_crash_at) if witness is not None else connection(root)) as db:
        rows=db.execute('SELECT payload,head,policy,observed FROM history WHERE id=1').fetchall()
        if len(rows)!=1:raise RecoveryHeld('transaction-unavailable')
        payload,head,policy,observed=rows[0];snapshot=json.loads(payload)
        checked=validate(config,snapshot,'inspect');now=config['now']
        if checked['head']!=head or checked['policyDigest']!=policy or not integer(now) or not observed<=now<snapshot['expiresAt']:raise RecoveryHeld('transaction-unavailable')
        owner=hashlib.sha256(encoded(config['actor'])).hexdigest()
        if mode=='project':
            if config['actor']['role']=='observer' or db.execute('SELECT count(*) FROM projections').fetchone()[0]>=128:raise RecoveryHeld('transaction-unavailable')
            token=secrets.token_hex(32);expires=min(snapshot['expiresAt'],now+1000)
            db.execute('INSERT INTO projections VALUES(?,?,?,?,?,?,?)',(token,owner,snapshot['epoch'],head,now,expires,'issued'))
            result=dict(status='projected',storeId=snapshot['storeId'],policyDigest=policy,epoch=snapshot['epoch'],head=head,at=now,expiresAt=expires,token=token,snapshot=snapshot)
        elif mode=='commit':
            if not isinstance(request,dict) or set(request)!={'projection','command'}:raise RecoveryHeld('transaction-unavailable')
            p=request['projection']
            if not isinstance(p,dict) or set(p)!={'storeId','policyDigest','epoch','head','at','expiresAt','token'}:raise RecoveryHeld('transaction-unavailable')
            if (not all(integer(p[k]) for k in ('epoch','at','expiresAt')) or not all(isinstance(p[k],str) and re.fullmatch(r'[a-f0-9]{64}',p[k]) for k in ('policyDigest','head','token'))):raise RecoveryHeld('transaction-unavailable')
            saved=db.execute('SELECT owner,epoch,head,at,expires,state FROM projections WHERE token=?',(p['token'],)).fetchone()
            if saved!=(owner,p['epoch'],p['head'],p['at'],p['expiresAt'],'issued') or p['storeId']!=snapshot['storeId'] or p['policyDigest']!=policy:raise RecoveryHeld('transaction-unavailable')
            db.execute("UPDATE projections SET state='used' WHERE token=?",(p['token'],))
            # Refused semantic/conflict attempts still consume their known projection.
            try:
                if now>=p['expiresAt'] or p['at']>now or p['epoch']!=snapshot['epoch'] or p['head']!=head:raise ValueError()
                next_state=validate(config,snapshot,'commit',request['command'])
                if next_state['policyDigest']!=policy:raise ValueError()
                db.execute('UPDATE history SET payload=?,head=? WHERE id=1',(json.dumps(next_state['snapshot']),next_state['head']))
                result=dict(status='committed',storeId=snapshot['storeId'],policyDigest=policy,previousEpoch=snapshot['epoch'],previousHead=head,epoch=next_state['snapshot']['epoch'],head=next_state['head'],at=now)
            except (ValueError,RecoveryHeld):result={'status':'denied'}
        elif mode=='inspect':return dict(snapshot=snapshot,head=head,policyDigest=policy,projections=db.execute('SELECT count(*) FROM projections').fetchone()[0])
        else:raise RecoveryHeld('transaction-unavailable')
        if receipt_context is not None:
            if mode!='commit' or result.get('status')!='committed':raise RecoveryHeld('transaction-unavailable')
            from local_cvi_receipts import append_committed
            append_committed(db,config,request,result,receipt_context)
        db.execute('UPDATE history SET observed=? WHERE id=1',(now,))
        if crash_at=='before-commit':os._exit(71)
        db.commit()
        if crash_at=='after-commit':os._exit(72)
        return result
