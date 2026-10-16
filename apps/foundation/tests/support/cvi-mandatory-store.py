"""Test-only mandatory protocol. Unknown or missing authority has no fallback."""
import json
import os
from pathlib import Path
import sys
os.umask(0o077)
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_mandatory_adapter as adapter
import local_cvi_transaction as transactions
x=json.loads(sys.stdin.readline())
def rpc(message):
    print(json.dumps(message),flush=True)
    line=sys.stdin.readline()
    if not line:raise ValueError()
    return json.loads(line)
try:
    if x['mode']=='observe':
        with transactions.connection(Path(x['root'])) as db:result=adapter.control_metadata(db,x['config']['now'])
    elif x['mode']=='plan':result=adapter.plan(Path(x['root']),x['config'],x['actor'],x['kind'],x['args'])
    elif x['mode']=='plan-full':
        capture={};intent=adapter.plan(Path(x['root']),x['config'],x['actor'],x['kind'],x['args'],capture)
        result=dict(intent=intent,**capture)
    elif x['mode']=='execute':result=adapter.execute(Path(x['root']),x['config'],x['intent'],x['approval'],rpc,x.get('crashAt'))
    else:raise ValueError()
    print(json.dumps({'stage':'result','result':result}),flush=True)
except Exception:
    print('{"stage":"held"}',flush=True);sys.exit(2)
