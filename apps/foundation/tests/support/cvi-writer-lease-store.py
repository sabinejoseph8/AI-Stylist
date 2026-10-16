"""Fresh synthetic lease process. No real role, credential or hosted connection."""
import json
import os
from pathlib import Path
import subprocess
import sys
os.umask(0o077)
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_writer_lease as leases
import local_cvi_transaction as transactions
x=json.load(sys.stdin)
times=list(x.get('times',[1000]))
def clock():
    value=times[0]
    if len(times)>1:times.pop(0)
    return value
try:
    root=Path(x['root']);mode=x['mode']
    if mode=='bootstrap':leases.bootstrap(root);r={'status':'prepared'}
    elif mode=='activate':r=leases.activate(root,x['actor'],x['previous'],x['owner'],x['boot'],clock(),x.get('ttl',1000))
    elif mode=='fence':r=leases.fence(root,x['actor'],x['generation'],clock())
    elif mode=='apply':r=leases.apply(root,x['config'],x['intent'],x['lease'],clock,x.get('crashAt'))
    elif mode=='inspect':
        with transactions.connection(root) as db:r=dict(gate=leases.gate(db,clock()),grants=db.execute('SELECT generation,state FROM writer_grants ORDER BY generation').fetchall(),releases=db.execute('SELECT receipt_id,generation,state FROM writer_releases').fetchall())
    elif mode=='release':
        probe=[]
        def attempt_rotation():
            request=x['probeRotation'];request.update(root=str(root),mode='activate')
            child=subprocess.run([sys.executable,__file__],input=json.dumps(request),text=True,capture_output=True,timeout=2)
            probe.append('held' if child.returncode else 'unexpected-success')
        r=leases.release(root,x['actor'],x['barrier'],x['expected'],x['record'],x['signerConfig'],clock,x.get('crashAt'),attempt_rotation if x.get('probeRotation') else None)
        r=dict(reply=r,probe=probe)
    else:raise ValueError()
    print(json.dumps(r))
except Exception:
    print('{"status":"unavailable"}');sys.exit(2)
