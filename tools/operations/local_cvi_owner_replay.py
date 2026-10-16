"""TEST-ONLY native-owner replay mutation. No hosted or raw-write fallback.

Lock order is replay/witness, then SQLite. Trusted configuration carries the
original private lease and pinned verifier. Public requests carry neither.
Independent administration and transition-wide authority gating remain open.
"""
from copy import deepcopy
import secrets
import subprocess
import json
from pathlib import Path
from local_recovery_abuse import integer,RecoveryHeld
import local_cvi_replay as replay
import local_cvi_writer_lease as leases
import local_cvi_transaction as transactions
from local_cvi_mandatory_adapter import control_metadata
from local_cvi_witness import journal_locked


def operate(root,request,mode,config,rpc,clock,*,witness=None,crash_at=None,witness_crash_at=None):
    replay._validate_operation(request,mode)
    required={'nativeRoot','lease','ownerDigest','authorityPin','readerPrincipal','minimumRevision','replayStoreId','bindingDigest','node','verifier'}
    if (not isinstance(config,dict) or set(config)!=required or not callable(rpc) or not callable(clock) or
        not isinstance(config['lease'],dict) or not leases.hex64(config['ownerDigest']) or
        not leases.hex64(config['readerPrincipal']) or not integer(config['minimumRevision']) or
        config['replayStoreId']!=request['storeId'] or config['bindingDigest']!=request['bindingDigest']):raise RecoveryHeld('owner-replay-unavailable')
    # A callback cannot rewrite the original lease, pin, scope or request.
    config=deepcopy(config);request=deepcopy(request)
    last=request['now'];floor=config['minimumRevision']
    def now():
        nonlocal last
        at=clock()
        if not integer(at) or at<last:raise RecoveryHeld('owner-replay-unavailable')
        last=at;return at
    with journal_locked(root,request['storeId'],'replay',witness) as locked_root:
        # No remote proof obtained before these locks can authorize a mutation.
        with transactions.connection(Path(config['nativeRoot'])) as db:
            def verify_current():
                nonlocal floor
                at=now();leases.assert_writer(db,config['lease'],config['ownerDigest'],at)
                current=control_metadata(db,at);nonce=secrets.token_bytes(32).hex()
                evidence=deepcopy(rpc(dict(stage='owner-read',nonce=nonce,current=current,minimumRevision=floor)))
                finished=now();leases.assert_writer(db,config['lease'],config['ownerDigest'],finished)
                if control_metadata(db,finished)!=current:raise RecoveryHeld('owner-replay-unavailable')
                payload=dict(pin=config['authorityPin'],readerPrincipal=config['readerPrincipal'],nonce=nonce,current=current,minimumRevision=floor,now=finished,evidence=evidence)
                checked=subprocess.run([config['node'],config['verifier']],input=json.dumps(payload),capture_output=True,text=True,timeout=3)
                if checked.returncode:raise RecoveryHeld('owner-replay-unavailable')
                result=json.loads(checked.stdout)
                if set(result)!={'revision'} or not integer(result['revision']) or result['revision']<floor:raise RecoveryHeld('owner-replay-unavailable')
                checked_at=now();leases.assert_writer(db,config['lease'],config['ownerDigest'],checked_at)
                request_evidence=evidence.get('request',{}) if isinstance(evidence,dict) else {}
                if not integer(request_evidence.get('issuedAt')) or not integer(request_evidence.get('expiresAt')) or not request_evidence['issuedAt']<=checked_at<request_evidence['expiresAt']:raise RecoveryHeld('owner-replay-unavailable')
                floor=result['revision'];return checked_at
            verify_current()
            # A failed final proof keeps the already-saved reservation/consumption
            # intact and returns no acknowledgment. It cannot retry or refund.
            return replay._operate_locked(locked_root,request,mode,crash_at,witness=witness,witness_crash_at=witness_crash_at,before_save=verify_current,after_save=verify_current)
