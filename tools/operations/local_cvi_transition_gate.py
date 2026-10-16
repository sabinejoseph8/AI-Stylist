"""TEST-ONLY original replay-gate primitive. No listener or activation fallback.

The configured proof source and verifier are mandatory trusted server ports.
This layer alone does not prove signatures, private JS adoption or all-writer
coverage. Those integrations must precede protected owner publication.
"""
from contextlib import contextmanager
from copy import deepcopy
import hashlib
import secrets
import threading
import uuid
from pathlib import Path
from local_recovery_abuse import encoded,integer,sync_root,RecoveryHeld
from local_recovery_evidence import durable_create,read_private
from local_cvi_witness import journal_locked,journal_save,TRANSITION_MARKER,load as witness_load,digest_file,digest_payload,_advance_head
from local_cvi_replay import _load_locked,digest
from local_cvi_mandatory_adapter import validate_command,ROLES
from local_cvi_writer_lease import actor_ok
from local_cvi_witness_service import valid_metadata


def sha(value):return hashlib.sha256(encoded(value)).hexdigest()
def canonical_uuid(value):
    try:return isinstance(value,str) and str(uuid.UUID(value))==value
    except (ValueError,AttributeError):return False


class _OriginalGate:
    __slots__=('_describe','_inspect','_finish','_hold')
    def __init__(self,describe,inspect,finish,hold):
        self._describe=describe;self._inspect=inspect;self._finish=finish;self._hold=hold
    def describe(self):return self._describe(self)
    def inspect(self,request):return self._inspect(self,request)
    def finish(self):return self._finish(self)
    def hold(self):return self._hold(self)


@contextmanager
def transition(root,scope,intent,proof_source,verify,clock,*,witness=None):
    """Hold replay/witness, never SQLite, until explicit verified completion.

    Scope/plan/callbacks are captured before awaiting external work. A copied
    handle cannot inspect, finish or retire the original. A retained marker
    never recreates its handle and is never automatically cleared on exit.
    """
    scope=deepcopy(scope);intent=deepcopy(intent);witness=deepcopy(witness)
    if (not isinstance(scope,dict) or set(scope)!={'storeId','bindingDigest','nativeStoreId','applicationExpiresAt','expiresAt'} or
        not canonical_uuid(scope['storeId']) or not canonical_uuid(scope['nativeStoreId']) or not digest(scope['bindingDigest']) or
        not all(integer(scope[k]) for k in ('applicationExpiresAt','expiresAt')) or
        not isinstance(intent,dict) or set(intent)!={'id','version','kind','args','actor','now','from','to'} or
        type(intent['version']) is not int or intent['version']!=1 or not integer(intent['now']) or
        not callable(proof_source) or not callable(verify) or not callable(clock)):
        raise RecoveryHeld('owner-transition-unavailable')
    validate_command(intent['kind'],intent['args'])
    if (sha({k:v for k,v in intent.items() if k!='id'})!=intent['id'] or not actor_ok(intent['actor'],ROLES[intent['kind']]) or
        not all(valid_metadata(intent[k]) for k in ('from','to')) or intent['from']==intent['to'] or
        any(intent[k]['storeId']!=scope['nativeStoreId'] for k in ('from','to')) or
        intent['from']['policyDigest']!=intent['to']['policyDigest'] or
        not intent['now']<scope['expiresAt']<=min(scope['applicationExpiresAt'],intent['now']+8000)):
        raise RecoveryHeld('owner-transition-unavailable')
    if intent['kind'] in ('activate','renew'):
        ttl=intent['args']['ttl']
        if not integer(ttl) or not 1<=ttl<=8000 or intent['now']+ttl>scope['applicationExpiresAt']:raise RecoveryHeld('owner-transition-unavailable')
    if intent['kind']=='renew':
        expiry=intent['args']['lease'].get('expiresAt')
        if not integer(expiry) or scope['expiresAt']>expiry:raise RecoveryHeld('owner-transition-unavailable')
    last=intent['now'];active=True;held=False;finished=False;finishing=False;original=None;challenges=set();operation_lock=threading.Lock()
    def observe_time():
        nonlocal last
        at=clock()
        if not integer(at) or at<last or at>=scope['expiresAt']:raise RecoveryHeld('owner-transition-unavailable')
        last=at;return at
    with journal_locked(root,scope['storeId'],'replay',witness) as locked_root:
        initial=_load_locked(locked_root,scope['storeId']);at=observe_time()
        if (initial['bindingDigest']!=scope['bindingDigest'] or initial['clock']>intent['now'] or
            scope['applicationExpiresAt']>initial['expires'] or at>=initial['expires'] or
            len(initial['records'])>=initial['limit'] or any(r['status']=='reserved' for r in initial['records'])):
            raise RecoveryHeld('owner-transition-unavailable')
        state_digest=sha({k:v for k,v in initial.items() if k!='clock'})
        marker=dict(version=1,operationId=intent['id'],intentDigest=sha(intent),**scope,
                    issuedAt=intent['now'],expectedNativeDigest=sha(intent['from']),targetNativeDigest=sha(intent['to']),
                    replayStateDigest=state_digest,initialJournalDigest=digest_file(locked_root))
        marker_bytes=encoded(marker);path=Path(locked_root)/TRANSITION_MARKER
        if witness is not None:_advance_head(locked_root,witness,digest_payload(read_private(Path(locked_root)/'ledger.json'),marker_bytes))
        # O_EXCL, file fsync then directory fsync precede any caller mutation.
        durable_create(path,marker_bytes);sync_root(locked_root)
        def require(caller):
            nonlocal held
            if caller is not original or not active or finished or held:raise RecoveryHeld('owner-transition-unavailable')
            try:
                now=observe_time()
                if read_private(path)!=marker_bytes:raise RecoveryHeld('owner-transition-unavailable')
                s=_load_locked(locked_root,scope['storeId'])
                if sha({k:v for k,v in s.items() if k!='clock'})!=state_digest or s['clock']>now:raise RecoveryHeld('owner-transition-unavailable')
                if witness is not None and witness_load(witness)['head']!=digest_file(locked_root):raise RecoveryHeld('owner-transition-unavailable')
                return s,now
            except Exception:
                held=True;raise
        def describe(caller):require(caller);return deepcopy(marker)
        def inspect(caller,raw):
            nonlocal held
            r=deepcopy(raw)
            s,now=require(caller)
            try:
                if (not isinstance(r,dict) or set(r)!={'storeId','bindingDigest','challenge','now'} or
                    r['storeId']!=scope['storeId'] or r['bindingDigest']!=scope['bindingDigest'] or not digest(r['challenge']) or
                    r['challenge'] in challenges or len(challenges)>=64 or not integer(r['now']) or not s['clock']<=r['now']<=now):
                    raise RecoveryHeld('owner-transition-unavailable')
                challenges.add(r['challenge'])
                if now>s['clock']:s['clock']=now;journal_save(locked_root,s,witness)
                require(caller)
                snapshot=dict(storeId=s['storeId'],bindingDigest=s['bindingDigest'],challenge=r['challenge'],now=r['now'],clock=s['clock'],
                              expiresAt=s['expires'],limit=s['limit'],recordCount=len(s['records']),pendingCount=0,spentCount=len(s['records']),
                              journalDigest=digest_file(locked_root),status='replay-idle',
                              permissions=dict(write=False,activate=False,renew=False,sign=False,resume=False))
                return dict(operationId=intent['id'],scopeDigest=sha(scope),snapshot=snapshot)
            except Exception:
                held=True;raise
        def finish(caller):
            nonlocal held,finished,finishing
            require(caller)
            if finishing:raise RecoveryHeld('owner-transition-unavailable')
            finishing=True
            try:
                nonce=secrets.token_hex(32)
                evidence=deepcopy(proof_source(deepcopy(marker),nonce))
                _,now=require(caller)
                checked=deepcopy(verify(deepcopy(marker),deepcopy(intent),nonce,evidence,now))
                require(caller)
                expected=dict(status='transition-finish-verified',operationId=intent['id'],targetDigest=sha(intent['to']),challenge=nonce)
                if not isinstance(checked,dict) or checked!=expected:raise RecoveryHeld('owner-transition-unavailable')
                # No user callback follows deletion. Unknown unlink/fsync results
                # hold this original handle, even when the file is already gone.
                if witness is not None:_advance_head(locked_root,witness,digest_payload(read_private(Path(locked_root)/'ledger.json')))
                path.unlink();sync_root(locked_root);finished=True
                return dict(status='transition-finished',operationId=intent['id'],scopeDigest=sha(scope),targetDigest=sha(intent['to']))
            except Exception:
                held=True;raise
            finally:finishing=False
        def hold(caller):
            nonlocal held
            if caller is not original or not active:raise RecoveryHeld('owner-transition-unavailable')
            held=True
        def exclusive(action):
            def invoke(caller,*args):
                if caller is not original or not operation_lock.acquire(blocking=False):raise RecoveryHeld('owner-transition-unavailable')
                try:return action(caller,*args)
                finally:operation_lock.release()
            return invoke
        original=_OriginalGate(exclusive(describe),exclusive(inspect),exclusive(finish),hold)
        try:yield original
        finally:active=False
