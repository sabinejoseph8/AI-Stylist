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
    if mode=='prepare':
        r=store.prepare(root,x['snapshot'],x['config']);receipts.bootstrap(root)
    elif mode=='commit':r=store.operation(root,mode,x['config'],x['request'],x.get('crashAt'),x['receiptContext'])
    elif mode=='claim':r=receipts.claim(root,x['identity'],x['principal'],x['config']['now'],x.get('crashAt'))
    elif mode=='receipts':r=receipts.inspect(root)
    else:r=store.operation(root,mode,x['config'])
    print(json.dumps(r))
except Exception:
    print('{"status":"unavailable"}');sys.exit(2)
