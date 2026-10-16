"""Fresh synthetic witness service process. No real credentials or hosted role."""
import json
import os
from pathlib import Path
import sys
os.umask(0o077)
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_witness_service as service
x=json.load(sys.stdin)
try:
    if x['mode']=='prepare':service.prepare(Path(x['root']),x['pin'],x['current'],x['now']);r={'status':'prepared'}
    else:r=service.operate(Path(x['root']),x['pin'],x['actor'],x['mode'],x['args'],x['now'],x.get('crashAt'))
    print(json.dumps(r))
except Exception:
    print('{"status":"unavailable"}');sys.exit(2)
