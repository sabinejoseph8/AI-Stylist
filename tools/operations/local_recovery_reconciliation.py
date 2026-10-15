"""Synthetic-only crash reconciliation; no provider, account or deployment access.

Two independently signed fixture witnesses and a trusted external fence epoch are
required. HMAC keys are injected by tests, never stored in the recovery journal.
These attestations simulate facts; they are not real provider guarantees.
"""
import hashlib
import hmac
import re
import local_recovery_abuse as ledger

BASE={'store_id','policy_digest','operation_id','subject','generation','record_digest','ledger_digest'}
COMMON=BASE|{'version','role','evidence_id','issued_at','expires_at','fence_epoch'}


def digest(value):return hashlib.sha256(ledger.encoded(value)).hexdigest()


def challenge_for(state,expected,operation_id):
    matches=[item for item in state['records'] if item['id']==operation_id]
    if len(matches)!=1 or matches[0]['state'] not in ('reserved','resetting','held'):
        raise ledger.RecoveryHeld('recovery-unavailable')
    record=matches[0]
    return dict(store_id=expected['store_id'],policy_digest=expected['policy_digest'],operation_id=operation_id,
                subject=record['subject'],generation=record['generation'],record_digest=digest(record),ledger_digest=digest(state))


def challenge(root,expected,operation_id):
    with ledger.locked(root) as root:return challenge_for(ledger.load(root,expected),expected,operation_id)


def verified(witness,key,role,binding,now,max_age,epoch):
    extra={'worker_fenced','capabilities_retired'} if role=='fence' else {'provider_final','sessions_absent','all_correlated','fence_digest'}
    if (not isinstance(witness,dict) or set(witness)!={'body','signature'} or
            not isinstance(witness['body'],dict) or set(witness['body'])!=COMMON|extra or
            not isinstance(witness['signature'],str) or not re.fullmatch(r'[a-f0-9]{64}',witness['signature'])):
        raise ledger.RecoveryHeld('recovery-unavailable')
    body=witness['body']
    if (any(body[k]!=binding[k] or type(body[k]) is not type(binding[k]) for k in BASE) or
            type(body['version']) is not int or body['version']!=1 or body['role']!=role or
            not isinstance(body['evidence_id'],str) or not re.fullmatch(r'fixture-evidence-[a-f0-9]{32}',body['evidence_id']) or
            not all(ledger.integer(body[k]) for k in ('issued_at','expires_at','fence_epoch')) or
            body['fence_epoch']!=epoch or not body['issued_at']<=now<body['expires_at']<=body['issued_at']+max_age):
        raise ledger.RecoveryHeld('recovery-unavailable')
    flags=['worker_fenced','capabilities_retired'] if role=='fence' else ['provider_final','sessions_absent','all_correlated']
    if any(body[k] is not True for k in flags):raise ledger.RecoveryHeld('recovery-unavailable')
    if role=='cleanup' and (not isinstance(body['fence_digest'],str) or not re.fullmatch(r'[a-f0-9]{64}',body['fence_digest'])):
        raise ledger.RecoveryHeld('recovery-unavailable')
    signature=hmac.new(key,ledger.encoded(body),hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature,witness['signature']):raise ledger.RecoveryHeld('recovery-unavailable')
    return body


def reconcile(root,expected,operation_id,*,fence,cleanup,fence_key,cleanup_key,fence_epoch,now,max_age,crash_at=None):
    """Retire unresolved work only. Never reset a password, refund or recreate a grant.

    fence_epoch must come from a trusted independent authority, not the witnesses
    or the local journal. The fixture caller simulates that authority explicitly.
    """
    if (not isinstance(fence_key,bytes) or not isinstance(cleanup_key,bytes) or
            len(fence_key)!=32 or len(cleanup_key)!=32 or fence_key==cleanup_key or
            not ledger.integer(fence_epoch) or fence_epoch<1 or not ledger.integer(now) or
            not ledger.integer(max_age) or not 0<max_age<=300):
        raise ledger.RecoveryHeld('recovery-unavailable')
    with ledger.locked(root) as root:
        state=ledger.load(root,expected)
        if now<state['clock']:raise ledger.RecoveryHeld('recovery-unavailable')
        binding=challenge_for(state,expected,operation_id)
        f=verified(fence,fence_key,'fence',binding,now,max_age,fence_epoch)
        c=verified(cleanup,cleanup_key,'cleanup',binding,now,max_age,fence_epoch)
        if (f['issued_at']<state['clock'] or c['issued_at']<f['issued_at'] or c['fence_digest']!=digest(fence) or
                f['evidence_id']==c['evidence_id']):raise ledger.RecoveryHeld('recovery-unavailable')
        retired=[item['retirement'] for item in state['records'] if item['state']=='retired']
        if any(item['fence_epoch']>=fence_epoch or f['evidence_id'] in (item['fence_id'],item['cleanup_id']) or
               c['evidence_id'] in (item['fence_id'],item['cleanup_id']) for item in retired):
            raise ledger.RecoveryHeld('recovery-unavailable')
        record=next(item for item in state['records'] if item['id']==operation_id)
        record['retirement']=dict(version=1,previous_state=record['state'],fence_epoch=fence_epoch,at=now,
                                  evidence_digest=digest({'fence':fence,'cleanup':cleanup}),
                                  fence_id=f['evidence_id'],cleanup_id=c['evidence_id'])
        record['state']='retired';state['clock']=now
        ledger.validate(state,expected);ledger.save(root,state,crash_at=crash_at)
        return dict(status='retired',operation_id=operation_id,fence_epoch=fence_epoch)
