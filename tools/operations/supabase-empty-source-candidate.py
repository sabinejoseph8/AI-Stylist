"""Explicit private database candidate for the currently account/photo-empty source.

Not a complete coordinated customer backup or production restore. No upload or
schedule. Password only on stdin; dump bytes stay in memory until encrypted.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import time
import uuid
from bounded_client import capture,ClientHeld
from backup_bundle import build_candidate

_spec=importlib.util.spec_from_file_location('source_candidate_readiness',Path(__file__).with_name('supabase-backup-source-readiness.py'))
source=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(source)
db=source.db
PRIVATE=db.PRIVATE
ROOT=Path(__file__).resolve().parents[2]
NODE='/Users/sabinejoseph/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
ENCRYPT="""const fs=require('node:fs');const assert=require('node:assert/strict');const {seal,open}=require('./tools/operations/backup-envelope.cjs');
const c=JSON.parse(fs.readFileSync('./tools/operations/.private/backup-recovery-key.json','utf8'));const key=Buffer.from(c.keyHex,'hex');
const input=fs.readFileSync(0);const capturedAt=Math.floor(Date.now()/1000);const opts={keyId:c.keyId,capturedAt};
const encrypted=seal(input,key,opts);assert.deepEqual(open(encrypted,key,{keyId:c.keyId,now:capturedAt}),input);key.fill(0);process.stdout.write(encrypted);"""

class CandidateHeld(RuntimeError):pass

def client_arguments(config,name,kind):
    args=db.arguments(config,name)[:-3]
    if kind=='database':command='pg_dump --format=custom --lock-wait-timeout=5s'
    elif kind=='roles':command='pg_dumpall --roles-only --no-role-passwords'
    else:raise CandidateHeld('candidate-command-held')
    return args+['IFS= read -r PGPASSWORD; export PGPASSWORD; exec '+command]

def read_export(config,password,kind,*,run=subprocess.run,capture_client=capture):
    name='stylist-candidate-'+uuid.uuid4().hex[:12]
    try:
        result=capture_client(client_arguments(config,name,kind),(password+'\n').encode(),
                              limit=32*1024*1024 if kind=='database' else 1024*1024,timeout=60)
    finally:
        try:
            run(['docker','rm','-f',name],capture_output=True,timeout=10)
            check=run(['docker','ps','-a','--filter','name=^/'+name+'$','--format','{{.Names}}'],capture_output=True,timeout=10)
            if check.returncode!=0 or check.stdout.strip():raise CandidateHeld('candidate-cleanup-held')
        except (OSError,subprocess.TimeoutExpired):raise CandidateHeld('candidate-cleanup-held') from None
    if not result or kind=='database' and not result.startswith(b'PGDMP'):raise CandidateHeld('candidate-export-held')
    return result

def require_empty(data):
    if data.get('inventory_compatible') is not True or any(data.get(k)!=0 for k in ['account_count','asset_count','object_count']):
        raise CandidateHeld('candidate-source-not-empty')

def prepare(config,password,commit,*,inspect=source.inspect,export=read_export,encrypt=None,now=None):
    require_empty(inspect(config,password))
    captured_at=int(time.time()) if now is None else now
    try:roles=export(config,password,'roles')
    except ClientHeld:raise CandidateHeld('roles-export-held') from None
    try:database=export(config,password,'database')
    except ClientHeld:raise CandidateHeld('database-export-held') from None
    require_empty(inspect(config,password))
    candidate=build_candidate(database,roles,[],{},source_commit=commit,captured_at=captured_at)
    if encrypt is None:
        result=subprocess.run([NODE,'-e',ENCRYPT],cwd=ROOT,input=candidate,capture_output=True,timeout=30)
        if result.returncode!=0:raise CandidateHeld('candidate-encryption-held')
        encrypted=result.stdout
    else:encrypted=encrypt(candidate)
    if not isinstance(encrypted,bytes) or not encrypted.startswith(b'ASB1') or not 36<=len(encrypted)<=34*1024*1024:
        raise CandidateHeld('candidate-encryption-held')
    return encrypted

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare-approved-empty-source-candidate',action='store_true',required=True);parser.parse_args()
    password=None
    try:
        if PRIVATE.is_symlink() or PRIVATE.stat().st_mode&0o077:raise CandidateHeld('candidate-private-directory-held')
        paths=[PRIVATE/'supabase-password.txt',PRIVATE/'supabase-connection.json',PRIVATE/'backup-recovery-key.json']
        if any(p.is_symlink() or not p.is_file() or p.stat().st_mode&0o077 for p in paths):raise CandidateHeld('candidate-private-input-held')
        db.validate_certificate(PRIVATE/'supabase-ca.crt')
        config=json.loads(paths[1].read_text());password=paths[0].read_text().removesuffix('\n')
        receipt=PRIVATE/'database-candidate-export.json'
        fd=os.open(receipt,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as f:json.dump({'outcome':'held','maximum_exports':2,'uploads':0},f)
        commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
        encrypted=prepare(config,password,commit)
        destination=PRIVATE/'database-candidate.asb'
        fd=os.open(destination,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'wb') as f:f.write(encrypted)
        if destination.read_bytes()!=encrypted:raise CandidateHeld('candidate-write-held')
        result={'private_encrypted_candidate_saved':True,'encrypted_bytes':len(encrypted),'exports':2,
                'uploads':0,'schedule_active':False,'complete_backup_verified':False}
        receipt.write_text(json.dumps({'outcome':'candidate-prepared','result':result}))
        print(json.dumps(result));return 0
    except (CandidateHeld,ClientHeld,db.Held,OSError,ValueError,KeyError,RuntimeError,subprocess.SubprocessError) as error:
        category=str(error) if isinstance(error,CandidateHeld) else 'database-candidate-held'
        print(json.dumps({'result':'held','category':category,'retry':False}));return 1
    finally:password=None

if __name__=='__main__':raise SystemExit(main())
