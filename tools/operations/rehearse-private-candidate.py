"""Opt-in isolated local customer-schema drill from the encrypted candidate.

No hosted connection, source credential, object upload, live account sign-in or
provider call. Managed owner equivalence and hosted recovery remain unproven.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import time
import uuid
from backup_bundle import read_candidate

_spec=importlib.util.spec_from_file_location('private_candidate_source',Path(__file__).with_name('supabase-empty-source-candidate.py'))
candidate=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(candidate)
PRIVATE=candidate.PRIVATE
ROOT=candidate.ROOT
IMAGE=candidate.db.IMAGE
SCHEMAS=['public','auth','storage','stylist_private','stylist_notes_trial_private','stylist_notebook_private']
OWNER='00000000-0000-0000-0000-000000000001'
OTHER='00000000-0000-0000-0000-000000000002'

class DrillHeld(RuntimeError):pass

def local_roles(data):
    """Keep local bootstrap postgres privileged; no production SQL is changed."""
    if not isinstance(data,bytes) or len(data)>1024*1024:raise DrillHeld('role-input-held')
    text=data.decode('utf8')
    lines=[line for line in text.splitlines() if not re.match(r'^(?:CREATE|ALTER) ROLE (?:postgres|"postgres")(?:[ ;]|$)',line)]
    # Managed explicit grantors are not equivalent in vanilla PostgreSQL.
    # Only the disposable drill copy uses its local bootstrap grantor.
    lines=[re.sub(r'\s+GRANTED BY (?:"(?:[^"]|"")*"|[A-Za-z_][A-Za-z0-9_$]*)(?=;)', '',line) if line.startswith('GRANT ') else line for line in lines]
    return ('\n'.join(lines)+'\n').encode()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-approved-local-candidate-drill',action='store_true',required=True);parser.parse_args()
    name='stylist-candidate-drill-'+uuid.uuid4().hex[:12]
    created=False;stage='private-input';checks=0;result=None
    def run(args,data=None,timeout=30):
        return subprocess.run(args,input=data,capture_output=True,timeout=timeout)
    def require(value):
        nonlocal checks
        if not value:raise DrillHeld('local-check-held')
        checks+=1
    def sql(query,refused=False):
        value=run(['docker','exec','-i',name,'psql','-U','postgres','-X','-Atq','-v','ON_ERROR_STOP=1'],query.encode())
        if refused:
            require(value.returncode!=0 and b'permission denied' in value.stderr.lower());return ''
        require(value.returncode==0)
        return value.stdout.decode().strip()
    try:
        if PRIVATE.is_symlink() or PRIVATE.stat().st_mode&0o077:raise DrillHeld('private-input-held')
        for filename in ['backup-recovery-key.json','database-candidate.asb']:
            p=PRIVATE/filename
            if p.is_symlink() or not p.is_file() or p.stat().st_mode&0o077:raise DrillHeld('private-input-held')
        decrypt="const fs=require('node:fs');const {open}=require('./tools/operations/backup-envelope.cjs');const c=JSON.parse(fs.readFileSync('./tools/operations/.private/backup-recovery-key.json','utf8'));const key=Buffer.from(c.keyHex,'hex');const bytes=open(fs.readFileSync('./tools/operations/.private/database-candidate.asb'),key,{keyId:c.keyId,now:Math.floor(Date.now()/1000)});key.fill(0);process.stdout.write(bytes);"
        value=run([candidate.NODE,'-e',decrypt])
        require(value.returncode==0)
        parts=read_candidate(value.stdout,now=int(time.time()));require(parts['photos']=={})
        stage='local-startup'
        value=run(['docker','run','-d','--rm','--pull=never','--network','none','--name',name,
            '--read-only','--log-driver','none','--cap-drop','ALL','--security-opt','no-new-privileges',
            '--user','999:999','--memory','512m','--pids-limit','96',
            '--tmpfs','/var/lib/postgresql/data:rw,size=256m,uid=999,gid=999',
            '--tmpfs','/var/run/postgresql:rw,size=16m,uid=999,gid=999',
            '--tmpfs','/tmp:rw,size=16m,uid=999,gid=999','-e','POSTGRES_HOST_AUTH_METHOD=trust',IMAGE])
        require(value.returncode==0);created=True
        for _ in range(50):
            if run(['docker','exec',name,'pg_isready','-U','postgres']).returncode==0:break
            time.sleep(.2)
        else:raise DrillHeld('local-startup-held')
        stage='local-role-bootstrap'
        value=run(['docker','exec','-i',name,'psql','-U','postgres','-X','-q','-v','ON_ERROR_STOP=1'],local_roles(parts['roles']))
        if value.returncode!=0:
            message=value.stderr.lower()
            category='local-role-bootstrap-held'
            for token,label in [(b'already exists','local-role-duplicate'),(b'permission denied','local-role-permission'),(b'syntax error','local-role-syntax'),(b'unrecognized configuration parameter','local-role-setting'),(b'does not exist','local-role-reference'),(b'invalid command','local-role-client'),(b'cannot be granted','local-role-grant')]:
                if token in message:category=label;break
            if b'grant' in message and b'permission denied' in message:category='local-explicit-grantor-permission'
            raise DrillHeld(category)
        checks+=1
        stage='local-schema-restore'
        sql(''.join('CREATE SCHEMA IF NOT EXISTS "'+schema+'";' for schema in SCHEMAS))
        args=['docker','exec','-i',name,'pg_restore','-U','postgres','--dbname','postgres',
              '--single-transaction','--exit-on-error','--no-owner']
        for schema in SCHEMAS:args+=['--schema',schema]
        value=run(args,parts['database'],timeout=60)
        if value.returncode!=0:
            category='restore-held'
            for token,label in [(b'permission denied','restore-permission-held'),(b'must be owner','restore-ownership-held'),(b'already exists','restore-duplicate-held'),(b'does not exist','restore-dependency-held'),(b'syntax error','restore-syntax-held'),(b'unsupported','restore-version-held'),(b'dependent objects','restore-dependency-held')]:
                if token in value.stderr.lower():category=label;break
            if b'extension' in value.stderr.lower():category='managed-extension-held'
            if b'role' in value.stderr.lower() and b'does not exist' in value.stderr.lower():category='managed-role-held'
            message=value.stderr.lower()
            if b'does not exist' in message:
                category='restore-'+next((kind.decode() for kind in [b'schema',b'relation',b'function',b'type',b'role'] if kind in message),'unknown')+'-dependency-held'
                missing=re.search(rb'schema "([^"]+)" does not exist',message)
                if missing and missing[1] in [b'public',b'auth',b'storage',b'extensions',b'realtime',b'vault',b'graphql',b'graphql_public',b'stylist_private',b'stylist_notes_trial_private',b'stylist_notebook_private']:
                    category='restore-missing-'+missing[1].decode()
            raise DrillHeld(category)
        checks+=1
        stage='local-customer-isolation'
        require(sql('select count(*) from auth.users;')=='0')
        require(sql("select count(*) from public.stylist_media_assets;")=='0')
        sql("insert into auth.users(id) values ('"+OWNER+"'),('"+OTHER+"');")
        actor=lambda user,query:"select set_config('request.jwt.claim.sub','"+user+"',false);set role authenticated;"+query
        preferences=json.dumps({'preferredColors':['Blue'],'excludedColors':[],'styles':['Structured'],'excludedCategories':[],
            'budgetCents':35000,'currency':'USD'})
        sql(actor(OWNER,"select public.stylist_save_profile('"+preferences+"'::jsonb,0,true);"))
        require(sql(actor(OWNER,'select count(*) from public.stylist_profiles;')).splitlines()[-1]=='1')
        require(sql(actor(OTHER,'select count(*) from public.stylist_profiles;')).splitlines()[-1]=='0')
        sql('set role anon;select * from public.stylist_profiles;',refused=True)
        require(sql("select has_function_privilege('anon','public.stylist_save_profile(jsonb,bigint,boolean)','EXECUTE');")=='f')
        require(sql("select bool_and(relrowsecurity) from pg_class where oid in ('public.stylist_profiles'::regclass,'public.stylist_wardrobe_items'::regclass,'public.stylist_saved_looks'::regclass);")=='t')
        result={'local_customer_schema_drill_passed':True,'checks':checks,'hosted_restore':False,
                'managed_owner_equivalence_verified':False,'managed_grantor_equivalence_verified':False,'photo_recovery_verified':False,
                'customer_data_transferred':False,'schedule_active':False,'complete_backup_verified':False}
    except (DrillHeld,OSError,ValueError,RuntimeError,subprocess.SubprocessError) as error:
        category=str(error) if isinstance(error,DrillHeld) else 'local-drill-held'
        result={'local_customer_schema_drill_passed':False,'stage':stage,'category':category,'hosted_restore':False,'retry':False}
    finally:
        if created:
            try:
                run(['docker','rm','-f',name])
                clean=run(['docker','ps','-a','--filter','name=^/'+name+'$','--format','{{.Names}}'])
                if clean.returncode!=0 or clean.stdout.strip():result={'local_customer_schema_drill_passed':False,'stage':'local-cleanup-held'}
                elif result is not None:result['local_container_removed']=True
            except (OSError,subprocess.SubprocessError):result={'local_customer_schema_drill_passed':False,'stage':'local-cleanup-held'}
    print(json.dumps(result))
    return 0 if result and result.get('local_customer_schema_drill_passed') else 1

if __name__=='__main__':raise SystemExit(main())
