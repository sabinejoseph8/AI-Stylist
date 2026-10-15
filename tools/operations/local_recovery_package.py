"""Synthetic local rehearsal composition only. No credential or network access."""
import base64
import json
import subprocess
from pathlib import Path
from backup_bundle import build_candidate, read_candidate

NODE = Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
ROOT = Path(__file__).resolve().parents[2]
SCRIPT = r'''
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');
const {seal,open}=require('./tools/operations/backup-envelope.cjs');
const plaintext=fs.readFileSync(0), key=randomBytes(32);
const options={keyId:'local-synthetic-recovery',capturedAt:100};
const read={keyId:options.keyId,now:101};
try {
 const encrypted=seal(plaintext,key,options);
 assert.equal(encrypted.includes(plaintext),false);
 const recovered=open(encrypted,key,read);
 assert.deepEqual(recovered,plaintext);
 for(const end of [0,8,encrypted.length-1])
  assert.throws(()=>open(encrypted.subarray(0,end),key,read));
 const damaged=Buffer.from(encrypted);damaged[damaged.length-1]^=1;
 assert.throws(()=>open(damaged,key,read));
 assert.throws(()=>open(encrypted,randomBytes(32),read));
 assert.throws(()=>open(encrypted,key,{...read,now:100+7*86400}));
 process.stdout.write(JSON.stringify({checks:8,recovered:recovered.toString('base64')}));
} finally {key.fill(0);plaintext.fill(0);}
'''


def round_trip(database, roles, rows, photos):
    """Exercise the real package and authenticated envelope with an ephemeral key.

    Inputs/outputs remain process memory. Never reads the permanent backup key
    or changes the active job. Rejects any child failure without raw diagnostics.
    """
    payload=build_candidate(database,roles,rows,photos,source_commit='a'*40,captured_at=100)
    value=subprocess.run([str(NODE),'-e',SCRIPT],input=payload,capture_output=True,
                         timeout=15,cwd=ROOT)
    if value.returncode!=0:raise ValueError('local-package-round-trip-held')
    result=json.loads(value.stdout)
    if result.get('checks')!=8:raise ValueError('local-package-proof-held')
    restored=read_candidate(base64.b64decode(result['recovered'],validate=True),now=101)
    if restored['database']!=database or restored['roles']!=roles or restored['photos']!=photos:
        raise ValueError('local-package-mismatch')
    return restored, result['checks']
