"""TEST-ONLY validated SQLite intents for authenticated-witness integration.

Preview rolls back real transaction logic and returns metadata only. Apply checks
both exact endpoints under the database lock. This is not a public/hosted API.
"""
from contextlib import contextmanager
from unittest.mock import patch
import os
import local_cvi_transaction as transactions
import local_cvi_receipts as receipts
from local_cvi_receipt_witness import metadata
from local_cvi_receipts import digest,canonical
from local_recovery_abuse import RecoveryHeld


def observe(root):
    with transactions.connection(root) as db:return metadata(db)


def run(root,config,mode,args,*,preview=False,intent=None,crash_at=None):
    if mode not in ('commit','claim'):raise RecoveryHeld('intent-unavailable')
    if not isinstance(args,dict) or (mode=='commit' and set(args)!={'request','receiptContext'}) or (mode=='claim' and set(args)!={'identity','principal'}):raise RecoveryHeld('intent-unavailable')
    base=transactions.connection;captured={};commits=0
    @contextmanager
    def controlled(path):
        nonlocal commits
        with base(path) as db:
            before=metadata(db)
            if intent is not None and canonical(before)!=canonical(intent['from']):raise RecoveryHeld('intent-unavailable')
            class Commit:
                def execute(self,*a):return db.execute(*a)
                def commit(self):
                    nonlocal commits
                    commits+=1
                    if commits!=1:raise RecoveryHeld('intent-unavailable')
                    target=metadata(db);captured.update({'from':before,'to':target})
                    if intent is not None and canonical(target)!=canonical(intent['to']):raise RecoveryHeld('intent-unavailable')
                    if not preview:
                        if crash_at=='before-commit':os._exit(81)
                        db.commit()
                        if crash_at=='after-commit':os._exit(82)
            yield Commit()
    with patch.object(transactions,'connection',controlled),patch.object(receipts,'connection',controlled):
        if mode=='commit':result=transactions.operation(root,'commit',config,args['request'],receipt_context=args['receiptContext'])
        else:result=receipts.claim(root,args['identity'],args['principal'],config['now'])
    if commits!=1 or (mode=='commit' and result.get('status')!='committed'):raise RecoveryHeld('intent-unavailable')
    return captured,result


def plan(root,config,mode,args):
    captured,_=run(root,config,mode,args,preview=True)
    body=dict(version=1,mode=mode,actor=config['actor'],now=config['now'],args=args,**captured)
    return dict(id=digest(body),**body)


def apply(root,config,intent,crash_at=None):
    if not isinstance(intent,dict) or set(intent)!={'id','version','mode','actor','now','args','from','to'}:raise RecoveryHeld('intent-unavailable')
    body={k:v for k,v in intent.items() if k!='id'}
    if type(intent['version']) is not int or intent['version']!=1 or digest(body)!=intent['id'] or canonical(config['actor'])!=canonical(intent['actor']) or type(intent['now']) is not int or config['now']!=intent['now']:raise RecoveryHeld('intent-unavailable')
    _,result=run(root,config,intent['mode'],intent['args'],intent=intent,crash_at=crash_at)
    return result
