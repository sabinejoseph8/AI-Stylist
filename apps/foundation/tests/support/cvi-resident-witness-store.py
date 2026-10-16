"""Resident IPC fixture. Every call still locks and reloads the durable journal."""
import json,os,sys
from pathlib import Path
from importlib.util import spec_from_file_location,module_from_spec
os.umask(0o077)
spec=spec_from_file_location('dispatch',Path(__file__).with_name('cvi-witness-store-dispatch.py'));module=module_from_spec(spec);spec.loader.exec_module(module)
for line in sys.stdin:
    envelope=None
    try:
        if len(line)>4194304:raise ValueError()
        envelope=json.loads(line)
        if set(envelope)!={'id','input'} or type(envelope['id']) is not int or envelope['id']<1:raise ValueError()
        result=module.dispatch(envelope['input'])
        print(json.dumps({'id':envelope['id'],'ok':True,'result':result}),flush=True)
    except Exception:
        print(json.dumps({'id':envelope.get('id') if isinstance(envelope,dict) else None,'ok':False}),flush=True)
