"""Local planning fixture only; never grants customer access or restores a host.

The supplied checkpoint stands in for an independently recovered authority.
Authenticating evidence cannot prove it is latest without that trusted anchor.
All keys here belong to synthetic fixtures, never the permanent backup runtime.
"""
import hashlib
import hmac
import json

STEPS=('restore_isolated','replay_deletions','preserve_spending','verify_isolation')

class RecoveryHeld(ValueError):pass


def encode(value):return json.dumps(value,sort_keys=True,separators=(',',':')).encode()

def sign_fixture(value,key):
    body=encode(value)
    return body,hmac.digest(key,body,'sha256')


def inspect_evidence(body,signature,key,checkpoint,*,project,now,backup_at,archive_digest):
    try:
        if (not isinstance(body,bytes) or len(body)>65536 or not isinstance(key,bytes) or len(key)!=32 or
                not isinstance(signature,bytes) or not hmac.compare_digest(signature,hmac.digest(key,body,'sha256'))):
            raise RecoveryHeld()
        evidence=json.loads(body)
        if (not isinstance(checkpoint,dict) or set(checkpoint)!={'project','sequence','sha256','as_of'} or
                checkpoint['project']!=project or
                type(checkpoint['sequence']) is not int or checkpoint['sequence']<1 or
                type(checkpoint['as_of']) is not int or not backup_at<=checkpoint['as_of']<=now or
                checkpoint['sha256']!=hashlib.sha256(body).hexdigest() or
                not isinstance(evidence,dict) or set(evidence)!={'version','project','sequence','as_of','backup_sha256','backup_at','deleted_keys','deleted_accounts','reservations'} or
                type(evidence['version']) is not int or evidence['version']!=1 or
                evidence['project']!=project or evidence['sequence']!=checkpoint['sequence'] or
                type(evidence['sequence']) is not int or evidence['as_of']!=checkpoint['as_of'] or
                type(evidence['as_of']) is not int or
                evidence['backup_sha256']!=archive_digest or type(evidence['backup_at']) is not int or
                evidence['backup_at']!=backup_at):
            raise RecoveryHeld()
        for field in ['deleted_keys','deleted_accounts']:
            values=evidence[field]
            if (not isinstance(values,list) or len(values)>1000 or len(set(values))!=len(values) or
                    any(not isinstance(v,str) or not 0<len(v)<=256 for v in values)):
                raise RecoveryHeld()
        reservations=evidence['reservations']
        if (not isinstance(reservations,dict) or len(reservations)>1000 or
                any(not isinstance(k,str) or not 0<len(k)<=128 or v not in ('reserved','held','completed')
                    for k,v in reservations.items())):raise RecoveryHeld()
        return evidence
    except (ValueError,TypeError,KeyError):raise RecoveryHeld('local-evidence-held') from None


def rehearse(*,archive,archive_signature,archive_key,evidence,checkpoint,evidence_key,
             project,backup_at,now,expires_at,steps):
    """Simulated replacement machine admission and ordering, no release action.

    Fixtures use HMAC to exercise missing/wrong-key behavior; this does not
    replace the real AES-GCM archive format or define a production trust store.
    """
    try:
        if (not isinstance(project,str) or not project or type(backup_at)is not int or
                type(now)is not int or type(expires_at)is not int or
                not 0<=backup_at<=now<expires_at or expires_at-backup_at>7*86400 or
                not isinstance(archive,bytes) or not 5<len(archive)<=4*1024*1024 or
                not isinstance(archive_key,bytes) or len(archive_key)!=32 or
                not isinstance(archive_signature,bytes) or
                not hmac.compare_digest(archive_signature,hmac.digest(archive_key,archive,'sha256')) or
                not isinstance(evidence,list) or not 1<=len(evidence)<=3 or
                not isinstance(steps,dict) or set(steps)!=set(STEPS)):
            raise RecoveryHeld()
        verified=[inspect_evidence(body,signature,evidence_key,checkpoint,
                   project=project,now=now,backup_at=backup_at,archive_digest=hashlib.sha256(archive).hexdigest()) for body,signature in evidence]
        if any(value!=verified[0] for value in verified):raise RecoveryHeld()
        completed=[]
        for name in STEPS:
            if steps[name](archive,verified[0]) is not True:raise RecoveryHeld()
            completed.append(name)
        return {'local_plan_ready':True,'customer_access_enabled':False,'hosted_restore_verified':False,
                'completed':completed,'sequence':checkpoint['sequence']}
    except Exception:
        # No fixture content/key, partial result or automatic retry escapes failure.
        raise RecoveryHeld('local-mac-loss-recovery-held') from None
