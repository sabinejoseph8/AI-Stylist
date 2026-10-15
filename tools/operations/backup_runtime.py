"""Prepare a durable private runtime. No scheduler, network or automatic execution.

Credential transfer is a separate operation requiring the owner's authorization.
Original files and every attempt/quota receipt are retained, never reset.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import uuid

DESTINATION = Path.home() / 'Library/Application Support/AI Stylist Backups'
PRIVATE_FILES = (
    'b2-restricted.env', 'supabase-password.txt', 'supabase-connection.json',
    'supabase-ca.crt', 'backup-recovery-key.json', 'supabase-storage-key.txt',
    'healthchecks.env', 'b2-key-creation-completed.json', 'b2-key-creation-held.json',
    'b2-preflight-held.json', 'b2-restricted-preflight-held.json',
    'b2-synthetic-quota.sqlite', 'b2-synthetic-transfer.json', 'b2-synthetic-usage.json',
    'database-candidate-export.json', 'database-candidate.asb',
    'healthchecks-failure-test.json', 'healthchecks-missed-run-test.json',
    'supabase-source-readiness.json', 'supabase-storage-preflight.json',
)


class RuntimeHeld(RuntimeError):
    pass


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(path):
    path = Path(path)
    if not path.is_absolute() or '..' in path.parts:
        raise RuntimeHeld('runtime-path-held')
    if any(p.is_symlink() for p in (path, *path.parents)):
        raise RuntimeHeld('runtime-symlink-held')
    return path


def private_directory(path):
    path = safe_path(path)
    st = path.stat()
    if not stat.S_ISDIR(st.st_mode) or st.st_uid != os.getuid() or st.st_mode & 0o077:
        raise RuntimeHeld('runtime-directory-held')
    return path


def read_file(path, *, private=False, limit=4*1024*1024):
    path = safe_path(path)
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, 'rb') as stream:
        before = os.fstat(stream.fileno())
        if (not stat.S_ISREG(before.st_mode) or before.st_uid != os.getuid() or
                before.st_nlink != 1 or before.st_size > limit or
                private and before.st_mode & 0o077):
            raise RuntimeHeld('runtime-file-held')
        data = stream.read(limit+1)
        after = os.fstat(stream.fileno())
        if (len(data) > limit or len(data) != before.st_size or
                (before.st_size, before.st_mtime_ns, before.st_ctime_ns) !=
                (after.st_size, after.st_mtime_ns, after.st_ctime_ns)):
            raise RuntimeHeld('runtime-file-changed')
    return data


def write_exclusive(path, data):
    path = safe_path(path)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(fd, 'wb') as stream:
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())
    if read_file(path, private=True, limit=max(len(data), 1)) != data:
        raise RuntimeHeld('runtime-copy-held')


def prepare_public(source, destination, commit):
    source, destination = safe_path(source), safe_path(destination)
    if not re.fullmatch('[a-f0-9]{40}', commit) or destination.exists():
        raise RuntimeHeld('runtime-existing-or-commit-held')
    operations = source / 'tools/operations'
    files = sorted(p for p in operations.iterdir() if p.suffix in ('.py', '.cjs')
                   and not p.name.startswith('test_') and not p.name.endswith('.test.cjs'))
    if not files or not (operations / 'backup_runtime.py').is_file():
        raise RuntimeHeld('runtime-source-held')
    # Validate the complete public set before creating anything.
    contents = {p.name: read_file(p) for p in files}
    destination.mkdir(mode=0o700)
    (destination / 'tools').mkdir(mode=0o700)
    target = destination / 'tools/operations'
    target.mkdir(mode=0o700)
    (target / '.private').mkdir(mode=0o700)
    for name, data in contents.items():
        write_exclusive(target / name, data)
    manifest = {'version': 1, 'source_commit': commit,
                'files': {name: digest(data) for name, data in contents.items()},
                'schedule_active': False, 'credentials_transferred': False}
    write_exclusive(destination / 'runtime-manifest.json', json.dumps(manifest, sort_keys=True).encode())
    return {'public_files': len(contents), 'credentials_transferred': False, 'schedule_active': False}


def verify_public(destination):
    destination = private_directory(destination)
    private_directory(destination / 'tools')
    data = json.loads(read_file(destination / 'runtime-manifest.json', private=True))
    if (not isinstance(data, dict) or data.get('version') != 1 or
            not isinstance(data.get('source_commit'), str) or
            not re.fullmatch('[a-f0-9]{40}', data['source_commit']) or
            not isinstance(data.get('files'), dict) or not data['files'] or
            data.get('schedule_active') is not False):
        raise RuntimeHeld('runtime-manifest-held')
    target = private_directory(destination / 'tools/operations')
    actual = {p.name for p in target.iterdir() if p.suffix in ('.py', '.cjs')}
    if actual != set(data['files']):
        raise RuntimeHeld('runtime-unexpected-code-held')
    for name, expected in data['files'].items():
        if (not re.fullmatch('[A-Za-z0-9_-]+\.(?:py|cjs)', name) or
                not isinstance(expected, str) or not re.fullmatch('[a-f0-9]{64}', expected) or
                digest(read_file(target / name, private=True)) != expected):
            raise RuntimeHeld('runtime-integrity-held')
    return data


def update_public(source, destination, commit):
    """Preserve private state; interruption leaves a detectable manifest mismatch."""
    old = verify_public(destination)
    source = safe_path(source)
    if not re.fullmatch('[a-f0-9]{40}', commit):
        raise RuntimeHeld('runtime-commit-held')
    operations = source / 'tools/operations'
    contents = {p.name: read_file(p) for p in operations.iterdir()
                if p.suffix in ('.py', '.cjs') and not p.name.startswith('test_')
                and not p.name.endswith('.test.cjs')}
    if not set(old['files']) <= set(contents):
        raise RuntimeHeld('runtime-removal-held')
    target = Path(destination) / 'tools/operations'
    for name, data in contents.items():
        stage = target / ('.'+name+'.'+uuid.uuid4().hex+'.tmp')
        write_exclusive(stage, data)
        os.replace(stage, target / name)
    manifest = {**old, 'source_commit': commit,
                'files': {name: digest(data) for name, data in contents.items()}}
    stage = Path(destination) / ('.manifest.'+uuid.uuid4().hex+'.tmp')
    write_exclusive(stage, json.dumps(manifest, sort_keys=True).encode())
    os.replace(stage, Path(destination) / 'runtime-manifest.json')
    verify_public(destination)
    return {'public_files': len(contents), 'private_state_preserved': True, 'schedule_active': False}


def source_commit(root):
    """A durable runtime uses its verified manifest, never a missing Git checkout."""
    root = safe_path(root)
    if (root / 'runtime-manifest.json').exists():
        return verify_public(root)['source_commit']
    try:
        value = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root,
                                        stderr=subprocess.DEVNULL, text=True, timeout=5).strip()
    except (OSError, subprocess.SubprocessError):
        raise RuntimeHeld('runtime-source-commit-held') from None
    if not re.fullmatch('[a-f0-9]{40}', value):
        raise RuntimeHeld('runtime-source-commit-held')
    return value


def transfer_private(source_private, destination, *, approved=False):
    if approved is not True:
        raise RuntimeHeld('runtime-credential-approval-required')
    source_private = private_directory(source_private)
    verify_public(destination)
    target = private_directory(Path(destination) / 'tools/operations/.private')
    if any(target.iterdir()):
        raise RuntimeHeld('runtime-private-destination-not-empty')
    # Never copy the old overbroad dashboard key, .git, arbitrary files or WALs.
    if any((source_private / ('b2-synthetic-quota.sqlite'+suffix)).exists()
           for suffix in ('-wal', '-shm', '-journal')):
        raise RuntimeHeld('runtime-ledger-busy-held')
    contents = {name: read_file(source_private / name, private=True,
                               limit=500_000_000 if name.endswith('.asb') else 4*1024*1024)
                for name in PRIVATE_FILES}
    for name, data in contents.items():
        write_exclusive(target / name, data)
    receipt = {'private_files_copied': len(contents), 'originals_preserved': True,
               'overbroad_key_copied': False, 'schedule_active': False,
               'quota_baseline_refreshed': False, 'complete_backup_verified': False}
    write_exclusive(target / 'runtime-transfer.json', json.dumps(receipt).encode())
    return receipt
