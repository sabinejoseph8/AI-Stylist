"""Disposable CVI replay journal. No live runtime or provider imports this model.

Uses existing owner-only flock/fsync/pending/checkpoint primitives in a NEW fixture
folder. Checksum is not protection against privileged rewriting/coordinated rollback.
"""
import hashlib
import json
import re
import uuid
from local_recovery_abuse import encoded, integer, sync_root, locked, save, RecoveryHeld
from local_recovery_evidence import private_root, read_private, durable_create
from local_cvi_witness import journal_locked, journal_save


def digest(x):
    return isinstance(x,str) and re.fullmatch(r'[a-f0-9]{64}',x) is not None


def prepare(root,binding_digest,expires,now,limit=64):
    root=private_root(root)
    if list(root.iterdir()) or not digest(binding_digest) or not integer(expires) or not integer(now) or now>=expires or type(limit) is not int or not 1<=limit<=64:
        raise RecoveryHeld('cvi-unavailable')
    state=dict(version=1,storeId=str(uuid.uuid4()),bindingDigest=binding_digest,expires=expires,clock=now,limit=limit,records=[])
    durable_create(root/'lock',b'cvi-fixture-lock');durable_create(root/'pending',b'initializing')
    data=encoded(state);durable_create(root/'ledger.json',data)
    durable_create(root/'checkpoint.json',encoded({'sha256':hashlib.sha256(data).hexdigest()}))
    (root/'pending').unlink();sync_root(root)
    return state['storeId']


def load(root,store_id):
    if any((root/n).exists() or (root/n).is_symlink() for n in ('pending','ledger.next','checkpoint.next')):raise RecoveryHeld('cvi-unavailable')
    data=read_private(root/'ledger.json')
    if json.loads(read_private(root/'checkpoint.json'))!={'sha256':hashlib.sha256(data).hexdigest()}:raise RecoveryHeld('cvi-unavailable')
    s=json.loads(data)
    if (set(s)!={'version','storeId','bindingDigest','expires','clock','limit','records'} or type(s['version']) is not int or s['version']!=1 or
        s['storeId']!=store_id or not digest(s['bindingDigest']) or not integer(s['expires']) or not integer(s['clock']) or s['clock']>=s['expires'] or
        type(s['limit']) is not int or not 1<=s['limit']<=64 or not isinstance(s['records'],list) or len(s['records'])>s['limit']):raise RecoveryHeld('cvi-unavailable')
    ids=set();receipts=set();last=0;unresolved=0
    for r in s['records']:
        if (set(r)!={'requestDigest','receipt','status','at','spentAt'} or not digest(r['requestDigest']) or
            not isinstance(r['receipt'],str) or not re.fullmatch(r'fixture-receipt-[a-f0-9]{32}',r['receipt']) or
            r['requestDigest'] in ids or r['receipt'] in receipts or r['status'] not in ('reserved','spent') or
            not integer(r['at']) or not last<=r['at']<=s['clock']):raise RecoveryHeld('cvi-unavailable')
        if r['status']=='reserved':
            unresolved+=1
            if r['spentAt'] is not None:raise RecoveryHeld('cvi-unavailable')
            last=r['at']
        else:
            if not integer(r['spentAt']) or not r['at']<=r['spentAt']<=s['clock']:raise RecoveryHeld('cvi-unavailable')
            last=r['spentAt']
        ids.add(r['requestDigest']);receipts.add(r['receipt'])
    if unresolved>1 or (unresolved and s['records'][-1]['status']!='reserved'):raise RecoveryHeld('cvi-unavailable')
    return s


def operate(root,request,mode,crash_at=None,*,witness=None,witness_crash_at=None):
    keys={'storeId','bindingDigest','requestDigest','now'}
    if mode=='consume':keys|={'receipt','status'}
    if (mode not in ('reserve','consume') or not isinstance(request,dict) or set(request)!=keys or
        not digest(request['bindingDigest']) or not digest(request['requestDigest']) or not integer(request['now'])):raise RecoveryHeld('cvi-unavailable')
    with journal_locked(root,request['storeId'],'replay',witness) as root:
        s=load(root,request['storeId']);now=request['now']
        if request['bindingDigest']!=s['bindingDigest'] or not s['clock']<=now<s['expires']:raise RecoveryHeld('cvi-unavailable')
        if mode=='reserve':
            if len(s['records'])>=s['limit'] or any(r['requestDigest']==request['requestDigest'] or r['status']=='reserved' for r in s['records']):raise RecoveryHeld('cvi-unavailable')
            r=dict(requestDigest=request['requestDigest'],receipt='fixture-receipt-'+uuid.uuid4().hex,status='reserved',at=now,spentAt=None);s['records'].append(r)
        else:
            rows=[r for r in s['records'] if r['requestDigest']==request['requestDigest'] and r['receipt']==request['receipt']]
            if request['status']!='reserved' or len(rows)!=1 or rows[0]['status']!='reserved':raise RecoveryHeld('cvi-unavailable')
            r=rows[0];r['status']='spent';r['spentAt']=now
        s['clock']=now;journal_save(root,s,witness,crash_at=crash_at,witness_crash_at=witness_crash_at)
        return dict(storeId=s['storeId'],bindingDigest=s['bindingDigest'],requestDigest=r['requestDigest'],now=now,receipt=r['receipt'],status=r['status'])


def inspect_boundary(root,request,*,witness=None):
    """Scoped read-only evidence, not an activation or global-quiescence grant.

    Observe time durably without changing records, capacity or expiry. A pinned
    witness is checked when configured; coordinated rollback remains outside
    this local fixture's guarantee.
    """
    if (not isinstance(request,dict) or set(request)!={'storeId','bindingDigest','challenge','now'} or
        not digest(request['bindingDigest']) or not digest(request['challenge']) or not integer(request['now'])):raise RecoveryHeld('cvi-unavailable')
    with journal_locked(root,request['storeId'],'replay',witness) as root:
        s=load(root,request['storeId']);now=request['now']
        if request['bindingDigest']!=s['bindingDigest'] or not s['clock']<=now<s['expires']:raise RecoveryHeld('cvi-unavailable')
        if now>s['clock']:
            s['clock']=now;journal_save(root,s,witness)
        pending=sum(r['status']=='reserved' for r in s['records']);count=len(s['records'])
        return dict(storeId=s['storeId'],bindingDigest=s['bindingDigest'],challenge=request['challenge'],now=now,clock=s['clock'],expiresAt=s['expires'],limit=s['limit'],recordCount=count,pendingCount=pending,spentCount=count-pending,journalDigest=hashlib.sha256(read_private(root/'ledger.json')).hexdigest(),status='replay-pending' if pending else ('replay-exhausted' if count>=s['limit'] else 'replay-idle'),permissions=dict(write=False,activate=False,renew=False,sign=False,resume=False))
