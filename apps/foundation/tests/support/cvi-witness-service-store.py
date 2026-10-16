"""Fresh synthetic service process. No credentials, caching or hosted role."""
import json,os,sys
os.umask(0o077)
from importlib.util import spec_from_file_location,module_from_spec
from pathlib import Path
spec=spec_from_file_location('dispatch',Path(__file__).with_name('cvi-witness-store-dispatch.py'));module=module_from_spec(spec);spec.loader.exec_module(module)
try:print(json.dumps(module.dispatch(json.load(sys.stdin))))
except Exception:
    print('{"status":"unavailable"}');sys.exit(2)
