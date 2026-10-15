"""One explicit read-only request to the approved private photo bucket.

No object bytes, listing, writes, redirects, proxy inheritance or retries.
The existing server key is read privately and sent only in the apikey header.
"""
import argparse
import json
import os
import re
import socket
import urllib.error
import urllib.request
from pathlib import Path

PRIVATE=Path(__file__).resolve().parent/'.private'
URL='https://kwuhpuuqzbxvgjcejsow.supabase.co/storage/v1/bucket/stylist-wardrobe'

class Held(RuntimeError):pass

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):raise Held('storage-redirect-refused')

def request_bucket(key):
    if not isinstance(key,str) or not re.fullmatch(r'sb_secret_[A-Za-z0-9_-]{16,256}',key):
        raise Held('storage-key-not-ready')
    req=urllib.request.Request(URL,headers={'apikey':key,'Accept':'application/json'},method='GET')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    try:
        with opener.open(req,timeout=10) as response:
            if response.status!=200:raise Held('storage-provider-refused')
            raw=response.read(32769)
            if len(raw)>32768:raise Held('storage-response-too-large')
            return json.loads(raw)
    except (urllib.error.URLError,TimeoutError,socket.timeout,OSError,ValueError):
        raise Held('storage-unavailable-or-refused') from None

def inspect(key,call=request_bucket):
    result=call(key)
    if (not isinstance(result,dict) or result.get('id')!='stylist-wardrobe' or
        result.get('name')!='stylist-wardrobe' or result.get('public') is not False or
        type(result.get('file_size_limit')) is not int or result['file_size_limit']!=10485760 or
        not isinstance(result.get('allowed_mime_types'),list) or
        not all(isinstance(t,str) for t in result['allowed_mime_types']) or
        set(result['allowed_mime_types'])!={'image/jpeg','image/png','image/webp'}):
        raise Held('storage-bucket-policy-held')
    return {'private_bucket_verified':True,'requests':1,'object_downloads':0,'uploads':0,'writes':0}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inspect-approved-storage',action='store_true',required=True)
    parser.parse_args()
    key=None
    try:
        if PRIVATE.is_symlink() or PRIVATE.stat().st_mode&0o077:raise Held('storage-private-directory-held')
        path=PRIVATE/'supabase-storage-key.txt'
        if path.is_symlink() or not path.is_file() or path.stat().st_mode&0o077:
            raise Held('storage-private-key-held')
        key=path.read_text().removesuffix('\n')
        if not re.fullmatch(r'sb_secret_[A-Za-z0-9_-]{16,256}',key):raise Held('storage-key-not-ready')
        receipt=PRIVATE/'supabase-storage-preflight.json'
        fd=os.open(receipt,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as f:json.dump({'outcome':'held','reserved_requests':1},f)
        result=inspect(key)
        receipt.write_text(json.dumps({'outcome':'verified','result':result}))
        print(json.dumps(result));return 0
    except (Held,OSError,ValueError,KeyError):
        print(json.dumps({'result':'held','category':'storage-preflight-held','retry':False}));return 1
    finally:key=None

if __name__=='__main__':raise SystemExit(main())
