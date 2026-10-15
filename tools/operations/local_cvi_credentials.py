"""Disposable credential-generation authority; no real credentials accepted/stored.

Explicit synthetic bootstrap/rotation, never invoked from an HTTP request.
Uses a separate temporary journal, preserving all retired generation digests.
"""
import hashlib
import json
import uuid
from local_cvi_replay import digest
from local_recovery_abuse import integer, encoded, locked, save, sync_root, RecoveryHeld
from local_recovery_evidence import private_root, read_private, durable_create
from local_cvi_witness import journal_locked, journal_save


def prepare(root,scope_digest,expires,now):
    root=private_root(root)
    if list(root.iterdir()) or not digest(scope_digest) or not integer(expires) or not integer(now) or now>=expires:raise RecoveryHeld('cvi-credentials-unavailable')
    s=dict(version=1,storeId=str(uuid.uuid4()),scopeDigest=scope_digest,expires=expires,clock=now,generations=[])
    durable_create(root/'lock',b'credential-fixture-lock');durable_create(root/'pending',b'initializing')
    b=encoded(s);durable_create(root/'ledger.json',b);durable_create(root/'checkpoint.json',encoded({'sha256':hashlib.sha256(b).hexdigest()}))
    (root/'pending').unlink();sync_root(root);return s['storeId']


def load(root,store_id):
    if any((root/n).exists() or (root/n).is_symlink() for n in ('pending','ledger.next','checkpoint.next')):raise RecoveryHeld('cvi-credentials-unavailable')
    b=read_private(root/'ledger.json')
    if json.loads(read_private(root/'checkpoint.json'))!={'sha256':hashlib.sha256(b).hexdigest()}:raise RecoveryHeld('cvi-credentials-unavailable')
    s=json.loads(b)
    if (set(s)!={'version','storeId','scopeDigest','expires','clock','generations'} or type(s['version']) is not int or s['version']!=1 or
        s['storeId']!=store_id or not digest(s['scopeDigest']) or not integer(s['clock']) or not integer(s['expires']) or s['clock']>=s['expires'] or
        not isinstance(s['generations'],list) or len(s['generations'])>16):raise RecoveryHeld('cvi-credentials-unavailable')
    bindings=set();boots=set();last=0
    for i,r in enumerate(s['generations']):
        if (set(r)!={'generation','bindingDigest','bootDigest','at','active'} or type(r['generation']) is not int or r['generation']!=i+1 or
            not digest(r['bindingDigest']) or not digest(r['bootDigest']) or r['bindingDigest'] in bindings or r['bootDigest'] in boots or
            type(r['active']) is not bool or r['active']!=(i==len(s['generations'])-1) or not integer(r['at']) or not last<=r['at']<=s['clock']):raise RecoveryHeld('cvi-credentials-unavailable')
        bindings.add(r['bindingDigest']);boots.add(r['bootDigest']);last=r['at']
    return s


def activate(root,store_id,scope_digest,previous,binding_digest,boot_digest,now,crash_at=None,*,witness=None,witness_crash_at=None):
    with journal_locked(root,store_id,'credentials',witness) as root:
        s=load(root,store_id);rows=s['generations']
        if (scope_digest!=s['scopeDigest'] or type(previous) is not int or previous!=len(rows) or len(rows)>=16 or
            not digest(binding_digest) or not digest(boot_digest) or any(r['bindingDigest']==binding_digest or r['bootDigest']==boot_digest for r in rows) or
            not integer(now) or not s['clock']<=now<s['expires']):raise RecoveryHeld('cvi-credentials-unavailable')
        for r in rows:r['active']=False
        rows.append(dict(generation=previous+1,bindingDigest=binding_digest,bootDigest=boot_digest,at=now,active=True));s['clock']=now
        journal_save(root,s,witness,crash_at=crash_at,witness_crash_at=witness_crash_at)
        return dict(storeId=store_id,scopeDigest=scope_digest,bindingDigest=binding_digest,bootDigest=boot_digest,generation=previous+1)


def check(root,request,*,witness=None):
    if not isinstance(request,dict) or set(request)!={'storeId','scopeDigest','bindingDigest','bootDigest','generation','now'}:raise RecoveryHeld('cvi-credentials-unavailable')
    with journal_locked(root,request['storeId'],'credentials',witness) as root:
        s=load(root,request['storeId']);now=request['now']
        if not integer(now) or not s['clock']<=now<s['expires'] or not s['generations']:raise RecoveryHeld('cvi-credentials-unavailable')
        r=s['generations'][-1]
        expected=dict(storeId=s['storeId'],scopeDigest=s['scopeDigest'],bindingDigest=r['bindingDigest'],bootDigest=r['bootDigest'],generation=r['generation'],now=now)
        if request!=expected or type(request['generation']) is not int:raise RecoveryHeld('cvi-credentials-unavailable')
        # Preserve observed time without extending expiry or changing replay evidence.
        if now>s['clock']:
            s['clock']=now;journal_save(root,s,witness)
        return dict(**expected,active=True)
