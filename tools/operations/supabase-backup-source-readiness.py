"""One opt-in aggregate-only source inventory in a read-only transaction.

No user IDs, object names, passwords, notes, exports, photo bytes or writes.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path

_spec=importlib.util.spec_from_file_location('source_db_check',Path(__file__).with_name('supabase-backup-preflight.py'))
db=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(db)
PRIVATE=db.PRIVATE
QUERY="""BEGIN READ ONLY;
SELECT json_build_object(
 'read_only',current_setting('transaction_read_only')='on',
 'database_bytes',pg_database_size(current_database()),
 'account_count',(select count(*) from auth.users),
 'asset_count',(select count(*) from public.stylist_media_assets),
 'transitional_assets',(select count(*) from public.stylist_media_assets where state<>'ready'),
 'missing_checksums',(select count(*) from public.stylist_media_assets where checksum is null),
 'object_count',(select count(*) from storage.objects where bucket_id='stylist-wardrobe'),
 'unmatched_objects',(select count(*) from storage.objects o where o.bucket_id='stylist-wardrobe' and not exists(select 1 from public.stylist_media_assets a where a.storage_key=o.name and a.state='ready')),
 'missing_objects',(select count(*) from public.stylist_media_assets a where a.state='ready' and not exists(select 1 from storage.objects o where o.bucket_id='stylist-wardrobe' and o.name=a.storage_key)),
 'other_bucket_objects',(select count(*) from storage.objects where bucket_id<>'stylist-wardrobe'),
 'private_photo_bucket',(select count(*)=1 and bool_and(public=false) from storage.buckets where id='stylist-wardrobe')
); ROLLBACK;"""
COUNTS={'database_bytes','account_count','asset_count','transitional_assets','missing_checksums',
        'object_count','unmatched_objects','missing_objects','other_bucket_objects'}

def inspect(config,password,run=None):
    data=db.run_readonly_json(config,password,QUERY,**({'run':run} if run else {}))
    if (set(data)!=COUNTS|{'read_only','private_photo_bucket'} or data['read_only'] is not True or
        data['private_photo_bucket'] is not True or
        any(type(data[k]) is not int or data[k]<0 for k in COUNTS)):
        raise db.Held('source-inventory-invalid')
    ready=all(data[k]==0 for k in ['transitional_assets','missing_checksums','unmatched_objects','missing_objects','other_bucket_objects'])
    return {**data,'inventory_compatible':ready,'container_removed':True,'client_tls_verify_full':True,
            'database_writes':0,'dumps':0,'photo_downloads':0,'uploads':0,'complete_backup_verified':False}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inspect-approved-source',action='store_true',required=True);parser.parse_args()
    password=None
    try:
        if PRIVATE.is_symlink() or PRIVATE.stat().st_mode&0o077:raise db.Held('source-private-directory-held')
        paths=[PRIVATE/'supabase-password.txt',PRIVATE/'supabase-connection.json']
        if any(p.is_symlink() or not p.is_file() or p.stat().st_mode&0o077 for p in paths):raise db.Held('source-private-input-held')
        db.validate_certificate(PRIVATE/'supabase-ca.crt')
        config=json.loads(paths[1].read_text());password=paths[0].read_text().removesuffix('\n')
        receipt=PRIVATE/'supabase-source-readiness.json'
        fd=os.open(receipt,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as f:json.dump({'outcome':'held','database_writes':0,'dumps':0},f)
        result=inspect(config,password)
        receipt.write_text(json.dumps({'outcome':'inspected','result':result}))
        print(json.dumps(result));return 0
    except (db.Held,OSError,ValueError,KeyError):
        print(json.dumps({'result':'held','category':'source-readiness-held','retry':False}));return 1
    finally:password=None

if __name__=='__main__':raise SystemExit(main())
