"""Explicit one-time tiny encrypted sample upload/download; no customer data.

Requires a separately observed fresh private quota ledger. A permanent receipt
is created before provider work. No retries, deletions, schedule or paid upgrade.
"""
import argparse
import base64
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import time
import urllib.error
import urllib.request
from urllib.parse import quote
from b2_backup_quota import run_b2_guarded
from b2_encrypted_transport import upload_envelope, TransferHeld, NoRedirect

PRIVATE=Path(__file__).resolve().parent/'.private'
ROOT=Path(__file__).resolve().parents[2]
NODE='/Users/sabinejoseph/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
_spec=importlib.util.spec_from_file_location('b2_preflight',Path(__file__).with_name('b2-preflight.py'))
preflight=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(preflight)
FIXTURE='AI Stylist synthetic backup transfer only'

SEAL="""const fs=require('node:fs');const {seal}=require('./tools/operations/backup-envelope.cjs');
const c=JSON.parse(fs.readFileSync('./tools/operations/.private/backup-recovery-key.json','utf8'));
const key=Buffer.from(c.keyHex,'hex');const value=seal(Buffer.from('AI Stylist synthetic backup transfer only'),key,{keyId:c.keyId,capturedAt:Math.floor(Date.now()/1000)});key.fill(0);process.stdout.write(value);"""
VERIFY="""const fs=require('node:fs');const assert=require('node:assert/strict');const {open}=require('./tools/operations/backup-envelope.cjs');
const c=JSON.parse(fs.readFileSync('./tools/operations/.private/backup-recovery-key.json','utf8'));const key=Buffer.from(c.keyHex,'hex');
const value=open(fs.readFileSync(0),key,{keyId:c.keyId,now:Math.floor(Date.now()/1000)});key.fill(0);
assert.equal(value.toString(),'AI Stylist synthetic backup transfer only');process.stdout.write('checked\\n');"""

def crypto(script,data=None):
    try:
        result=subprocess.run([NODE,'-e',script],cwd=ROOT,input=data,capture_output=True,timeout=10)
        if result.returncode!=0:raise TransferHeld('synthetic-crypto-held')
        return result.stdout
    except (OSError,subprocess.TimeoutExpired):raise TransferHeld('synthetic-crypto-held') from None

def download(api,token,file_id,expected_size):
    if (not re.fullmatch(r'https://api[0-9]{3}\.backblazeb2\.com',api) or
        not re.fullmatch('[A-Za-z0-9_-]{1,256}',file_id) or
        type(expected_size) is not int or not 36<=expected_size<=4096):raise TransferHeld('synthetic-download-input-held')
    req=urllib.request.Request(api+'/b2api/v4/b2_download_file_by_id?fileId='+quote(file_id,safe=''),
        headers={'Authorization':token,'Accept-Encoding':'identity'},method='GET')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    try:
        with opener.open(req,timeout=10) as response:
            if response.status!=200 or response.headers.get('Content-Encoding','identity')!='identity':
                raise TransferHeld('synthetic-download-response-held')
            if response.headers.get('Content-Length')!=str(expected_size):raise TransferHeld('synthetic-download-size-held')
            value=response.read(expected_size+1)
            if len(value)!=expected_size:raise TransferHeld('synthetic-download-size-held')
            return value
    except (urllib.error.URLError,TimeoutError,OSError,ValueError):raise TransferHeld('synthetic-download-held') from None

def trial(config,ledger,*,now,seal,verify,authorize=preflight.request_json,upload=upload_envelope,read=download):
    if config.get('B2_BUCKET_ID')!='92135d40b02e32dcab1a0e10' or config.get('B2_BUCKET_NAME')!='AIstylist' or config.get('B2_PREFIX')!='backups/':
        raise TransferHeld('synthetic-destination-held')
    value=seal()
    if not isinstance(value,bytes) or not 36<=len(value)<=4096 or not value.startswith(b'ASB1'):
        raise TransferHeld('synthetic-envelope-held')
    auth='Basic '+base64.b64encode((config['B2_KEY_ID']+':'+config['B2_APPLICATION_KEY']).encode()).decode()
    response=run_b2_guarded(ledger,now=now(),class_b=1,class_c=1,
        operation=lambda:authorize(preflight.AUTH_URL,auth))
    api,token=preflight.validate_authorization(response,config,now())
    result=upload(api,token,config['B2_BUCKET_ID'],value,ledger,now=now())
    recovered=run_b2_guarded(ledger,now=now(),download_bytes=len(value),class_b=1,class_c=1,
        operation=lambda:read(api,token,result['file_id'],len(value)))
    if recovered!=value:raise TransferHeld('synthetic-recovered-bytes-held')
    if verify(recovered) is not True:raise TransferHeld('synthetic-decryption-held')
    return {'synthetic_round_trip_verified':True,'requests':4,'encrypted_uploaded_bytes':len(value),
            'downloaded_bytes':len(recovered),'customer_data_transferred':False,'schedule_active':False,
            'complete_backup_verified':False,'file_name':result['file_name'],'file_id':result['file_id']}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-approved-synthetic-transfer',action='store_true',required=True)
    parser.parse_args()
    config=None
    try:
        if PRIVATE.is_symlink() or PRIVATE.stat().st_mode&0o077:raise TransferHeld('private-directory-held')
        paths=[PRIVATE/'b2-restricted.env',PRIVATE/'backup-recovery-key.json',PRIVATE/'b2-synthetic-quota.sqlite']
        if any(p.is_symlink() or not p.is_file() or p.stat().st_mode&0o077 for p in paths):raise TransferHeld('private-input-held')
        config=dict(line.split('=',1) for line in paths[0].read_text().splitlines())
        receipt=PRIVATE/'b2-synthetic-transfer.json'
        fd=os.open(receipt,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as f:json.dump({'outcome':'held','reserved_requests':4,'maximum_sample_bytes':4096},f)
        result=trial(config,paths[2],now=lambda:int(time.time()),seal=lambda:crypto(SEAL),
                     verify=lambda value:crypto(VERIFY,value)==b'checked\n')
        receipt.write_text(json.dumps({'outcome':'synthetic-verified','result':result}))
        print(json.dumps({k:v for k,v in result.items() if k not in {'file_name','file_id'}}));return 0
    except (TransferHeld,preflight.Held,OSError,ValueError,KeyError,RuntimeError):
        print(json.dumps({'result':'held','category':'synthetic-transfer-held','retry':False}));return 1
    finally:config=None

if __name__=='__main__':raise SystemExit(main())
