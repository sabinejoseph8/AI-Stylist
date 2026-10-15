"""Disposable fixture bridge only. Every invocation is a fresh process; no credentials."""
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_recovery_abuse as ledger
x=json.load(sys.stdin);root=Path(x['root']);mode=x['mode']
try:
    if mode=='prepare':
        expected=ledger.prepare(root,dict(guesses=3,sends=2,total=12,resend_interval=10,code_ttl=500,expires=1000),100)
        receipt=ledger.reserve(root,expected,subject='fixture-subject-a',kind='send',generation=None,now=100,operation_id='fixture-operation-'+'0'*32)
        ledger.finish(root,expected,receipt['operation_id'],outcome='completed',cleanup_verified=True)
        print(json.dumps(expected));sys.exit(0)
    expected=x['expected']
    if mode=='inspect':print(json.dumps(ledger.inspect(root,expected)));sys.exit(0)
    r=x['request']
    if r['storeId']!=expected['store_id'] or r['policyId']!=expected['policy_digest']:raise ValueError()
    operation=r['operationId']
    if mode=='reserve':
        if set(r)!={'storeId','policyId','operationId','subjectKey','generation'} or r['subjectKey']!='b'*64:raise ValueError()
        ledger.reserve(root,expected,subject='fixture-subject-a',kind='verify',generation=r['generation'],now=101,operation_id=operation)
        status='reserved'
    elif mode=='claimReset':
        if set(r)!={'storeId','policyId','operationId'}:raise ValueError()
        ledger.claim_reset(root,expected,operation,now=101);status='resetting'
    elif mode=='settle':
        if set(r)!={'storeId','policyId','operationId','outcome','cleanupVerified'}:raise ValueError()
        status=r['outcome']
        if status not in ('completed','rejected','held'):raise ValueError()
        ledger.finish(root,expected,operation,outcome='uncertain' if status=='held' else status,cleanup_verified=r['cleanupVerified'])
    else:raise ValueError()
    print(json.dumps(dict(storeId=r['storeId'],policyId=r['policyId'],operationId=operation,status=status)))
except Exception:
    # A failed operation might have committed: do not convert uncertainty to an authoritative denial.
    print('{"status":"unavailable"}');sys.exit(2)
