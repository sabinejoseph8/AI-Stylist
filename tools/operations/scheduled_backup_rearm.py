"""Operator-only preparation for one approved regular scheduled backup check.

Does not start a process, change launchd, read provider credentials, reset a
budget, or claim that a backup succeeded. A fresh private approval is required.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import sqlite3
import subprocess
import time
from backup_runtime import DESTINATION, private_directory, read_file, verify_public, write_exclusive

SOURCE = '28ef0fdd2cf2ca722d236bbd1199b9162ef06a2d'
APPROVAL = 'automatic-scheduled-rearm-approval-20261018.json'
MARKER = 'automatic-scheduled-rearm-start-20261018.json'
SCOPE = 'empty-source-database'
JOB_PATH = '/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:/usr/bin:/bin'
IMAGE = 'postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'


class RearmHeld(RuntimeError):
    pass


def financial(private):
    path = private / 'automatic-budget.sqlite'
    read_file(path, private=True)
    with sqlite3.connect('file:' + str(path) + '?mode=ro', uri=True) as db:
        created, expires, last, active = db.execute('SELECT created,expires,last_run,active FROM policy WHERE id=1').fetchone()
        count, last_id = db.execute('SELECT count(*),max(id) FROM attempts').fetchone()
    return dict(created=created, expires=expires, last_run=last, active=active, count=count, last_id=last_id)


def native_status():
    result = subprocess.run(['launchctl', 'print', 'gui/' + str(os.getuid()) + '/com.ai-stylist.backups'],
                            capture_output=True, text=True, timeout=10)
    def field(name):
        match = re.search(r'^\s*' + re.escape(name) + r' = ([^\n]+)', result.stdout, re.M)
        return match.group(1).strip() if match else None
    if result.returncode or field('state') != 'not running' or field('pid') is not None:
        raise RearmHeld('native-job-not-settled')
    runs, code = field('runs'), field('last exit code')
    if not runs or not runs.isdecimal() or code != '1':
        raise RearmHeld('native-job-outcome-unverified')
    return int(runs)


def local_ready():
    docker = shutil.which('docker', path=JOB_PATH)
    if not docker:
        raise RearmHeld('local-docker-unavailable')
    env = {'PATH': JOB_PATH, 'HOME': str(Path.home()), 'TMPDIR': os.environ.get('TMPDIR', '/private/tmp')}
    for arguments in ([docker, 'info', '--format', '{{.ServerVersion}}'],
                      [docker, 'image', 'inspect', IMAGE, '--format', '{{.Id}}']):
        if subprocess.run(arguments, env=env, capture_output=True, timeout=20).returncode:
            raise RearmHeld('local-docker-not-ready')


def descriptor(root):
    path = Path.home() / 'Library/LaunchAgents/com.ai-stylist.backups.plist'
    d = plistlib.loads(read_file(path, private=True))
    if (d.get('Label') != 'com.ai-stylist.backups' or d.get('Disabled') is not False or
            d.get('KeepAlive') is not False or d.get('StartInterval') != 900 or
            d.get('WorkingDirectory') != str(root) or
            d.get('EnvironmentVariables') != {'PATH': JOB_PATH} or
            len(d.get('ProgramArguments', [])) != 3 or
            d['ProgramArguments'][1:] != [str(root / 'tools/operations/automatic_empty_job.py'), '--run-approved-empty-database-job']):
        raise RearmHeld('native-descriptor-held')
    executable = Path(d['ProgramArguments'][0])
    if not executable.is_absolute() or not executable.is_file() or not os.access(executable, os.X_OK):
        raise RearmHeld('native-executable-held')


def flush(path):
    fd = os.open(path, os.O_RDONLY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def arm(root, *, now=None):
    now = int(time.time()) if now is None else now
    private = private_directory(root / 'tools/operations/.private')
    raw = read_file(private / APPROVAL, private=True, limit=16384)
    approved = json.loads(raw)
    if (approved.get('approved') is not True or approved.get('scope') != SCOPE or
            type(approved.get('maximum_new_attempts')) is not int or approved['maximum_new_attempts'] != 1 or
            type(approved.get('native_runs')) is not int or approved['native_runs'] < 1 or
            approved.get('method') != 'regular-scheduled-check' or
            approved.get('resume_only_after_verified_success') is not True or
            approved.get('stop_on_failure') is not True or approved.get('source_commit') != SOURCE or
            type(approved.get('approved_at')) is not int or not approved['approved_at'] <= now < approved['approved_at'] + 7200):
        raise RearmHeld('fresh-approval-required')
    marker = private / MARKER
    if marker.exists():
        raise RearmHeld('authorization-already-consumed')
    hold = private / 'automatic-operator-hold.json'
    previous = read_file(hold, private=True, limit=16384)
    if hashlib.sha256(previous).hexdigest() != approved.get('hold_sha256'):
        raise RearmHeld('hold-changed')
    state = financial(private)
    if state != approved.get('financial_baseline') or state['active'] is not None or not state['created'] <= now < state['expires']:
        raise RearmHeld('financial-baseline-held')
    if verify_public(root)['source_commit'] != SOURCE:
        raise RearmHeld('runtime-source-held')
    descriptor(root)
    if native_status() != approved.get('native_runs'):
        raise RearmHeld('native-baseline-changed')
    local_ready()
    if financial(private) != state or read_file(hold, private=True) != previous:
        raise RearmHeld('state-changed-during-preflight')
    history = private / 'automatic-operator-holds'
    if not history.exists():
        history.mkdir(mode=0o700)
    private_directory(history)
    archive = history / 'hold-before-scheduled-rearm-20261018.json'
    if archive.exists():
        raise RearmHeld('hold-history-already-exists')
    write_exclusive(marker, json.dumps({'version': 1, 'state': 'awaiting-regular-scheduled-check',
        'armed_at': now, 'scope': SCOPE, 'maximum_new_attempts': 1,
        'approval_sha256': hashlib.sha256(raw).hexdigest(), 'financial_baseline': state,
        'archived_hold': archive.name, 'repeat_start_authorized': False}, sort_keys=True).encode())
    flush(private)
    try:
        os.rename(hold, archive)
        flush(history)
        flush(private)
        if read_file(archive, private=True) != previous:
            raise RearmHeld('hold-archive-mismatch')
    except BaseException:
        if not hold.exists():
            write_exclusive(hold, json.dumps({'state': 'held', 'scope': SCOPE, 'at': now,
                'reason': 'scheduled-rearm-unconfirmed'}).encode())
            flush(private)
        raise
    return {'state': 'awaiting-regular-scheduled-check', 'scope': SCOPE,
            'process_started_by_operator': False, 'budget_reset': False,
            'backup_success_verified': False, 'maximum_new_attempts': 1}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply-approved-scheduled-rearm', action='store_true', required=True)
    parser.parse_args()
    try:
        print(json.dumps(arm(DESTINATION)))
    except Exception:
        print(json.dumps({'state': 'held', 'retry': False}))
        raise SystemExit(1)
