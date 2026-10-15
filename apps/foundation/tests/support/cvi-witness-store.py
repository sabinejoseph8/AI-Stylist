"""Test-only protected admission bridge. Reference is trusted fixture config."""
import json
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_witness as witness
import local_cvi_credentials as credentials
import local_cvi_replay as replay
x=json.load(sys.stdin)
try:
    mode=x['mode'];root=Path(x['root'])
    if mode=='prepareWitness':value=witness.prepare(Path(x['witnessRoot']),root,x['storeId'],x['kind'])
    else:
        ref=x['witness']
        if not ref:raise ValueError()
        if mode in ('reserve','consume'):value=replay.operate(root,x['request'],mode,x.get('crashAt'),witness=ref,witness_crash_at=x.get('witnessCrashAt'))
        elif mode=='check':value=credentials.check(root,x['request'],witness=ref)
        elif mode=='activate':value=credentials.activate(root,x['storeId'],x['scopeDigest'],x['previous'],x['bindingDigest'],x['bootDigest'],x.get('now',1000),x.get('crashAt'),witness=ref,witness_crash_at=x.get('witnessCrashAt'))
        else:raise ValueError()
    print(json.dumps(value))
except Exception:
    print('{"status":"unavailable"}');sys.exit(2)
