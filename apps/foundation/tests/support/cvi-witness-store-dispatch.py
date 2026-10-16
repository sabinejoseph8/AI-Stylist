"""One dispatch for both fresh-process and resident disposable store transports."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_witness_service as service

def dispatch(x):
    if x['mode']=='prepare':
        service.prepare(Path(x['root']),x['pin'],x['current'],x['now'])
        return {'status':'prepared'}
    return service.operate(Path(x['root']),x['pin'],x['actor'],x['mode'],x['args'],x['now'],x.get('crashAt'))
