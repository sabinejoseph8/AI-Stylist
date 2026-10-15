"""Fresh database-only candidate for the currently customer/photo-empty source.

The archive itself must have empty Auth users, media and Storage object tables.
This is not support for backing up a populated customer/photo application.
"""
import importlib.util
from pathlib import Path
import re
import subprocess
import time
import uuid
from backup_bundle import read_candidate
from backup_runtime import read_file
from b2_automatic_budget import MAX_ENVELOPE
from bounded_client import capture

_spec=importlib.util.spec_from_file_location('empty_capture',Path(__file__).with_name('supabase-empty-source-candidate.py'))
legacy=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(legacy)
NODE=legacy.NODE
ROOT=Path(__file__).resolve().parents[2]
TABLES={('auth','users'),('public','stylist_media_assets'),('storage','objects')}
CRYPT="""const fs=require('node:fs');const {seal,open}=require('./tools/operations/backup-envelope.cjs');
const c=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const key=Buffer.from(c.keyHex,'hex');
const input=fs.readFileSync(0);const now=Math.floor(Date.now()/1000);
const output=process.argv[2]==='seal'?seal(input,key,{keyId:c.keyId,capturedAt:now}):open(input,key,{keyId:c.keyId,now});
key.fill(0);process.stdout.write(output);"""


class EmptySnapshotHeld(RuntimeError):
    pass


def require_empty_sql(sql):
    if not isinstance(sql,bytes) or len(sql)>256*1024 or b'INSERT INTO' in sql:
        raise EmptySnapshotHeld('archive-scope-held')
    copies=re.findall(rb'^COPY ([a-z_][a-z_0-9]*)\.([a-z_][a-z_0-9]*) \([^\n]*\) FROM stdin;\n(.*?)^\\\.$',sql,re.M|re.S)
    if (len(copies)!=3 or len(re.findall(rb'^COPY ',sql,re.M))!=3 or
            {(a.decode(),b.decode()) for a,b,_ in copies}!=TABLES or any(body for _,_,body in copies)):
        raise EmptySnapshotHeld('archive-customer-or-photo-scope-held')
    return True


def inspect_archive(database,*,capture_client=capture,run=subprocess.run):
    if not isinstance(database,bytes) or not database.startswith(b'PGDMP') or len(database)>MAX_ENVELOPE:
        raise EmptySnapshotHeld('archive-input-held')
    name='stylist-empty-scope-'+uuid.uuid4().hex[:12]
    args=['docker','run','--rm','--pull=never','--network','none','--name',name,
          '--read-only','--log-driver','none','--cap-drop','ALL','--security-opt','no-new-privileges',
          '--user','65534:65534','--memory','128m','--pids-limit','32','-i',legacy.db.IMAGE,
          'pg_restore','--data-only','--file=-','--schema=auth','--schema=public','--schema=storage',
          '--table=users','--table=stylist_media_assets','--table=objects']
    try:
        sql=capture_client(args,database,limit=256*1024,timeout=20)
        return require_empty_sql(sql)
    finally:
        try:
            run(['docker','rm','-f',name],capture_output=True,timeout=10)
            checked=run(['docker','ps','-a','--filter','name=^/'+name+'$','--format','{{.Names}}'],capture_output=True,timeout=10)
            if checked.returncode!=0 or checked.stdout.strip():
                raise EmptySnapshotHeld('archive-inspection-cleanup-held')
        except (OSError,subprocess.SubprocessError):
            raise EmptySnapshotHeld('archive-inspection-cleanup-held') from None


def crypt(value,key_path,mode):
    if mode not in ('seal','open'):raise EmptySnapshotHeld('archive-crypto-mode-held')
    read_file(key_path,private=True,limit=4096)
    return capture([NODE,'-e',CRYPT,str(key_path),mode],value,limit=MAX_ENVELOPE,timeout=10)


def verify(value,key_path,*,now=None,decrypt=crypt,inspect=inspect_archive):
    now=int(time.time()) if now is None else now
    if not isinstance(value,bytes) or not 36<=len(value)<=MAX_ENVELOPE or not value.startswith(b'ASB1'):
        raise EmptySnapshotHeld('archive-envelope-held')
    parts=read_candidate(decrypt(value,key_path,'open'),now=now)
    if parts['photos'] or parts['metadata']['assets'] or not 0<=now-parts['metadata']['captured_at']<300:
        raise EmptySnapshotHeld('archive-fresh-empty-source-held')
    return inspect(parts['database']) is True


def capture_current(config,password,commit,key_path,*,prepare=legacy.prepare,export=legacy.read_export):
    # At most3 MiB DB and1 MiB roles, leaving substantial source-wire margin
    # below the33 MiB+8 KiB reserved egress. Oversized output holds before B2.
    def export_bounded(config,password,kind):
        def limited(args,data,*,limit,timeout):
            return capture(args,data,limit=min(limit,3*1024*1024),timeout=timeout)
        return export(config,password,kind,capture_client=limited)
    value=prepare(config,password,commit,export=export_bounded,
                  encrypt=lambda plain:crypt(plain,key_path,'seal'))
    if len(value)>MAX_ENVELOPE:raise EmptySnapshotHeld('archive-envelope-size-held')
    return value
