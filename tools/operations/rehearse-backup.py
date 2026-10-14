"""Opt-in, synthetic PostgreSQL dump/restore drill. No hosted configuration accepted."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import time
import uuid

IMAGE = 'postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
ROOT = Path(__file__).resolve().parents[2]
OWNER = '00000000-0000-0000-0000-000000000001'
OTHER = '00000000-0000-0000-0000-000000000002'
ASSET = '00000000-0000-0000-0000-000000000003'
RETIRED = '00000000-0000-0000-0000-000000000004'


def verify_archive(archive, expected_digest):
    """Integrity only, not encryption, authenticity or production restore authorization."""
    return (isinstance(archive, bytes) and 5 < len(archive) <= 32 * 1024 * 1024
            and archive.startswith(b'PGDMP')
            and isinstance(expected_digest, str) and len(expected_digest) == 64
            and hashlib.sha256(archive).hexdigest() == expected_digest)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-local-synthetic', action='store_true', required=True)
    parser.parse_args()
    name = 'stylist-restore-' + uuid.uuid4().hex[:12]
    created = False
    checks = 0
    stage = 'local-image'
    receipt = None

    def run(args, data=None):
        return subprocess.run(args, input=data, capture_output=True, timeout=60)

    def require(condition):
        nonlocal checks
        if not condition:
            raise RuntimeError('rehearsal assertion failed')
        checks += 1

    def sql(query, db='source', success=True):
        result = run(['docker', 'exec', '-i', name, 'psql', '-U', 'postgres', '-d', db,
                      '-Atq', '-v', 'ON_ERROR_STOP=1'], query.encode())
        require((result.returncode == 0) == success)
        return result.stdout.decode().strip()

    def actor(uid, query):
        return f"set role authenticated; set request.jwt.claim.sub='{uid}'; " + query

    def snapshot(db):
        tables = sql("select schemaname||'.'||tablename from pg_tables where schemaname in "
                     "('public','auth','storage','stylist_private') order by 1;", db).splitlines()
        rows = {}
        for table in tables:
            # Names come only from the fixed, synthetic schema, not command-line input.
            rows[table] = sql(f"select coalesce(jsonb_agg(row_data order by row_data::text),'[]') "
                              f"from (select to_jsonb(t) row_data from {table} t) s;", db)
        rows['policies'] = sql("select coalesce(jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname),'[]') from pg_policies p;", db)
        rows['table_security'] = sql("select jsonb_agg(jsonb_build_array(n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity,(select jsonb_agg(jsonb_build_array(r,priv,has_table_privilege(r,c.oid,priv)) order by r,priv) from unnest(array['anon','authenticated','service_role']) r cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) priv)) order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('public','stylist_private','storage','auth');", db)
        rows['functions'] = sql("select jsonb_agg(jsonb_build_array(n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),p.prosecdef,p.proconfig,p.prosrc,(select jsonb_agg(jsonb_build_array(r,has_function_privilege(r,p.oid,'EXECUTE')) order by r) from unnest(array['anon','authenticated','service_role']) r)) order by n.nspname,p.proname,p.oid::regprocedure::text) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','stylist_private','auth');", db)
        return rows

    try:
        result = run(['docker', 'run', '-d', '--rm', '--pull=never', '--network', 'none',
                      '--name', name, '--tmpfs', '/var/lib/postgresql/data:rw,size=256m',
                      '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', IMAGE])
        require(result.returncode == 0)
        created = True
        stage = 'startup'
        for _ in range(100):
            if run(['docker', 'exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']).returncode == 0:
                break
            time.sleep(.2)
        else:
            raise RuntimeError('startup timed out')
        sql('create database source;', 'postgres')
        stage = 'synthetic-schema'
        sql('''create role anon; create role authenticated; create role service_role;
create schema auth; create table auth.users(id uuid primary key,banned_until timestamptz,deleted_at timestamptz,is_anonymous boolean default false);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,not_after timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security; grant usage on schema storage to authenticated,anon;
grant select,insert,update,delete on storage.objects to authenticated,anon;''')
        migrations = sorted((ROOT / 'supabase/migrations').glob('*.sql'))
        require(len(migrations) == 21)
        for migration in migrations:
            sql(migration.read_text())
        stage = 'synthetic-saved-data'
        sql(f"insert into auth.users(id) values ('{OWNER}'),('{OTHER}');")
        sql(f"insert into public.stylist_media_assets(id,user_id,storage_key,content_type,width,height) values ('{ASSET}','{OWNER}','{OWNER}/fixture.webp','image/webp',100,100);")
        profile = json.dumps(dict(preferredColors=['Blue'], excludedColors=[], styles=['Structured'], excludedCategories=[], budgetCents=35000, currency='USD'))
        sql(actor(OWNER, f"select public.stylist_save_profile('{profile}'::jsonb,0,true);"))
        sql(actor(OWNER, f"select public.stylist_save_wardrobe('{ASSET}','Synthetic jacket',true);"))
        items = json.dumps([dict(assetId=ASSET, label='Synthetic jacket')])
        sql(actor(OWNER, f"select public.stylist_save_owned_look('Synthetic look','{items}'::jsonb,true);"))
        sql(f"insert into stylist_private.media_deletion_receipts(id,user_id,storage_key,deletion_token) values ('{RETIRED}','{OWNER}','{OWNER}/retired.webp',gen_random_uuid());")
        before = snapshot('source')
        stage = 'backup-integrity'
        dump = run(['docker', 'exec', name, 'pg_dump', '-U', 'postgres', '-Fc', '-d', 'source'])
        require(dump.returncode == 0)
        archive = dump.stdout
        digest = hashlib.sha256(archive).hexdigest()
        require(verify_archive(archive, digest))
        require(not verify_archive(archive[:-1], digest))
        # The checksum and archive exist only in this process. Neither is printed or saved.
        sql('drop database source; create database restored; create database corrupt;', 'postgres')
        stage = 'restore-transaction'
        restore_cmd = ['docker', 'exec', '-i', name, 'pg_restore', '-U', 'postgres',
                       '--exit-on-error', '--single-transaction', '-d']
        require(run(restore_cmd + ['restored'], archive).returncode == 0)
        stage = 'restored-snapshot'
        after = snapshot('restored')
        for key in before:
            if after.get(key) != before[key]:
                stage = 'snapshot-' + ('security' if key in ['policies','functions','table_security'] else 'data')
                require(False)
        require(after == before)
        stage = 'corrupt-transaction'
        # Deliberately bypass integrity gate only to rehearse PostgreSQL atomic failure.
        require(run(restore_cmd + ['corrupt'], archive[:len(archive)//2]).returncode != 0)
        require(sql("select count(*) from pg_tables where schemaname in ('public','auth','storage','stylist_private');", 'corrupt') == '0')
        stage = 'restored-access-protection'
        for table in ['stylist_profiles', 'stylist_media_assets', 'stylist_wardrobe_items', 'stylist_saved_looks', 'stylist_saved_look_items']:
            require(sql(actor(OWNER, f'select count(*) from public.{table};'), 'restored') == '1')
            require(sql(actor(OTHER, f'select count(*) from public.{table};'), 'restored') == '0')
            sql(f'set role anon; select * from public.{table};', 'restored', False)
            sql(actor(OWNER, f'delete from public.{table};'), 'restored', False)
        sql('set role authenticated; select * from stylist_private.retired_media_ids;', 'restored', False)
        sql('set role service_role; select * from stylist_private.retired_media_ids;', 'restored', False)
        sql(f"insert into public.stylist_media_assets(id,user_id,storage_key,content_type,width,height) values ('{RETIRED}','{OWNER}','{OWNER}/resurrection.webp','image/webp',100,100);", 'restored', False)
        # Restored revision checks and identity sequence must allow new legitimate saves.
        require(sql(actor(OWNER, f"select (public.stylist_save_profile('{profile}'::jsonb,1,true)).revision;"), 'restored') == '2')
        require(sql('select max(sequence) from stylist_private.profile_changes;', 'restored') == '2')
        sql(actor(OWNER, f"select public.stylist_save_profile('{profile}'::jsonb,1,true);"), 'restored', False)
        stage = 'verified'
        receipt = dict(status='passed', checks=checks, migrations=len(migrations),
                       scope='synthetic PostgreSQL only; no Storage objects or hosted recovery')
    except Exception:
        # Known stages only. Never echo database output, configuration or payloads.
        print(json.dumps(dict(status='failed', stage=stage)))
        raise SystemExit(1) from None
    finally:
        if created:
            result = run(['docker', 'rm', '-f', name])
            if result.returncode != 0:
                print('{"status":"cleanup-unconfirmed"}')
                raise SystemExit(1)
    if receipt is not None:
        print(json.dumps(receipt))


if __name__ == '__main__':
    main()
