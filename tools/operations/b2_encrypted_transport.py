"""Prepared encrypted-only upload boundary, no CLI, credential reads or schedule.

Caller supplies the already verified authorization, a fresh quota ledger and an
ASB1 envelope produced by backup-envelope.cjs. This is not a snapshot producer.
"""
import hashlib
import json
import re
import urllib.error
import urllib.request
import uuid
from urllib.parse import urlsplit, quote
from b2_backup_quota import run_b2_guarded, SNAPSHOT_LIMIT

class TransferHeld(RuntimeError):pass

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):raise TransferHeld('transfer-redirect-refused')

def validate_upload_url(value):
    if not isinstance(value,str):raise TransferHeld('upload-destination-held')
    u=urlsplit(value)
    if (u.scheme!='https' or u.username is not None or u.password is not None or
        u.port is not None or u.query or u.fragment or
        not re.fullmatch(r'pod-[0-9-]+\.(?:backblaze\.com|backblazeb2\.com)',u.hostname or '') or
        not re.fullmatch(r'/b2api/v[234]/b2_upload_file/[A-Za-z0-9_/-]+',u.path)):
        raise TransferHeld('upload-destination-held')

def request(url,token,body,headers=None):
    if not isinstance(token,str) or not 16<=len(token)<=8192 or '\r' in token or '\n' in token:
        raise TransferHeld('transfer-token-held')
    request_headers={'Authorization':token,**(headers or {})}
    req=urllib.request.Request(url,data=body,headers=request_headers,method='POST')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    try:
        with opener.open(req,timeout=60) as response:
            if response.status!=200:raise TransferHeld('transfer-provider-held')
            data=response.read(128001)
            if len(data)>128000:raise TransferHeld('transfer-response-held')
            return json.loads(data)
    except (urllib.error.URLError,TimeoutError,OSError,ValueError):
        raise TransferHeld('transfer-unavailable-or-refused') from None

def upload_envelope(api,authorization,bucket_id,envelope,ledger,*,now,call=request):
    if (not isinstance(api,str) or not re.fullmatch(r'https://api[0-9]{3}\.backblazeb2\.com',api) or
        not isinstance(bucket_id,str) or not re.fullmatch(r'[a-f0-9]{24}',bucket_id) or
        not isinstance(envelope,bytes) or not 36<=len(envelope)<=SNAPSHOT_LIMIT or
        not envelope.startswith(b'ASB1')):raise TransferHeld('encrypted-transfer-input-held')
    # Random names avoid replacing an existing recovery point. No human text/IDs.
    name='backups/'+uuid.uuid4().hex+'.asb'
    sha1=hashlib.sha1(envelope).hexdigest()
    sha256=hashlib.sha256(envelope).hexdigest()
    def operation():
        data=call(api+'/b2api/v4/b2_get_upload_url',authorization,
                  json.dumps({'bucketId':bucket_id}).encode(),{'Content-Type':'application/json'})
        if not isinstance(data,dict) or data.get('bucketId')!=bucket_id:raise TransferHeld('upload-url-response-held')
        validate_upload_url(data.get('uploadUrl'))
        upload_token=data.get('authorizationToken')
        if not isinstance(upload_token,str) or not 16<=len(upload_token)<=8192 or '\n' in upload_token or '\r' in upload_token:
            raise TransferHeld('upload-token-held')
        result=call(data['uploadUrl'],upload_token,envelope,{
            'Content-Type':'application/octet-stream','Content-Length':str(len(envelope)),
            'X-Bz-File-Name':quote(name,safe='/'),'X-Bz-Content-Sha1':sha1,
            'X-Bz-Server-Side-Encryption':'AES256'})
        if (not isinstance(result,dict) or result.get('bucketId')!=bucket_id or
            result.get('fileName')!=name or result.get('action')!='upload' or
            type(result.get('contentLength')) is not int or result['contentLength']!=len(envelope) or
            result.get('contentSha1')!=sha1 or result.get('contentType')!='application/octet-stream' or
            result.get('serverSideEncryption')!={'algorithm':'AES256','mode':'SSE-B2'} or
            not isinstance(result.get('fileId'),str) or not re.fullmatch('[A-Za-z0-9_-]{1,256}',result['fileId'])):
            raise TransferHeld('upload-acknowledgment-held')
        return {'file_id':result['fileId'],'file_name':name,'encrypted_bytes':len(envelope),'sha256':sha256,
                'uploaded':True,'restore_verified':False}
    # Overcount both charged request classes conservatively, independent of API
    # classification. Auth/inventory are separate and must reserve their own calls.
    return run_b2_guarded(ledger,now=now,upload_bytes=len(envelope),class_b=2,class_c=2,operation=operation)
