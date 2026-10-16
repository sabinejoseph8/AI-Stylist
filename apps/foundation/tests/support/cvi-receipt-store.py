"""Fresh synthetic-only SQLite receipt process. Configuration is test-owned."""
import json
import os
from pathlib import Path
import sys
os.umask(0o077)
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_transaction as store
import local_cvi_receipts as receipts
x=json.load(sys.stdin)
try:
    root=Path(x['root']);mode=x['mode']
    if mode=='witness-bootstrap':
        from local_cvi_receipt_witness import bootstrap
        print(json.dumps(bootstrap(Path(x['witnessRoot']),root)));sys.exit(0)
    protected=mode.endswith('-witness')
    if protected:mode=mode[:-8]
    ref=x['witness'] if protected else None
    if protected and (not isinstance(ref,dict) or mode=='prepare'):raise ValueError()
    if mode=='prepare':
        r=store.prepare(root,x['snapshot'],x['config']);receipts.bootstrap(root)
    elif mode=='commit':r=store.operation(root,mode,x['config'],x['request'],x.get('crashAt'),x['receiptContext'],ref,x.get('witnessCrashAt'))
    elif mode=='claim':r=receipts.claim(root,x['identity'],x['principal'],x['config']['now'],x.get('crashAt'),ref,x.get('witnessCrashAt'))
    elif mode=='receipts':r=receipts.inspect(root,ref)
    else:r=store.operation(root,mode,x['config'],witness=ref,witness_crash_at=x.get('witnessCrashAt'))
    print(json.dumps(r))
except Exception:
    print('{"status":"unavailable"}');sys.exit(2)
