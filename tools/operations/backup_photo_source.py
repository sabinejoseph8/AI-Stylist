"""Prepared read-only photo reader; caller must provide a consistent DB snapshot.

No CLI, scheduler, file output or automatic activation. Unknown/transitional or
legacy checksum-free assets hold the set rather than silently omitting photos.
"""
import hashlib
import re
import urllib.error
import urllib.request
from urllib.parse import quote

BASE='https://kwuhpuuqzbxvgjcejsow.supabase.co/storage/v1/object/authenticated/stylist-wardrobe/'
MAX_OBJECT=10485760
MAX_TOTAL=450_000_000  # Leaves room for DB/manifests under encrypted 500 MB ceiling.
MAX_OBJECTS=1000
UUID=r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'

class PhotoHeld(RuntimeError):pass

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):raise PhotoHeld('photo-redirect-refused')

def validate_row(row):
    if (not isinstance(row,dict) or set(row)!={'id','user_id','storage_key','content_type','checksum','state'} or
        not all(isinstance(v,str) for v in row.values()) or
        not re.fullmatch(UUID,row['id']) or
        not isinstance(row['user_id'],str) or not re.fullmatch(UUID,row['user_id']) or
        row['state']!='ready' or row['content_type'] not in {'image/jpeg','image/png','image/webp'} or
        not isinstance(row['checksum'],str) or not re.fullmatch('[a-f0-9]{64}',row['checksum']) or
        not isinstance(row['storage_key'],str) or
        not re.fullmatch(re.escape(row['user_id'])+r'/[A-Za-z0-9_-]{1,128}\.(?:jpg|jpeg|png|webp)',row['storage_key'])):
        raise PhotoHeld('photo-manifest-held')

def fetch_photo(key,row,max_bytes):
    validate_row(row)
    if (not isinstance(key,str) or not re.fullmatch(r'sb_secret_[A-Za-z0-9_-]{16,256}',key) or
        type(max_bytes) is not int or not 0<max_bytes<=MAX_OBJECT):raise PhotoHeld('photo-input-held')
    url=BASE+quote(row['storage_key'],safe='/')
    req=urllib.request.Request(url,headers={'apikey':key,'Accept':row['content_type'],'Accept-Encoding':'identity'},method='GET')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}),NoRedirect())
    try:
        with opener.open(req,timeout=10) as response:
            if response.status!=200 or response.headers.get('Content-Encoding','identity')!='identity':
                raise PhotoHeld('photo-response-held')
            if response.headers.get_content_type()!=row['content_type']:raise PhotoHeld('photo-type-held')
            length=response.headers.get('Content-Length')
            if length is None or not length.isdecimal() or not 0<int(length)<=max_bytes:
                raise PhotoHeld('photo-size-held')
            data=response.read(max_bytes+1)
            if len(data)!=int(length):raise PhotoHeld('photo-length-held')
            return data
    except (urllib.error.URLError,TimeoutError,OSError,ValueError):
        raise PhotoHeld('photo-unavailable-or-refused') from None

def collect_photos(rows,key,fetch=fetch_photo,*,total_limit=MAX_TOTAL):
    if (not isinstance(rows,list) or len(rows)>MAX_OBJECTS or type(total_limit) is not int or
        not 0<total_limit<=MAX_TOTAL):raise PhotoHeld('photo-set-limit')
    seen_ids=set();seen_keys=set()
    # Validate entire manifest before any source request, including duplicate IDs/paths.
    for row in rows:
        validate_row(row)
        if row['id'] in seen_ids or row['storage_key'] in seen_keys:raise PhotoHeld('photo-duplicate-held')
        seen_ids.add(row['id']);seen_keys.add(row['storage_key'])
    objects={};total=0
    for row in rows:
        remaining=min(MAX_OBJECT,total_limit-total)
        if remaining<=0:raise PhotoHeld('photo-set-limit')
        data=fetch(key,row,remaining)
        if (not isinstance(data,bytes) or not 0<len(data)<=remaining or
            hashlib.sha256(data).hexdigest()!=row['checksum']):raise PhotoHeld('photo-integrity-held')
        objects[row['storage_key']]=data;total+=len(data)
    return objects
