"""In-memory backup candidate package, not an export/restore or activation tool.

The caller must coordinate source snapshots, encrypt with backup-envelope.cjs
before persistence/transfer, and reconcile current deletion/identity/financial
state before restore. ZIP member digests alone are not authentication.
"""
import hashlib
import io
import json
import re
import zipfile
from backup_photo_source import validate_row, PhotoHeld

MAX_BYTES=499_000_000  # Leaves margin for authenticated encryption framing.
MAX_DATABASE=32*1024*1024
MAX_ROLES=1024*1024
MAX_MANIFEST=1024*1024
MAX_PHOTOS=1000
RETENTION=7*86400

class BundleHeld(RuntimeError):pass

def digest(data):return hashlib.sha256(data).hexdigest()

def build_candidate(database,roles,rows,photos,*,source_commit,captured_at):
    if (not isinstance(database,bytes) or not 5<len(database)<=MAX_DATABASE or not database.startswith(b'PGDMP') or
        not isinstance(roles,bytes) or not 0<len(roles)<=MAX_ROLES or
        not isinstance(rows,list) or len(rows)>MAX_PHOTOS or not isinstance(photos,dict) or
        not isinstance(source_commit,str) or not re.fullmatch('[a-f0-9]{40}',source_commit) or
        type(captured_at) is not int or captured_at<0):raise BundleHeld('bundle-input-held')
    entries={};ids=set()
    try:
        for row in rows:
            validate_row(row)
            key=row['storage_key']
            if row['id'] in ids or key in entries:raise BundleHeld('bundle-duplicate-held')
            ids.add(row['id'])
            data=photos.get(key)
            if not isinstance(data,bytes) or not 0<len(data)<=10485760 or digest(data)!=row['checksum']:
                raise BundleHeld('bundle-photo-integrity-held')
            entries[key]=row
    except PhotoHeld:raise BundleHeld('bundle-photo-manifest-held') from None
    if set(photos)!=set(entries):raise BundleHeld('bundle-photo-set-held')
    members={'database.dump':database,'roles.sql':roles,**{'photos/'+k:v for k,v in photos.items()}}
    metadata={'version':1,'state':'candidate','source_commit':source_commit,'captured_at':captured_at,
              'assets':rows,'members':{k:{'bytes':len(v),'sha256':digest(v)} for k,v in members.items()}}
    manifest=json.dumps(metadata,sort_keys=True,separators=(',',':')).encode()
    if len(manifest)>MAX_MANIFEST or sum(map(len,members.values()))+len(manifest)>MAX_BYTES:
        raise BundleHeld('bundle-capacity-held')
    output=io.BytesIO()
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_STORED) as archive:
        for name,data in {'manifest.json':manifest,**members}.items():
            info=zipfile.ZipInfo(name,date_time=(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_STORED
            info.external_attr=0o100600<<16
            archive.writestr(info,data)
    result=output.getvalue()
    if len(result)>MAX_BYTES:raise BundleHeld('bundle-capacity-held')
    return result

def read_candidate(data,*,now):
    """Only call after authenticating/decrypting the outer envelope. No extraction.

    Returns verified candidate bytes for an isolated drill, never authorizes a
    customer restore or declares that later deletion evidence was reconciled.
    """
    try:
        if not isinstance(data,bytes) or not 0<len(data)<=MAX_BYTES or type(now) is not int or now<0:
            raise BundleHeld('bundle-read-held')
        with zipfile.ZipFile(io.BytesIO(data),'r') as archive:
            infos=archive.infolist();names=[i.filename for i in infos]
            if (len(infos)>MAX_PHOTOS+3 or len(names)!=len(set(names)) or 'manifest.json' not in names or
                sum(i.file_size for i in infos)>MAX_BYTES or
                any(i.compress_type!=zipfile.ZIP_STORED or i.flag_bits&1 or
                    i.external_attr>>16&0o170000 not in (0,0o100000) or i.is_dir() for i in infos)):
                raise BundleHeld('bundle-members-held')
            if archive.getinfo('manifest.json').file_size>MAX_MANIFEST:raise BundleHeld('bundle-manifest-held')
            metadata=json.loads(archive.read('manifest.json'))
            if (not isinstance(metadata,dict) or set(metadata)!={'version','state','source_commit','captured_at','assets','members'} or
                type(metadata['version']) is not int or metadata['version']!=1 or metadata['state']!='candidate' or
                type(metadata['captured_at']) is not int or not 0<=now-metadata['captured_at']<RETENTION or
                not isinstance(metadata['source_commit'],str) or not re.fullmatch('[a-f0-9]{40}',metadata['source_commit']) or
                not isinstance(metadata['members'],dict) or set(names)!=set(metadata['members'])|{'manifest.json'} or
                not {'database.dump','roles.sql'}<=set(metadata['members'])):
                raise BundleHeld('bundle-manifest-held')
            members={}
            for name,expected in metadata['members'].items():
                if (not isinstance(expected,dict) or set(expected)!={'bytes','sha256'} or
                    type(expected['bytes']) is not int or expected['bytes']<=0 or
                    not isinstance(expected['sha256'],str) or not re.fullmatch('[a-f0-9]{64}',expected['sha256']) or
                    archive.getinfo(name).file_size!=expected['bytes']):raise BundleHeld('bundle-member-held')
                members[name]=archive.read(name)
                if digest(members[name])!=expected['sha256']:raise BundleHeld('bundle-integrity-held')
            # Reuse all creation invariants; exact member names follow only valid
            # owned photo keys, never arbitrary extraction paths or executables.
            photos={k.removeprefix('photos/'):v for k,v in members.items() if k.startswith('photos/')}
            if len(members)!=2+len(photos):raise BundleHeld('bundle-members-held')
            build_candidate(members['database.dump'],members['roles.sql'],metadata['assets'],photos,
                            source_commit=metadata['source_commit'],captured_at=metadata['captured_at'])
            return {'database':members['database.dump'],'roles':members['roles.sql'],'photos':photos,
                    'metadata':metadata,'production_restore_authorized':False}
    except (BundleHeld,KeyError,TypeError,ValueError,zipfile.BadZipFile,RuntimeError,OSError,NotImplementedError):
        raise BundleHeld('bundle-rejected') from None
