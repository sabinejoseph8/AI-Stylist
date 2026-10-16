"""Fresh Python process per SQLite operation. Trusted fixture config only."""
import json
import os
from pathlib import Path
import sys
os.umask(0o077)
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_transaction as store
x=json.load(sys.stdin)
try:
    if x['mode']=='prepare':r=store.prepare(Path(x['root']),x['snapshot'],x['config'])
    else:r=store.operation(Path(x['root']),x['mode'],x['config'],x.get('request'),x.get('crashAt'))
    print(json.dumps(r))
except Exception:
    print('{"status":"unavailable"}');sys.exit(2)
