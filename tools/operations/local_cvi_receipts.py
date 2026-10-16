"""Synthetic SQLite committed-receipt outbox. No real role or hosted signer.

Append is called inside the domain transaction. Claim commits irrevocably before
returning any record for signing. Crashes/lost replies never reseed or refund.
"""
import hashlib
import json
import os
import re
from local_cvi_transaction import connection
from local_recovery_abuse import integer, RecoveryHeld


def canonical(value):
    # This contract contains ASCII metadata only, no user text/audio.
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def digest(value):
    return hashlib.sha256(canonical(value).encode()).hexdigest()


def bootstrap(root):
    with connection(root) as db:
        db.execute('CREATE TABLE committed_receipts (id TEXT PRIMARY KEY, challenge TEXT UNIQUE NOT NULL, principal TEXT NOT NULL, record TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN (\'pending\',\'claimed\')), observed INTEGER NOT NULL)')
        db.commit()


def append_committed(db,config,domain_input,result,context):
    if not isinstance(context,dict) or set(context)!={'request','keyId'}:raise RecoveryHeld('receipt-unavailable')
    r=context['request'];now=config['now']
    fields={'version','authorityId','storeId','policyDigest','principalDigest','action','challenge','issuedAt','expiresAt','input'}
    if (not isinstance(r,dict) or set(r)!=fields or type(r['version']) is not int or r['version']!=1 or r['action']!='commit' or canonical(r['input'])!=canonical(domain_input) or
        r['storeId']!=result['storeId'] or r['policyDigest']!=result['policyDigest'] or r['principalDigest']!=digest(config['actor']) or
        not isinstance(r['authorityId'],str) or not re.fullmatch(r'fixture-authority-[a-z0-9-]{1,40}',r['authorityId']) or
        not isinstance(context['keyId'],str) or not re.fullmatch(r'fixture-key-[a-z0-9-]{1,40}',context['keyId']) or
        not isinstance(r['challenge'],str) or not re.fullmatch(r'[a-f0-9]{64}',r['challenge']) or
        not integer(r['issuedAt']) or not integer(r['expiresAt']) or not r['issuedAt']<=now<r['expiresAt'] or r['expiresAt']-r['issuedAt']>8000 or
        len(canonical(r).encode())>65536 or db.execute('SELECT count(*) FROM committed_receipts').fetchone()[0]>=128):raise RecoveryHeld('receipt-unavailable')
    identity=digest(r)
    body={k:r[k] for k in ('version','authorityId','storeId','policyDigest','principalDigest','action','challenge')}
    body.update(keyId=context['keyId'],requestHash=identity,result=result)
    record=dict(request=r,body=body)
    db.execute('INSERT INTO committed_receipts VALUES(?,?,?,?,?,?)',(identity,r['challenge'],r['principalDigest'],canonical(record),'pending',now))


def claim(root,identity,principal,now,crash_at=None,witness=None,witness_crash_at=None):
    if not isinstance(identity,str) or not re.fullmatch(r'[a-f0-9]{64}',identity) or not integer(now):raise RecoveryHeld('receipt-unavailable')
    if witness is not None:
        from local_cvi_receipt_witness import protected_connection
    with (protected_connection(root,witness,witness_crash_at) if witness is not None else connection(root)) as db:
        history=db.execute('SELECT observed FROM history WHERE id=1').fetchall()
        if len(history)!=1 or now<history[0][0]:raise RecoveryHeld('receipt-unavailable')
        row=db.execute('SELECT principal,record,state,observed FROM committed_receipts WHERE id=?',(identity,)).fetchone()
        if not row or row[0]!=principal or row[2]!='pending' or now<row[3]:raise RecoveryHeld('receipt-unavailable')
        record=json.loads(row[1])
        if (digest(record['request'])!=identity or record['body']['requestHash']!=identity or
            not record['request']['issuedAt']<=now<record['request']['expiresAt']):raise RecoveryHeld('receipt-unavailable')
        db.execute("UPDATE committed_receipts SET state='claimed',observed=? WHERE id=?",(now,identity))
        db.execute('UPDATE history SET observed=? WHERE id=1',(now,))
        if crash_at=='before-claim-commit':os._exit(73)
        db.commit()
        if crash_at=='after-claim-commit':os._exit(74)
        return record


def inspect(root,witness=None):
    if witness is not None:
        from local_cvi_receipt_witness import protected_connection
    with (protected_connection(root,witness) if witness is not None else connection(root)) as db:
        return [dict(id=r[0],state=r[1]) for r in db.execute('SELECT id,state FROM committed_receipts ORDER BY id')]
