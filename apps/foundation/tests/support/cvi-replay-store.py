"""Fresh-process disposable CVI fixture bridge; no credentials or live storage."""
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_replay as replay
x=json.load(sys.stdin)
try:
    if x['mode']=='prepare':value={'storeId':replay.prepare(Path(x['root']),x['bindingDigest'],10000,1000,x.get('limit',64))}
    elif x['mode']=='inspect':
        with replay.locked(Path(x['root'])) as root:value=replay.load(root,x['storeId'])
    else:value=replay.operate(Path(x['root']),x['request'],x['mode'],x.get('crashAt'))
    print(json.dumps(value))
except Exception:
    print('{"status":"unavailable"}');sys.exit(2)
