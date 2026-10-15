"""Disposable synthetic evidence-store rehearsal, disconnected from live recovery.

Two owner-only files demonstrate restart and interrupted-write behavior. The
checksum checkpoint is not an independent production authority: losing or
rolling back both files is outside this fixture's guarantee.
"""
import hashlib
import json
import os
from pathlib import Path
import stat
import subprocess
import sys

MAX_BYTES=65536


def private_root(root):
    root=Path(root)
    mode=root.lstat().st_mode
    if not stat.S_ISDIR(mode) or mode&0o077:raise ValueError('fixture-directory-held')
    return root


def read_private(path):
    mode=path.lstat().st_mode
    if not stat.S_ISREG(mode) or mode&0o077 or path.stat().st_size>MAX_BYTES:
        raise ValueError('fixture-file-held')
    return path.read_bytes()


def durable_create(path,data):
    if len(data)>MAX_BYTES:raise ValueError('fixture-capacity-held')
    fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'wb') as output:
        output.write(data);output.flush();os.fsync(output.fileno())


def write_fixture(root,evidence,*,after_data=lambda:None):
    root=private_root(root)
    if (root/'evidence.json').exists() or (root/'checkpoint.json').exists():
        raise ValueError('fixture-existing-state-held')
    validate(evidence)
    payload=json.dumps(evidence,sort_keys=True,separators=(',',':')).encode()
    durable_create(root/'evidence.pending',b'pending')
    durable_create(root/'evidence.json',payload)
    after_data()  # Test-only interruption point; never used by the active job.
    durable_create(root/'checkpoint.json',json.dumps({'sha256':hashlib.sha256(payload).hexdigest()}).encode())
    (root/'evidence.pending').unlink()
    fd=os.open(root,os.O_RDONLY)
    try:os.fsync(fd)
    finally:os.close(fd)


def validate(value):
    if (not isinstance(value,dict) or set(value)!={'version','deleted_keys','deleted_accounts','ledger'} or
            type(value['version']) is not int or value['version']!=1 or
            any(not isinstance(value[k],list) or len(value[k])>1000 or
                any(not isinstance(x,str) or not 0<len(x)<=256 for x in value[k]) or
                len(set(value[k]))!=len(value[k]) for k in ['deleted_keys','deleted_accounts']) or
            not isinstance(value['ledger'],dict) or
            not isinstance(value['ledger'].get('reservation'),dict) or
            value['ledger']['reservation'].get('state')!='held'):
        raise ValueError('fixture-evidence-held')


def read_fixture(root):
    try:
        root=private_root(root)
        if (root/'evidence.pending').exists() or (root/'evidence.pending').is_symlink():
            raise ValueError('fixture-incomplete-held')
        payload=read_private(root/'evidence.json')
        checkpoint=json.loads(read_private(root/'checkpoint.json'))
        if checkpoint!={'sha256':hashlib.sha256(payload).hexdigest()}:
            raise ValueError('fixture-checkpoint-held')
        value=json.loads(payload);validate(value)
        return value
    except (OSError,ValueError,TypeError,AttributeError):
        raise ValueError('fixture-recovery-evidence-unavailable') from None


CHILD="""
import json,sys,os
from local_recovery_evidence import write_fixture,read_fixture
request=json.load(sys.stdin)
if request['mode']=='write':
    write_fixture(request['root'],request['evidence'],after_data=(lambda:os._exit(71)) if request.get('crash') else (lambda:None))
    print('{"written":true}')
else:
    try: print(json.dumps(read_fixture(request['root'])))
    except ValueError: print('{"held":true}');sys.exit(2)
"""


def child(root,mode,**options):
    return subprocess.run([sys.executable,'-c',CHILD],input=json.dumps(dict(root=str(root),mode=mode,**options)),
                          text=True,capture_output=True,timeout=10,cwd=Path(__file__).resolve().parent)


def restart_round_trip(root,evidence):
    # Writer exits fully before a fresh process opens either evidence file.
    written=child(root,'write',evidence=evidence)
    if written.returncode!=0:raise ValueError('fixture-write-held')
    recovered=child(root,'read')
    if recovered.returncode!=0:raise ValueError('fixture-read-held')
    value=json.loads(recovered.stdout)
    if value!=evidence:raise ValueError('fixture-restart-mismatch')
    return value
