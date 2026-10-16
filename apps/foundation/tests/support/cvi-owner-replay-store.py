"""Disposable guarded replay bridge. Never reads live runtime configuration."""
import json,sys,os
from pathlib import Path
os.umask(0o077)
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_owner_replay as guarded
x=json.loads(sys.stdin.readline());times=iter(x.get('times',[]));last=x['request']['now']
def clock():
    global last
    last=next(times,last);return last
def rpc(m):
    print(json.dumps(m),flush=True);line=sys.stdin.readline()
    if not line:raise ValueError()
    return json.loads(line)
try:
    value=guarded.operate(Path(x['root']),x['request'],x['mode'],x['config'],rpc,clock,crash_at=x.get('crashAt'))
    print(json.dumps({'stage':'result','result':value}),flush=True)
except Exception:
    print('{"stage":"held"}',flush=True);sys.exit(2)
