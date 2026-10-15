"""Synthetic-only recovery abuse/restart rehearsal, never imported by a live runner.

A locked, checksummed journal reserves attempts before any simulated provider work.
A two-file checkpoint detects interrupted writes and one-sided rollback, not a
coordinated rollback of the entire directory. No emails, codes, passwords or JWTs
are accepted by or stored in this ledger. Limits are caller-supplied fixture values.
"""
from contextlib import contextmanager
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import uuid
from local_recovery_evidence import private_root, read_private, durable_create


class RecoveryHeld(ValueError):
    pass


def encoded(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()


def integer(value):
    return type(value) is int and 0 <= value <= 2**53-1


def policy_valid(policy):
    fields = {'guesses', 'sends', 'total', 'resend_interval', 'code_ttl', 'expires'}
    return (isinstance(policy, dict) and set(policy) == fields and
            all(integer(v) and v > 0 for v in policy.values()) and
            policy['total'] <= 128 and policy['guesses'] <= policy['total'] and
            policy['sends'] <= policy['total'])


def sync_root(root):
    fd = os.open(root, os.O_RDONLY)
    try: os.fsync(fd)
    finally: os.close(fd)


def prepare(root, policy, now):
    """Explicit fixture creation only. Existing/missing runtime state is never reseeded."""
    root = private_root(root)
    if list(root.iterdir()) or not policy_valid(policy) or not integer(now) or now >= policy['expires']:
        raise RecoveryHeld('recovery-unavailable')
    store_id = str(uuid.uuid4())
    state = dict(version=1, store_id=store_id, policy=policy, clock=now, records=[])
    durable_create(root/'lock', b'fixture-lock-v1')
    durable_create(root/'pending', b'initializing')
    payload = encoded(state)
    durable_create(root/'ledger.json', payload)
    durable_create(root/'checkpoint.json', encoded({'sha256': hashlib.sha256(payload).hexdigest()}))
    (root/'pending').unlink();sync_root(root)
    return dict(store_id=store_id, policy_digest=hashlib.sha256(encoded(policy)).hexdigest())


def validate(state, expected):
    if (not isinstance(expected, dict) or set(expected) != {'store_id', 'policy_digest'} or
            not isinstance(state, dict) or set(state) != {'version', 'store_id', 'policy', 'clock', 'records'} or
            type(state['version']) is not int or state['version'] != 1 or
            state['store_id'] != expected['store_id'] or
            not policy_valid(state['policy']) or
            hashlib.sha256(encoded(state['policy'])).hexdigest() != expected['policy_digest'] or
            not integer(state['clock']) or not isinstance(state['records'], list) or
            len(state['records']) > state['policy']['total']):
        raise RecoveryHeld('recovery-unavailable')
    ids = set();generations = {};last_send = {};guesses = {};sends = {};last = 0
    reserved = 0;retired_epoch=0;retirement_ids=set()
    for item in state['records']:
        if (not isinstance(item, dict) or set(item) != ({'id', 'subject', 'kind', 'generation', 'at', 'state'}|({'retirement'} if item.get('state')=='retired' else set())) or
                not isinstance(item['id'], str) or not re.fullmatch(r'fixture-operation-[0-9a-f]{32}', item['id']) or
                item['id'] in ids or not isinstance(item['subject'], str) or
                not re.fullmatch(r'fixture-subject-[a-z0-9]{1,24}', item['subject']) or
                item['kind'] not in ('send', 'verify') or item['state'] not in ('reserved', 'resetting', 'completed', 'rejected', 'held', 'retired') or
                (item['state']=='resetting' and item['kind']!='verify') or
                not integer(item['at']) or not last <= item['at'] <= state['clock'] or item['at'] >= state['policy']['expires'] or
                not integer(item['generation']) or item['generation'] < 1 or reserved):
            raise RecoveryHeld('recovery-unavailable')
        if item['state']=='retired':
            retirement=item['retirement']
            if (not isinstance(retirement,dict) or set(retirement)!={'version','previous_state','fence_epoch','at','evidence_digest','fence_id','cleanup_id'} or
                    type(retirement['version']) is not int or retirement['version']!=1 or
                    retirement['previous_state'] not in ('reserved','resetting','held') or
                    (retirement['previous_state']=='resetting' and item['kind']!='verify') or
                    not integer(retirement['fence_epoch']) or retirement['fence_epoch']<1 or
                    not integer(retirement['at']) or not item['at']<=retirement['at']<=state['clock'] or
                    not isinstance(retirement['evidence_digest'],str) or not re.fullmatch(r'[a-f0-9]{64}',retirement['evidence_digest']) or
                    any(not isinstance(retirement[k],str) or not re.fullmatch(r'fixture-evidence-[a-f0-9]{32}',retirement[k]) for k in ('fence_id','cleanup_id'))):
                raise RecoveryHeld('recovery-unavailable')
            if (retirement['fence_epoch']<=retired_epoch or retirement['fence_id']==retirement['cleanup_id'] or
                    retirement['fence_id'] in retirement_ids or retirement['cleanup_id'] in retirement_ids):
                raise RecoveryHeld('recovery-unavailable')
            retired_epoch=retirement['fence_epoch'];retirement_ids.update((retirement['fence_id'],retirement['cleanup_id']))
        ids.add(item['id']);last=max(item['at'],item['retirement']['at'] if item['state']=='retired' else item['at']);subject=item['subject']
        if item['kind'] == 'send':
            if item['generation'] != generations.get(subject, 0)+1:
                raise RecoveryHeld('recovery-unavailable')
            if subject in last_send and item['at'] < last_send[subject]+state['policy']['resend_interval']:
                raise RecoveryHeld('recovery-unavailable')
            generations[subject]=item['generation'];last_send[subject]=item['at'];sends[subject]=sends.get(subject,0)+1
        else:
            if item['generation'] != generations.get(subject) or item['at'] >= last_send[subject]+state['policy']['code_ttl']:
                raise RecoveryHeld('recovery-unavailable')
            guesses[subject]=guesses.get(subject,0)+1
        if guesses.get(subject,0) > state['policy']['guesses'] or sends.get(subject,0) > state['policy']['sends']:
            raise RecoveryHeld('recovery-unavailable')
        if item['state'] in ('reserved', 'resetting', 'held'): reserved += 1


@contextmanager
def locked(root):
    fd = None
    try:
        root=private_root(root)
        read_private(root/'lock')
        fd=os.open(root/'lock', os.O_RDWR | os.O_NOFOLLOW)
        if not stat.S_ISREG(os.fstat(fd).st_mode) or os.fstat(fd).st_mode & 0o077:
            raise RecoveryHeld('recovery-unavailable')
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield root
    except (OSError, ValueError, TypeError, KeyError, AttributeError):
        raise RecoveryHeld('recovery-unavailable') from None
    finally:
        if fd is not None: os.close(fd)


def load(root, expected):
    if any((root/name).exists() or (root/name).is_symlink() for name in ('pending', 'ledger.next', 'checkpoint.next')):
        raise RecoveryHeld('recovery-unavailable')
    payload=read_private(root/'ledger.json')
    if json.loads(read_private(root/'checkpoint.json')) != {'sha256': hashlib.sha256(payload).hexdigest()}:
        raise RecoveryHeld('recovery-unavailable')
    state=json.loads(payload);validate(state,expected);return state


def save(root, state, *, crash_at=None):
    """Test interruption hook leaves a durable pending marker at every uncertain stage."""
    payload=encoded(state)
    durable_create(root/'pending', b'updating');sync_root(root)
    if crash_at == 'pending': os._exit(71)
    durable_create(root/'ledger.next',payload);os.replace(root/'ledger.next',root/'ledger.json');sync_root(root)
    if crash_at == 'ledger': os._exit(71)
    durable_create(root/'checkpoint.next',encoded({'sha256':hashlib.sha256(payload).hexdigest()}))
    os.replace(root/'checkpoint.next',root/'checkpoint.json');sync_root(root)
    if crash_at == 'checkpoint': os._exit(71)
    (root/'pending').unlink();sync_root(root)


def reserve(root, expected, *, subject, kind, generation, now, operation_id, crash_at=None):
    with locked(root) as root:
        state=load(root,expected);policy=state['policy'];records=state['records']
        if (not integer(now) or not state['clock'] <= now < policy['expires'] or
                not isinstance(subject,str) or not re.fullmatch(r'fixture-subject-[a-z0-9]{1,24}',subject) or
                kind not in ('send','verify') or not isinstance(operation_id,str) or
                not re.fullmatch(r'fixture-operation-[0-9a-f]{32}',operation_id) or
                any(x['state'] in ('reserved','resetting','held') or x['id']==operation_id for x in records) or
                len(records)>=policy['total']):
            raise RecoveryHeld('recovery-unavailable')
        own=[x for x in records if x['subject']==subject]
        sends=[x for x in own if x['kind']=='send'];guesses=[x for x in own if x['kind']=='verify']
        if kind=='send':
            if generation is not None or len(sends)>=policy['sends'] or (sends and now<sends[-1]['at']+policy['resend_interval']):
                raise RecoveryHeld('recovery-unavailable')
            selected=len(sends)+1
        else:
            if (not integer(generation) or not sends or generation!=sends[-1]['generation'] or sends[-1]['state']!='completed' or
                    any(x['state']=='retired' and x['generation']==generation for x in own) or
                    len(guesses)>=policy['guesses'] or now>=sends[-1]['at']+policy['code_ttl']):
                raise RecoveryHeld('recovery-unavailable')
            selected=generation
        records.append(dict(id=operation_id,subject=subject,kind=kind,generation=selected,at=now,state='reserved'))
        state['clock']=now;validate(state,expected);save(root,state,crash_at=crash_at)
        return dict(operation_id=operation_id,generation=selected)


def claim_reset(root, expected, operation_id, *, now):
    """Test-only second atomic phase, required before the simulated password update."""
    with locked(root) as root:
        state=load(root,expected)
        matches=[x for x in state['records'] if x['id']==operation_id]
        if (len(matches)!=1 or matches[0]['kind']!='verify' or matches[0]['state']!='reserved' or
                not integer(now) or not state['clock']<=now<state['policy']['expires']):
            raise RecoveryHeld('recovery-unavailable')
        item=matches[0];sends=[x for x in state['records'] if x['subject']==item['subject'] and x['kind']=='send']
        if not sends or now>=sends[-1]['at']+state['policy']['code_ttl']:
            raise RecoveryHeld('recovery-unavailable')
        item['state']='resetting';state['clock']=now;validate(state,expected);save(root,state)


def finish(root, expected, operation_id, *, outcome, cleanup_verified, crash_at=None):
    with locked(root) as root:
        state=load(root,expected)
        matches=[x for x in state['records'] if x['id']==operation_id]
        if len(matches)!=1 or matches[0]['state'] not in ('reserved','resetting') or outcome not in ('completed','rejected','uncertain') or type(cleanup_verified) is not bool:
            raise RecoveryHeld('recovery-unavailable')
        matches[0]['state']=outcome if cleanup_verified and outcome!='uncertain' else 'held'
        validate(state,expected);save(root,state,crash_at=crash_at)


def inspect(root, expected):
    with locked(root) as root: return load(root,expected)


def run(root, expected, *, operation, **reservation):
    """The injected callback is synthetic only. No success is a customer authorization."""
    try: receipt=reserve(root,expected,**reservation)
    except RecoveryHeld: return {'status':'unavailable'}
    try:
        result=operation()
        if not isinstance(result,dict) or set(result)!={'outcome','cleanup_verified'}:
            raise ValueError()
        finish(root,expected,receipt['operation_id'],**result)
        return {'status':'rehearsalComplete' if result=={'outcome':'completed','cleanup_verified':True} else 'unavailable'}
    except Exception:
        try: finish(root,expected,receipt['operation_id'],outcome='uncertain',cleanup_verified=False)
        except RecoveryHeld: pass
        return {'status':'unavailable'}
