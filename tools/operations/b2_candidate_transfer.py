"""Bounded encrypted candidate round trip, never a complete-backup declaration.

Caller provides a fresh observed quota ledger and permanent attempt receipt.
No scheduler, retries, deletions or credential reader. Four requests maximum.
"""
import base64
import importlib.util
from pathlib import Path
import re
import urllib.request
from urllib.parse import quote
from b2_backup_quota import run_b2_guarded
from b2_encrypted_transport import upload_envelope, TransferHeld, NoRedirect

_spec=importlib.util.spec_from_file_location('candidate_preflight',Path(__file__).with_name('b2-preflight.py'))
preflight=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(preflight)
MAX_CANDIDATE=4*1024*1024


def download(api, token, file_id, expected_size):
    if (not isinstance(api,str) or not re.fullmatch(r'https://api[0-9]{3}\.backblazeb2\.com',api) or
            not isinstance(file_id,str) or not re.fullmatch('[A-Za-z0-9_-]{1,256}',file_id) or
            type(expected_size) is not int or not 36<=expected_size<=MAX_CANDIDATE):
        raise TransferHeld('candidate-download-input-held')
    req=urllib.request.Request(api+'/b2api/v4/b2_download_file_by_id?fileId='+quote(file_id,safe=''),
        headers={'Authorization':token,'Accept-Encoding':'identity'},method='GET')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    try:
        with opener.open(req,timeout=15) as response:
            if (response.status!=200 or response.headers.get('Content-Encoding','identity')!='identity' or
                    response.headers.get('Content-Length')!=str(expected_size)):
                raise TransferHeld('candidate-download-response-held')
            value=response.read(expected_size+1)
            if len(value)!=expected_size:raise TransferHeld('candidate-download-size-held')
            return value
    except Exception:
        raise TransferHeld('candidate-download-held') from None


def transfer(config, value, ledger, *, now, verify, authorize=preflight.request_json,
             upload=upload_envelope, read=download):
    if (config.get('B2_BUCKET_ID')!='92135d40b02e32dcab1a0e10' or
            config.get('B2_BUCKET_NAME')!='AIstylist' or config.get('B2_PREFIX')!='backups/' or
            not isinstance(value,bytes) or not 36<=len(value)<=MAX_CANDIDATE or
            not value.startswith(b'ASB1')):
        raise TransferHeld('candidate-transfer-input-held')
    # Authenticate and validate all packaged members before any provider request.
    if verify(value) is not True:raise TransferHeld('candidate-verification-held')
    auth='Basic '+base64.b64encode((config['B2_KEY_ID']+':'+config['B2_APPLICATION_KEY']).encode()).decode()
    response=run_b2_guarded(ledger,now=now(),class_b=1,class_c=1,
        operation=lambda:authorize(preflight.AUTH_URL,auth))
    api,token=preflight.validate_authorization(response,config,now())
    result=upload(api,token,config['B2_BUCKET_ID'],value,ledger,now=now())
    recovered=run_b2_guarded(ledger,now=now(),download_bytes=len(value),class_b=1,class_c=1,
        operation=lambda:read(api,token,result['file_id'],len(value)))
    if recovered!=value or verify(recovered) is not True:
        raise TransferHeld('candidate-recovery-held')
    return {**result,'candidate_round_trip_verified':True,'requests':4,
            'downloaded_bytes':len(recovered),'complete_backup_verified':False,
            'fresh_source_snapshot_verified':False,'schedule_active':False}
