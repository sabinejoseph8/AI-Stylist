"""Explicit approved probe-schema proof refresh. No B2 requests or scheduling.

Capture consumes one nonrefundable, bounded source-read reservation. Publish
requires the matching real local restore result. All existing attempts and the
old proof remain intact; an operator hold is never cleared here.
"""
import argparse,json,time,hashlib,os
from pathlib import Path
from backup_runtime import DESTINATION,private_directory,read_file,write_exclusive,verify_public,source_commit
from backup_probe_proof_budget import reserve_source
import backup_empty_snapshot as snapshot
from backup_bundle import read_candidate
PRIVATE=DESTINATION/'tools/operations/.private'
class RefreshHeld(RuntimeError):pass

def read_json(path):return json.loads(read_file(path,private=True,limit=65536))
def check_hold():
 private_directory(PRIVATE);verify_public(DESTINATION)
 if (PRIVATE/'automatic-operator-hold.json').exists():raise RefreshHeld('existing-operator-hold')

def main():
 parser=argparse.ArgumentParser(description=__doc__);modes=parser.add_mutually_exclusive_group(required=True)
 modes.add_argument('--capture-approved-probe-schema',action='store_true');modes.add_argument('--publish-verified-probe-proof',action='store_true');options=parser.parse_args()
 try:
  check_hold();key=PRIVATE/'backup-recovery-key.json';archive=PRIVATE/'cvi-probe-schema-candidate.asb';meta=PRIVATE/'cvi-probe-schema-candidate.json'
  if options.capture_approved_probe_schema:
   if archive.exists() or meta.exists():raise RefreshHeld('capture-already-recorded')
   reserve_source(PRIVATE/'automatic-budget.sqlite',now=int(time.time()),approved=True)
   config=read_json(PRIVATE/'supabase-connection.json');password=read_file(PRIVATE/'supabase-password.txt',private=True).decode().removesuffix('\n')
   snapshot.legacy.db.PRIVATE=PRIVATE;snapshot.legacy.db.validate_certificate(PRIVATE/'supabase-ca.crt')
   value=snapshot.capture_current(config,password,source_commit(Path(__file__).resolve().parents[2]),key)
   snapshot.verify(value,key)
   parts=read_candidate(snapshot.crypt(value,key,'open'),now=int(time.time()))
   fingerprint=snapshot.schema_fingerprint(parts['database'],parts['roles'])
   write_exclusive(archive,value);write_exclusive(meta,json.dumps({'sha256':hashlib.sha256(value).hexdigest(),'schema_fingerprint':fingerprint,'captured_at':int(time.time()),'bytes':len(value),'uploads':0}).encode())
   print(json.dumps({'captured':True,'encrypted_bytes':len(value),'uploads':0}));return 0
  proof=read_json(PRIVATE/'automatic-restore-proof.json');drill=read_json(PRIVATE/'cvi-probe-schema-drill-r2.json');metadata=read_json(meta)
  value=read_file(archive,private=True,limit=4*1024*1024)
  if (drill.get('local_customer_schema_drill_passed') is not True or drill.get('local_container_removed') is not True or drill.get('hosted_restore') is not False or drill.get('checks',0)<28 or drill.get('candidate_sha256')!=hashlib.sha256(value).hexdigest() or metadata['sha256']!=drill['candidate_sha256']):raise RefreshHeld('restore-evidence-held')
  snapshot.verify(value,key,expected_fingerprint=metadata['schema_fingerprint'])
  check_hold()
  old_path=PRIVATE/'automatic-restore-proof.before-cvi-probe-20261018.json'
  write_exclusive(old_path,read_file(PRIVATE/'automatic-restore-proof.json',private=True))
  result={**proof,**drill,'schema_fingerprint':metadata['schema_fingerprint'],'refresh_purpose':'approved-cvi-connection-probe-schema','verified_at':int(time.time())}
  temporary=PRIVATE/'.cvi-probe-restore-proof.tmp';write_exclusive(temporary,json.dumps(result,sort_keys=True).encode());os.replace(temporary,PRIVATE/'automatic-restore-proof.json')
  print(json.dumps({'proof_updated':True,'local_checks':drill['checks'],'old_proof_preserved':True,'uploads':0,'schedule_changed':False}));return 0
 except Exception:
  print(json.dumps({'proof_updated':False,'state':'held','uploads':0,'retry':False}));return 1
if __name__=='__main__':raise SystemExit(main())
