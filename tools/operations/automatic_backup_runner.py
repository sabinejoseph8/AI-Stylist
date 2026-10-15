"""Inactive coordinator for an already reserved cumulative-budget attempt.

No CLI, scheduler or credential reader. Production source/recovery adapters
must satisfy all gates before this coordinator may release a success signal.
"""
import hashlib
from b2_automatic_budget import MAX_ENVELOPE, AutomaticHeld, run_reserved


class RunnerHeld(RuntimeError):
    pass


class RequestAllowance:
    """One four-request plan, not a fresh provider-usage observation.

Construct only inside run_reserved's callback. It has no refunds or retries;
all transport functions it admits must retain their fixed no-retry contracts.
"""
    def __init__(self, *, started, expires):
        self.started,self.expires=started,expires
        self.phase=0
        self.uploaded_size=None

    def guard(self, ledger, *, now, operation, upload_bytes=0,download_bytes=0,class_b=0,class_c=0):
        if (ledger is not None or type(now)is not int or
                not self.started <= now < min(self.started+240,self.expires)):
            raise RunnerHeld('automatic-transport-context-held')
        phases=((1,0,0),(2,1,0),(1,0,1))
        if self.phase>=len(phases):raise RunnerHeld('automatic-request-plan-exhausted')
        count,upload,download=phases[self.phase]
        if (class_b!=count or class_c!=count or type(upload_bytes)is not int or type(download_bytes)is not int or
                upload_bytes<0 or download_bytes<0 or
                (upload and not 36<=upload_bytes<=MAX_ENVELOPE) or
                (not upload and upload_bytes!=0) or
                (download and download_bytes!=self.uploaded_size) or
                (not download and download_bytes!=0)):
            raise RunnerHeld('automatic-request-plan-held')
        if upload:self.uploaded_size=upload_bytes
        self.phase+=1  # Burn admission before network execution, even on failure.
        try:return operation()
        except Exception:raise RunnerHeld('automatic-transport-held') from None

    def complete(self):
        if self.phase!=3:raise RunnerHeld('automatic-request-plan-incomplete')


GATES={'runtime_verified','credential_permissions_verified','source_snapshot_supported',
       'restore_accepted_for_scope','deletion_reconciliation_supported','sole_use_confirmed',
       'approved_cumulative_policy'}


def run_once(policy, *, now, expires, gates, capture, verify, transfer, reconcile, monitor):
    """Composition boundary, simulated until real source/restore gates pass.

capture must enforce the source-egress bound. verify must authenticate the
archive and bind its exact fresh DB/photo manifest. No boolean gate alone is
evidence; approved adapters and recorded acceptance supply these inputs.
"""
    if not isinstance(gates,dict) or set(gates)!=GATES or any(v is not True for v in gates.values()):
        raise RunnerHeld('automatic-activation-gates-held')
    def operation():
        monitor('start',False)
        value=capture()
        if not isinstance(value,bytes) or not 36<=len(value)<=MAX_ENVELOPE or not value.startswith(b'ASB1'):
            raise RunnerHeld('automatic-source-size-held')
        if verify(value) is not True:raise RunnerHeld('automatic-source-proof-held')
        allowance=RequestAllowance(started=now(),expires=expires)
        result=transfer(value,allowance.guard)
        allowance.complete()
        if (not isinstance(result,dict) or result.get('candidate_round_trip_verified') is not True or
                result.get('encrypted_bytes')!=len(value)):
            raise RunnerHeld('automatic-readback-proof-held')
        if reconcile() is not True:raise RunnerHeld('automatic-current-evidence-held')
        monitor('success',True)
        return {'recovery_point_verified':True,'encrypted_bytes':len(value),'sha256':hashlib.sha256(value).hexdigest(),
                'scheduler_installed':False}
    try:return run_reserved(policy,now=now(),operation=operation)
    except Exception:
        try:monitor('failure',False)
        except Exception:pass
        raise RunnerHeld('automatic-run-held') from None
