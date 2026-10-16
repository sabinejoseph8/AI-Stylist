"""Fresh-process synthetic-only intent bridge. No real keys or hosted database."""
import json
import os
from pathlib import Path
import sys
os.umask(0o077)
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_integration_intent as intents
x=json.load(sys.stdin)
try:
    root=Path(x['root'])
    if x['mode']=='observe':r=intents.observe(root)
    elif x['mode']=='plan':r=intents.plan(root,x['config'],x['kind'],x['args'])
    elif x['mode']=='apply':r=intents.apply(root,x['config'],x['intent'],x.get('crashAt'))
    else:raise ValueError()
    print(json.dumps(r))
except Exception:
    print('{"status":"unavailable"}');sys.exit(2)
