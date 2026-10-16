"""TEST-ONLY separately protected receipt/epoch witness model.

Separate folders do not prove independent authority. Witness advances BEFORE
SQLite commit; interrupted cross-store writes hold, never rebase or refund.
"""
from contextlib import contextmanager
import json
from pathlib import Path
import re
import uuid
from local_cvi_receipts import digest
from local_cvi_transaction import connection
from local_recovery_abuse import locked, save, sync_root, encoded, integer, RecoveryHeld
from local_recovery_evidence import private_root, read_private, durable_create
import hashlib
import os


def metadata(db):
    history=db.execute('SELECT payload,head,policy,observed FROM history WHERE id=1').fetchall()
    if len(history)!=1:raise RecoveryHeld('receipt-witness-unavailable')
    payload,head,policy,observed=history[0];state=json.loads(payload)
    projections=db.execute('SELECT token,owner,epoch,head,at,expires,state FROM projections ORDER BY token').fetchall()
    receipts=db.execute('SELECT id,challenge,principal,record,state,observed FROM committed_receipts ORDER BY id').fetchall()
    if (not isinstance(state,dict) or not integer(state.get('epoch')) or not integer(observed) or
        not all(isinstance(v,str) and re.fullmatch(r'[a-f0-9]{64}',v) for v in (head,policy)) or
        not isinstance(state.get('storeId'),str) or not re.fullmatch(r'[a-f0-9-]{36}',state['storeId']) or len(projections)>128 or len(receipts)>128):raise RecoveryHeld('receipt-witness-unavailable')
    return dict(storeId=state['storeId'],policyDigest=policy,epochFloor=state['epoch'],headFloor=head,observedClock=observed,
                historyDigest=digest(dict(history=history,projections=projections,receipts=receipts)))


def bootstrap(witness_root,root):
    w=private_root(witness_root)
    if w.resolve()==Path(root).resolve() or list(w.iterdir()):raise RecoveryHeld('receipt-witness-unavailable')
    with connection(root) as db:
        s=dict(version=1,witnessId=str(uuid.uuid4()),revision=0,**metadata(db))
        durable_create(w/'lock',b'receipt-witness-fixture-lock');durable_create(w/'pending',b'initializing')
        data=encoded(s);durable_create(w/'ledger.json',data);durable_create(w/'checkpoint.json',encoded({'sha256':hashlib.sha256(data).hexdigest()}))
        (w/'pending').unlink();sync_root(w)
        return dict(root=str(w),witnessId=s['witnessId'],storeId=s['storeId'],policyDigest=s['policyDigest'])


def load(ref):
    if not isinstance(ref,dict) or set(ref)!={'root','witnessId','storeId','policyDigest'}:raise RecoveryHeld('receipt-witness-unavailable')
    root=private_root(ref['root'])
    if any((root/n).exists() or (root/n).is_symlink() for n in ('pending','ledger.next','checkpoint.next')):raise RecoveryHeld('receipt-witness-unavailable')
    data=read_private(root/'ledger.json')
    if json.loads(read_private(root/'checkpoint.json'))!={'sha256':hashlib.sha256(data).hexdigest()}:raise RecoveryHeld('receipt-witness-unavailable')
    s=json.loads(data)
    if (not isinstance(s,dict) or set(s)!={'version','witnessId','revision','storeId','policyDigest','epochFloor','headFloor','observedClock','historyDigest'} or
        type(s['version']) is not int or s['version']!=1 or any(s[k]!=ref[k] for k in ('witnessId','storeId','policyDigest')) or
        not all(integer(s[k]) for k in ('revision','epochFloor','observedClock')) or
        not all(isinstance(s[k],str) and re.fullmatch(r'[a-f0-9]{64}',s[k]) for k in ('policyDigest','headFloor','historyDigest'))):raise RecoveryHeld('receipt-witness-unavailable')
    return s


class WitnessCommit:
    def __init__(self,db,ref,old,crash_at):
        self.db=db;self.ref=ref;self.old=old;self.crash_at=crash_at;self.used=False
        self.projections=db.execute('SELECT token,owner,epoch,head,at,expires,state FROM projections ORDER BY token').fetchall()
        self.receipts=db.execute('SELECT id,challenge,principal,record,state,observed FROM committed_receipts ORDER BY id').fetchall()
    def execute(self,*args):return self.db.execute(*args)
    def commit(self):
        if self.used:raise RecoveryHeld('receipt-witness-unavailable')
        self.used=True;target=metadata(self.db)
        if (target['storeId']!=self.old['storeId'] or target['policyDigest']!=self.old['policyDigest'] or
            target['epochFloor']<self.old['epochFloor'] or target['observedClock']<self.old['observedClock'] or
            (target['epochFloor']==self.old['epochFloor'] and target['headFloor']!=self.old['headFloor']) or self.old['revision']>=2**53-1):raise RecoveryHeld('receipt-witness-unavailable')
        projections={r[0]:r for r in self.db.execute('SELECT token,owner,epoch,head,at,expires,state FROM projections')}
        receipts={r[0]:r for r in self.db.execute('SELECT id,challenge,principal,record,state,observed FROM committed_receipts')}
        for row in self.projections:
            new=projections.get(row[0])
            if not new or new[:6]!=row[:6] or new[6] not in ('issued','used') or (row[6]=='used' and new[6]!='used'):raise RecoveryHeld('receipt-witness-unavailable')
        for row in self.receipts:
            new=receipts.get(row[0])
            if not new or new[:4]!=row[:4] or new[4] not in ('pending','claimed') or (row[4]=='claimed' and new[4]!='claimed') or not integer(new[5]) or new[5]<row[5]:raise RecoveryHeld('receipt-witness-unavailable')
        if any(r[6]!='issued' for k,r in projections.items() if k not in {r[0] for r in self.projections}) or any(r[4]!='pending' for k,r in receipts.items() if k not in {r[0] for r in self.receipts}):raise RecoveryHeld('receipt-witness-unavailable')
        if target['historyDigest']!=self.old['historyDigest']:
            if self.crash_at=='before-witness':os._exit(76)
            save(Path(self.ref['root']),dict(version=1,witnessId=self.old['witnessId'],revision=self.old['revision']+1,**target),
                 crash_at={'witness-pending':'pending','witness-ledger':'ledger','witness-checkpoint':'checkpoint'}.get(self.crash_at))
            if self.crash_at=='after-witness':os._exit(77)
        self.db.commit()
        if self.crash_at=='after-database':os._exit(78)


@contextmanager
def protected_connection(root,ref,crash_at=None):
    # All protected operations take locks in the same database-then-witness order.
    if not isinstance(ref,dict) or 'root' not in ref or Path(root).resolve()==Path(ref['root']).resolve():raise RecoveryHeld('receipt-witness-unavailable')
    with connection(root) as db:
        with locked(ref['root']):
            old=load(ref);current=metadata(db)
            if any(current[k]!=old[k] for k in current):raise RecoveryHeld('receipt-witness-unavailable')
            yield WitnessCommit(db,ref,old,crash_at)
