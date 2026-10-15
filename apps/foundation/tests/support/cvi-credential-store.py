"""Disposable synthetic authority bridge, not a runtime service."""
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_credentials as credentials
x=json.load(sys.stdin)
try:
    if x['mode']=='prepare':value={'storeId':credentials.prepare(Path(x['root']),x['scopeDigest'],10000,1000)}
    elif x['mode']=='activate':value=credentials.activate(Path(x['root']),x['storeId'],x['scopeDigest'],x['previous'],x['bindingDigest'],x['bootDigest'],x.get('now',1000),x.get('crashAt'))
    elif x['mode']=='check':value=credentials.check(Path(x['root']),x['request'])
    elif x['mode']=='inspect':
        with credentials.locked(Path(x['root'])) as root:value=credentials.load(root,x['storeId'])
    else:raise ValueError()
    print(json.dumps(value))
except Exception:
    print('{"status":"unavailable"}');sys.exit(2)
