"""Inactive Mac job for fresh encrypted database copies of an empty customer source.

Requires a separate scope-activation decision and private activation record.
Stops on any customer account/photo, operator hold, uncertainty or used budget.
No retries, provider deletion, account changes or scheduler installation here.
"""
import argparse
import json
import os
from pathlib import Path
import sqlite3
import plistlib
import sys
import time
import uuid
import re
from backup_runtime import DESTINATION,private_directory,read_file,write_exclusive,verify_public
from b2_automatic_budget import MIN_INTERVAL
from automatic_backup_runner import GATES,run_once
import backup_empty_snapshot as snapshot
import b2_candidate_transfer as transport
import backup_monitor

ROOT=Path(__file__).resolve().parents[2]
SCOPE='empty-source-database'


def launch_agent(root,*,python=sys.executable):
    """Inactive launchd descriptor. Caller must obtain scope activation first."""
    root=Path(root)
    if not root.is_absolute() or not Path(python).is_absolute():raise JobHeld('job-launch-path-held')
    return plistlib.dumps({'Label':'com.ai-stylist.backups','Disabled':True,
        'ProgramArguments':[python,str(root/'tools/operations/automatic_empty_job.py'),'--run-approved-empty-database-job'],
        'WorkingDirectory':str(root),'StartInterval':900,'RunAtLoad':True,'KeepAlive':False,
        'ProcessType':'Background','LowPriorityIO':True,'ThrottleInterval':900,'Umask':63,
        'EnvironmentVariables':{'PATH':'/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin'},
        'StandardOutPath':str(root/'tools/operations/.private/automatic-job.log'),
        'StandardErrorPath':'/dev/null'})


class JobHeld(RuntimeError):
    pass


def read_json(path):
    return json.loads(read_file(path,private=True,limit=64*1024))


def policy_state(private):
    path=private/'automatic-budget.sqlite'
    read_file(path,private=True,limit=4*1024*1024)
    with sqlite3.connect('file:'+str(path)+'?mode=ro',uri=True) as db:
        row=db.execute('SELECT created,expires,last_run,active FROM policy WHERE id=1').fetchone()
    if (not row or any(type(v)is not int or v<0 for v in row[:2]) or
            row[2] is not None and (type(row[2])is not int or row[2]<0)):
        raise JobHeld('job-policy-held')
    return row


def status(private,now):
    """Local-only readiness. No network or budget mutation."""
    private_directory(private)
    if not (private/'automatic-activation.json').exists():return {'state':'inactive','scope':SCOPE}
    activation=read_json(private/'automatic-activation.json')
    if (set(activation)!={'approved','scope','restore_scope_accepted','key_custody_confirmed','expires_at'} or
            activation['approved'] is not True or activation['scope']!=SCOPE or
            activation['restore_scope_accepted'] is not True or activation['key_custody_confirmed'] is not True):
        raise JobHeld('job-scope-activation-held')
    created,expires,last,active=policy_state(private)
    if type(activation['expires_at'])is not int or activation['expires_at']!=expires or not created<=now<expires:
        raise JobHeld('job-expiry-or-clock-held')
    if active is not None or (private/'automatic-operator-hold.json').exists():
        raise JobHeld('job-operator-attention-required')
    proof=read_json(private/'automatic-restore-proof.json')
    if (proof.get('local_customer_schema_drill_passed') is not True or proof.get('checks',0)<21 or
            proof.get('local_container_removed') is not True or proof.get('hosted_restore') is not False or
            not isinstance(proof.get('schema_fingerprint'),str) or not re.fullmatch('[a-f0-9]{64}',proof['schema_fingerprint'])):
        raise JobHeld('job-restore-evidence-held')
    return {'state':'due' if last is None or now>=last+MIN_INTERVAL else 'waiting',
            'scope':SCOPE,'expires':expires,'next_due':now if last is None else last+MIN_INTERVAL}


def replace_json(path,data):
    temporary=path.parent/('.'+path.name+'.'+uuid.uuid4().hex+'.tmp')
    write_exclusive(temporary,json.dumps(data).encode())
    os.replace(temporary,path)


def run_job(private,root,*,now=lambda:int(time.time())):
    ready=status(private,now())
    if ready['state']!='due':return ready
    manifest=verify_public(root)
    fingerprint=read_json(private/'automatic-restore-proof.json')['schema_fingerprint']
    config=read_json(private/'supabase-connection.json')
    password=read_file(private/'supabase-password.txt',private=True).decode().removesuffix('\n')
    key_path=private/'backup-recovery-key.json'
    read_file(key_path,private=True,limit=4096)
    snapshot.legacy.db.validate_certificate(private/'supabase-ca.crt')
    b2=dict(line.split('=',1) for line in read_file(private/'b2-restricted.env',private=True).decode().splitlines())
    ping=read_file(private/'healthchecks.env',private=True).decode().strip()
    if not ping.startswith('HEALTHCHECKS_PING_URL='):raise JobHeld('job-monitor-config-held')
    ping=ping.split('=',1)[1]
    runs=private/'automatic-runs'
    if not runs.exists():runs.mkdir(mode=0o700)
    private_directory(runs)
    receipt=[None];transfer_result=[None]
    def capture():
        active=policy_state(private)[3]
        if type(active)is not int:raise JobHeld('job-attempt-held')
        receipt[0]=runs/(str(active)+'.json')
        write_exclusive(receipt[0],json.dumps({'outcome':'held','scope':SCOPE,'started_at':now()}).encode())
        return snapshot.capture_current(config,password,manifest['source_commit'],key_path)
    def uploaded(result):
        replace_json(receipt[0],{'outcome':'uploaded-unverified','scope':SCOPE,'result':result,'captured_at':now()})
    def send(value,guard):
        result=transport.transfer(b2,value,None,now=now,verify=lambda data:snapshot.verify(data,key_path,expected_fingerprint=fingerprint),
                                  budget_guard=guard,uploaded=uploaded)
        transfer_result[0]=result
        replace_json(receipt[0],{'outcome':'download-authenticated','scope':SCOPE,'result':result,'captured_at':now()})
        return result
    def reconcile():
        snapshot.legacy.require_empty(snapshot.legacy.source.inspect(config,password))
        return True
    try:
        result=run_once(private/'automatic-budget.sqlite',now=now,expires=ready['expires'],
            gates={key:True for key in GATES},capture=capture,verify=lambda data:snapshot.verify(data,key_path,expected_fingerprint=fingerprint),
            transfer=send,reconcile=reconcile,
            monitor=lambda event,proof:backup_monitor.report(ping,event,complete_recovery_point_verified=proof))
        replace_json(receipt[0],{'outcome':'scope-recovery-point-verified','scope':SCOPE,
                     'encrypted_bytes':result['encrypted_bytes'],'completed_at':now(),
                     'transfer':transfer_result[0],
                     'complete_customer_backup_verified':False})
        return {'state':'completed','scope':SCOPE,'encrypted_bytes':result['encrypted_bytes'],
                'complete_customer_backup_verified':False}
    finally:password=None;b2=None;ping=None


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    modes=parser.add_mutually_exclusive_group(required=True)
    modes.add_argument('--check-readiness',action='store_true')
    modes.add_argument('--run-approved-empty-database-job',action='store_true')
    args=parser.parse_args()
    private=DESTINATION/'tools/operations/.private'
    try:
        if ROOT!=DESTINATION:raise JobHeld('job-permanent-runtime-required')
        verify_public(ROOT)
        result=status(private,int(time.time())) if args.check_readiness else run_job(private,ROOT)
        print(json.dumps(result));return 0
    except Exception:
        # Preserve the first hold; never delete state, reset a budget or expose
        # arbitrary errors. Missing activation is a normal inactive state.
        if args.run_approved_empty_database_job and (private/'automatic-activation.json').exists():
            try:
                if not (private/'automatic-operator-hold.json').exists():
                    write_exclusive(private/'automatic-operator-hold.json',json.dumps({'state':'held','at':int(time.time()),'scope':SCOPE}).encode())
                    ping=read_file(private/'healthchecks.env',private=True).decode().strip().split('=',1)[1]
                    backup_monitor.report(ping,'failure')
            except Exception:pass
        print(json.dumps({'state':'held','scope':SCOPE,'retry':False}));return 1


if __name__=='__main__':raise SystemExit(main())
