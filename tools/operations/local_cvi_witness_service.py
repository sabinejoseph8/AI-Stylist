"""TEST-ONLY durable witness service journal. No hosted authentication or grants.

Roles here are service-owned fixture configuration, never incoming role claims.
Cryptographic request/proof verification belongs to the disconnected TS service.
"""
import os
import zlib
import hashlib
import json
import re
import secrets
from pathlib import Path
from local_recovery_abuse import locked,sync_root,encoded,integer,RecoveryHeld
from local_recovery_evidence import private_root,read_private,durable_create


def digest(v):return hashlib.sha256(encoded(v)).hexdigest()
def hex64(v):return isinstance(v,str) and re.fullmatch(r'[a-f0-9]{64}',v) is not None
FIELDS={'storeId','policyDigest','epochFloor','headFloor','observedClock','historyDigest'}


def valid_metadata(v):
    return isinstance(v,dict) and set(v)==FIELDS and isinstance(v['storeId'],str) and re.fullmatch(r'[a-f0-9-]{36}',v['storeId']) and all(hex64(v[k]) for k in ('policyDigest','headFloor','historyDigest')) and integer(v['epochFloor']) and integer(v['observedClock'])


def prepare(root,pin,current,now):
    root=private_root(root)
    if list(root.iterdir()) or not valid_metadata(current) or not integer(now) or now<current['observedClock'] or not isinstance(pin,dict) or set(pin)!={'authorityId','witnessId','storeId','policyDigest'} or any(pin[k]!=current[k] for k in ('storeId','policyDigest')):raise RecoveryHeld('witness-service-unavailable')
    s=dict(version=1,pin=pin,current=current,clock=now,revision=0,pending=None,operations=[],requests=[])
    durable_create(root/'lock',b'witness-service-fixture-lock');durable_create(root/'pending',b'initializing')
    data=encoded(s);durable_create(root/'ledger.json',data);durable_create(root/'checkpoint.json',encoded(dict(sha256=hashlib.sha256(data).hexdigest())))
    (root/'pending').unlink();sync_root(root)


# Compact only the physical representation. Logical rows and permanent tickets
# remain unchanged, with the same 128-row and 64 KiB stored-file limits.
_COMPACT=b'cvi-witness-zlib-v1\n'
_MAX_LOGICAL=262144

def _payload(state):
    raw=encoded(state)
    if len(raw)>_MAX_LOGICAL:raise RecoveryHeld('witness-service-unavailable')
    result=raw if len(raw)<=65536 else _COMPACT+zlib.compress(raw,9)
    if len(result)>65536:raise RecoveryHeld('witness-service-unavailable')
    return result

def _decode(data):
    if not data.startswith(_COMPACT):return json.loads(data)
    decoder=zlib.decompressobj()
    raw=decoder.decompress(data[len(_COMPACT):],_MAX_LOGICAL+1)
    if len(raw)>_MAX_LOGICAL or not decoder.eof or decoder.unconsumed_tail or decoder.unused_data:raise RecoveryHeld('witness-service-unavailable')
    return json.loads(raw)

def _save(root,state,crash_at=None):
    # Validate capacity before beginning the durable pending transaction.
    data=_payload(state)
    durable_create(root/'pending',b'updating');sync_root(root)
    if crash_at=='pending':os._exit(71)
    durable_create(root/'ledger.next',data);os.replace(root/'ledger.next',root/'ledger.json');sync_root(root)
    if crash_at=='ledger':os._exit(71)
    durable_create(root/'checkpoint.next',encoded(dict(sha256=hashlib.sha256(data).hexdigest())));os.replace(root/'checkpoint.next',root/'checkpoint.json');sync_root(root)
    if crash_at=='checkpoint':os._exit(71)
    (root/'pending').unlink();sync_root(root)


def load(root,pin):
    if any((root/n).exists() or (root/n).is_symlink() for n in ('pending','ledger.next','checkpoint.next')):raise RecoveryHeld('witness-service-unavailable')
    data=read_private(root/'ledger.json')
    if json.loads(read_private(root/'checkpoint.json'))!={'sha256':hashlib.sha256(data).hexdigest()}:raise RecoveryHeld('witness-service-unavailable')
    s=_decode(data)
    if (not isinstance(s,dict) or set(s)!={'version','pin','current','clock','revision','pending','operations','requests'} or type(s['version']) is not int or s['version']!=1 or s['pin']!=pin or not valid_metadata(s['current']) or any(s['current'][k]!=pin[k] for k in ('storeId','policyDigest')) or not integer(s['clock']) or s['clock']<s['current']['observedClock'] or not integer(s['revision']) or not isinstance(s['operations'],list) or len(s['operations'])>128 or not isinstance(s['requests'],list) or len(s['requests'])>128):raise RecoveryHeld('witness-service-unavailable')
    ids=set();tokens=set();challenges=set()
    for r in s['requests']:
        if not isinstance(r,dict) or set(r)!={'id','challenge','principalDigest','role','action','operationId','expectedRevision','issuedAt','expiresAt','token','state'} or not all(hex64(r[k]) for k in ('id','challenge','principalDigest','operationId','token')) or r['id'] in ids or r['token'] in tokens or r['challenge'] in challenges or r['state'] not in ('admitted','used') or r['role'] not in ('observer','writer','signer','reconciler') or r['action'] not in ('read','advance','reconcile') or not integer(r['expectedRevision']) or not integer(r['issuedAt']) or not integer(r['expiresAt']) or r['issuedAt']>=r['expiresAt'] or r['expiresAt']-r['issuedAt']>8000:raise RecoveryHeld('witness-service-unavailable')
        if (r['action']=='advance' and r['role']!='writer') or (r['action']=='reconcile' and r['role']!='reconciler'):raise RecoveryHeld('witness-service-unavailable')
        ids.add(r['id']);tokens.add(r['token']);challenges.add(r['challenge'])
    operations=set();prepared=[];previous=None;last_revision=0
    for o in s['operations']:
        if not isinstance(o,dict) or set(o)!={'id','principalDigest','revision','from','to','status'} or not hex64(o['id']) or o['id'] in operations or not hex64(o['principalDigest']) or not integer(o['revision']) or o['revision']>s['revision'] or not valid_metadata(o['from']) or not valid_metadata(o['to']) or o['status'] not in ('prepared','reconciled'):raise RecoveryHeld('witness-service-unavailable')
        if (any(o[k][field]!=pin[field] for k in ('from','to') for field in ('storeId','policyDigest')) or o['to']['epochFloor']<o['from']['epochFloor'] or not o['from']['observedClock']<=o['to']['observedClock']<=s['clock'] or o['revision']<=last_revision or (previous is not None and o['from']!=previous) or not any(r['action']=='advance' and r['operationId']==o['id'] and r['principalDigest']==o['principalDigest'] and r['state']=='used' for r in s['requests'])):raise RecoveryHeld('witness-service-unavailable')
        previous=o['to'];last_revision=o['revision'];operations.add(o['id'])
        if o['status']=='prepared':prepared.append(o)
    if (previous is not None and previous!=s['current']) or len(prepared)>1 or (prepared[0]['id'] if prepared else None)!=s['pending'] or (prepared and prepared[0]['to']!=s['current']):raise RecoveryHeld('witness-service-unavailable')
    return s


def operate(root,pin,actor,mode,args,now,crash_at=None):
    with locked(root) as root:
        s=load(root,pin)
        if not isinstance(actor,dict) or set(actor)!={'principalDigest','role'} or not hex64(actor['principalDigest']) or actor['role'] not in ('observer','writer','signer','reconciler') or not integer(now) or now<s['clock']:raise RecoveryHeld('witness-service-unavailable')
        if mode=='inspect':return s
        if mode=='claim-execution':
            if actor['role']!='writer' or not isinstance(args,dict) or set(args)!={'operationId','revision','challenge','issuedAt','expiresAt'} or not all(hex64(args[k]) for k in ('operationId','challenge')) or not all(integer(args[k]) for k in ('revision','issuedAt','expiresAt')) or not args['issuedAt']<=now<args['expiresAt'] or args['expiresAt']-args['issuedAt']>8000:raise RecoveryHeld('witness-service-unavailable')
            op=next((o for o in s['operations'] if o['id']==args['operationId'] and o['status']=='prepared' and o['principalDigest']==actor['principalDigest']),None)
            grant=next((r for r in s['requests'] if r['action']=='advance' and r['operationId']==args['operationId'] and r['principalDigest']==actor['principalDigest'] and r['state']=='used'),None)
            identity=digest(dict(execution=args['operationId'],revision=args['revision'],owner=actor['principalDigest']))
            if not op or not grant or s['pending']!=op['id'] or op['revision']!=args['revision'] or s['revision']!=args['revision'] or len(s['requests'])>=128 or any(r['id']==identity or r['challenge']==args['challenge'] for r in s['requests']):raise RecoveryHeld('witness-service-unavailable')
            s['requests'].append(dict(id=identity,challenge=args['challenge'],**actor,action='read',operationId=op['id'],expectedRevision=args['revision'],issuedAt=args['issuedAt'],expiresAt=args['expiresAt'],token=secrets.token_hex(32),state='used'))
            result=dict(status='execution-claimed',operationId=op['id'],revision=s['revision'],targetDigest=digest(op['to']),grantHash=grant['id'])
        elif mode=='admit':
            if not isinstance(args,dict) or set(args)!={'id','challenge','action','operationId','expectedRevision','issuedAt','expiresAt'} or not all(hex64(args[k]) for k in ('id','challenge','operationId')) or not integer(args['expectedRevision']) or not integer(args['issuedAt']) or not integer(args['expiresAt']) or not args['issuedAt']<=now<args['expiresAt'] or args['expiresAt']-args['issuedAt']>8000 or args['action'] not in ('read','advance','reconcile') or len(s['requests'])>=128 or any(r['id']==args['id'] or r['challenge']==args['challenge'] for r in s['requests']):raise RecoveryHeld('witness-service-unavailable')
            if (args['action']=='advance' and any(r['action']=='advance' and r['operationId']==args['operationId'] for r in s['requests'])):raise RecoveryHeld('witness-service-unavailable')
            if (args['action']=='advance' and actor['role']!='writer') or (args['action']=='reconcile' and actor['role']!='reconciler'):raise RecoveryHeld('witness-service-unavailable')
            token=secrets.token_hex(32);s['requests'].append(dict(**args,**actor,token=token,state='admitted'));result=dict(token=token)
        else:
            if not isinstance(args,dict) or 'token' not in args:raise RecoveryHeld('witness-service-unavailable')
            r=next((r for r in s['requests'] if r['token']==args['token'] and r['state']=='admitted' and r['principalDigest']==actor['principalDigest'] and r['role']==actor['role'] and r['action']==mode),None)
            if r is None or not r['issuedAt']<=now<r['expiresAt']:raise RecoveryHeld('witness-service-unavailable')
            r['state']='used';result=dict(status='held')
            if mode=='read' and set(args)=={'token'}:result=dict(status='read',revision=s['revision'],current=s['current'],pending=s['pending'])
            elif mode=='advance' and actor['role']=='writer' and set(args)=={'token','from','to'}:
                before,target=args['from'],args['to']
                if (s['pending'] is None and r['expectedRevision']==s['revision'] and not any(o['id']==r['operationId'] for o in s['operations']) and len(s['operations'])<128 and s['revision']<2**53-1 and before==s['current'] and valid_metadata(target) and all(target[k]==pin[k] for k in ('storeId','policyDigest')) and target['epochFloor']>=before['epochFloor'] and before['observedClock']<=target['observedClock']<=now and (target['epochFloor']!=before['epochFloor'] or target['headFloor']==before['headFloor']) and target['historyDigest']!=before['historyDigest']):
                    s['revision']+=1;s['current']=target;s['pending']=r['operationId'];s['operations'].append(dict(id=r['operationId'],principalDigest=actor['principalDigest'],revision=s['revision'],**{'from':before},to=target,status='prepared'));result=dict(status='advanced',revision=s['revision'],current=target,operationId=r['operationId'])
            elif mode=='reconcile' and actor['role']=='reconciler' and set(args)=={'token','targetDigest','ownerDigest','revision','validUntil'}:
                o=next((o for o in s['operations'] if o['id']==r['operationId'] and o['status']=='prepared'),None)
                if integer(args['revision']) and integer(args['validUntil']) and now<args['validUntil']<=r['expiresAt'] and o and s['pending']==o['id'] and r['expectedRevision']==s['revision']==args['revision']==o['revision'] and args['ownerDigest']==o['principalDigest'] and args['targetDigest']==digest(o['to']) and s['revision']<2**53-1:
                    o['status']='reconciled';s['pending']=None;s['revision']+=1;result=dict(status='reconciled',revision=s['revision'],current=s['current'],operationId=o['id'])
        s['clock']=now
        if crash_at=='before-save':raise RecoveryHeld('witness-service-unavailable')
        _save(root,s,crash_at=crash_at if crash_at in ('pending','ledger','checkpoint') else None)
        if crash_at=='after-save':raise RecoveryHeld('witness-service-unavailable')
        return result
