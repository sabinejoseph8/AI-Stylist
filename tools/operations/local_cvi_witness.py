"""TEST-ONLY independent monotonic witness model in a separate disposable folder.

The witness is ASSUMED independently protected. A local folder does not establish
that protection. Rolling back both witness and journals defeats this fixture.
No automatic bootstrap/rebase/reconciliation occurs during admission.
"""
from contextlib import contextmanager
import hashlib
import json
import uuid
from pathlib import Path
from local_recovery_abuse import locked, save, sync_root, encoded, integer, RecoveryHeld
from local_recovery_evidence import private_root, read_private, durable_create

TRANSITION_MARKER='owner-transition.json'

def assert_no_transition(root,kind='replay'):
    marker=Path(root)/TRANSITION_MARKER
    if kind=='replay' and (marker.exists() or marker.is_symlink()):raise RecoveryHeld('owner-transition-unavailable')


def digest_payload(data,marker=None):
    journal=hashlib.sha256(data).hexdigest()
    if marker is None:return journal
    return hashlib.sha256(encoded(dict(purpose='cvi-replay-transition-head-v1',journalDigest=journal,markerDigest=hashlib.sha256(marker).hexdigest()))).hexdigest()

def digest_file(root):
    path=Path(root)/TRANSITION_MARKER
    marker=read_private(path) if path.exists() or path.is_symlink() else None
    return digest_payload(read_private(Path(root)/'ledger.json'),marker)

def _advance_head(root,ref,target,*,crash_at=None):
    """Caller holds journal/witness locks; pin advances before local mutation."""
    old=load(ref)
    if old['head']!=digest_file(root) or old['epoch']>=2**53-1 or target==old['head']:raise RecoveryHeld('witness-unavailable')
    old['epoch']+=1;old['head']=target
    save(Path(ref['root']),old,crash_at=crash_at)


def prepare(witness_root,journal_root,journal_id,kind):
    witness_root=private_root(witness_root)
    if list(witness_root.iterdir()) or kind not in ('replay','credentials'):raise RecoveryHeld('witness-unavailable')
    with locked(journal_root) as root:
        assert_no_transition(root,kind)
        if any((root/n).exists() for n in ('pending','ledger.next','checkpoint.next')):raise RecoveryHeld('witness-unavailable')
        b=read_private(root/'ledger.json')
        if json.loads(read_private(root/'checkpoint.json'))!={'sha256':hashlib.sha256(b).hexdigest()} or json.loads(b).get('storeId')!=journal_id:raise RecoveryHeld('witness-unavailable')
        s=dict(version=1,witnessId=str(uuid.uuid4()),journalId=journal_id,kind=kind,epoch=0,head=hashlib.sha256(b).hexdigest())
        durable_create(witness_root/'lock',b'witness-fixture-lock');durable_create(witness_root/'pending',b'initializing')
        data=encoded(s);durable_create(witness_root/'ledger.json',data);durable_create(witness_root/'checkpoint.json',encoded({'sha256':hashlib.sha256(data).hexdigest()}))
        (witness_root/'pending').unlink();sync_root(witness_root)
        return dict(root=str(witness_root),witnessId=s['witnessId'],journalId=journal_id,kind=kind)


def load(ref):
    if not isinstance(ref,dict) or set(ref)!={'root','witnessId','journalId','kind'} or ref['kind'] not in ('replay','credentials'):raise RecoveryHeld('witness-unavailable')
    root=private_root(ref['root'])
    if any((root/n).exists() or (root/n).is_symlink() for n in ('pending','ledger.next','checkpoint.next')):raise RecoveryHeld('witness-unavailable')
    b=read_private(root/'ledger.json')
    if json.loads(read_private(root/'checkpoint.json'))!={'sha256':hashlib.sha256(b).hexdigest()}:raise RecoveryHeld('witness-unavailable')
    s=json.loads(b)
    if (set(s)!={'version','witnessId','journalId','kind','epoch','head'} or type(s['version']) is not int or s['version']!=1 or
        any(s[k]!=ref[k] for k in ('witnessId','journalId','kind')) or not integer(s['epoch']) or
        not isinstance(s['head'],str) or len(s['head'])!=64 or any(c not in 'abcdef0123456789' for c in s['head'])):raise RecoveryHeld('witness-unavailable')
    return s


@contextmanager
def journal_locked(root,store_id,kind,witness=None):
    with locked(root) as root:
        assert_no_transition(root,kind)
        if witness is None:yield root;return
        if not isinstance(witness,dict) or witness.get('journalId')!=store_id or witness.get('kind')!=kind:raise RecoveryHeld('witness-unavailable')
        with locked(witness['root']):
            state=load(witness)
            if state['head']!=digest_file(root):raise RecoveryHeld('witness-unavailable')
            yield root


def journal_save(root,state,witness=None,*,crash_at=None,witness_crash_at=None):
    """Caller holds BOTH locks. Advance witness before local write, never after ack."""
    if witness is not None:
        if load(witness)['journalId']!=state['storeId']:raise RecoveryHeld('witness-unavailable')
        marker_path=Path(root)/TRANSITION_MARKER
        marker=read_private(marker_path) if marker_path.exists() or marker_path.is_symlink() else None
        _advance_head(root,witness,digest_payload(encoded(state),marker),crash_at=witness_crash_at)
        # Failure here deliberately leaves witness ahead; admission must remain held.
    save(root,state,crash_at=crash_at)
