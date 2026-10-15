"""Explicit bounded read-only database connection check, no dump or backup upload.

Uses the already installed pinned PostgreSQL client image. Password passes only
through stdin to the client container, never Docker configuration or arguments.
Raw client errors are classified, never printed. No retry or IPv4 add-on.
"""
import argparse
import json
import os
import re
import subprocess
import ssl
import uuid
from pathlib import Path

IMAGE='postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
PRIVATE=Path(__file__).resolve().parent/'.private'
QUERY="BEGIN READ ONLY; SELECT json_build_object('database_ok',current_database()='postgres','read_only',current_setting('transaction_read_only')='on','server_major',current_setting('server_version_num')::integer/10000); ROLLBACK;"
CLIENT="IFS= read -r PGPASSWORD; export PGPASSWORD; exec psql -X -w -Atq -v ON_ERROR_STOP=1 --command \"$1\""


class Held(RuntimeError):
    pass


def validate_config(config):
    required={'project_ref','host','port','database','user','sslmode','mode','read_only'}
    if not isinstance(config,dict) or set(config)!=required:
        raise Held('connection-config-invalid')
    ref=config['project_ref']
    if (not isinstance(ref,str) or not re.fullmatch('[a-z]{20}',ref) or
        not isinstance(config['host'],str) or
        not re.fullmatch(r'aws-[0-9]+-us-west-2\.pooler\.supabase\.com',config['host']) or
        type(config['port']) is not int or config['port']!=5432 or
        config['database']!='postgres' or config['user']!='postgres.'+ref or
        config['sslmode']!='verify-full' or config['mode']!='session' or config['read_only'] is not True):
        raise Held('connection-config-invalid')


def arguments(config,name):
    validate_config(config)
    args=['docker','run','--rm','--pull=never','--name',name,'--read-only',
          '--log-driver','none','--cap-drop','ALL','--security-opt','no-new-privileges',
          '--mount','type=bind,src='+str(PRIVATE/'supabase-ca.crt')+',dst=/run/supabase-ca.crt,readonly',
          '--pids-limit','32','--memory','128m','--user',str(os.getuid())+':'+str(os.getgid()),'-i']
    environment={'PGHOST':config['host'],'PGPORT':'5432','PGDATABASE':'postgres',
                 'PGUSER':config['user'],'PGSSLMODE':'verify-full',
                 'PGSSLROOTCERT':'/run/supabase-ca.crt','PGCONNECT_TIMEOUT':'10',
                 'PGOPTIONS':'-c default_transaction_read_only=on -c statement_timeout=10000 -c lock_timeout=5000'}
    for key,value in environment.items():args+=['-e',key+'='+value]
    return args+[IMAGE,'sh','-c',CLIENT,'client',QUERY]


def classify(stderr):
    text=stderr.decode('utf8','replace').lower()
    if 'password authentication failed' in text:return 'database-authentication-refused'
    if 'certificate' in text or 'ssl error' in text:return 'database-tls-verification-held'
    if 'could not translate host' in text or 'network is unreachable' in text or 'connection timed out' in text:
        return 'database-network-unavailable'
    return 'database-client-or-query-held'


def run_readonly_json(config,password,query,run=subprocess.run):
    validate_config(config)
    if (not isinstance(password,str) or not password or password=='PASTE_DATABASE_PASSWORD_HERE' or
        '\n' in password or '\r' in password or '\x00' in password or len(password)>1024):
        raise Held('database-password-not-ready')
    name='stylist-db-check-'+uuid.uuid4().hex[:12]
    result=None
    cleanup_ok=False
    try:
        args=arguments(config,name);args[-1]=query
        result=run(args,input=(password+'\n').encode(),capture_output=True,timeout=30)
    except subprocess.TimeoutExpired:
        raise Held('database-check-timeout') from None
    finally:
        # Also remove a container when a timed-out Docker client was killed.
        try:
            run(['docker','rm','-f',name],capture_output=True,timeout=10)
            check=run(['docker','ps','-a','--filter','name=^/'+name+'$','--format','{{.Names}}'],
                      capture_output=True,timeout=10)
            cleanup_ok=check.returncode==0 and not check.stdout.strip()
        except (OSError,subprocess.TimeoutExpired):
            cleanup_ok=False
        if not cleanup_ok:raise Held('database-client-cleanup-held')
    if result.returncode!=0:raise Held(classify(result.stderr))
    try:
        if len(result.stdout)>4096:raise Held('database-response-invalid')
        data=json.loads(result.stdout)
        if not isinstance(data,dict):raise Held('database-response-invalid')
        return data
    except (ValueError,TypeError):
        raise Held('database-response-invalid') from None


def inspect(config,password,run=subprocess.run):
    data=run_readonly_json(config,password,QUERY,run)
    if (set(data)!={'database_ok','read_only','server_major'} or
        data['database_ok'] is not True or data['read_only'] is not True or
        type(data['server_major']) is not int or not 14<=data['server_major']<=17):
        raise Held('database-readiness-held')
    return {**data,'client_tls_verify_full':True,'container_removed':True,'database_writes':0,'dumps':0,'uploads':0}


def validate_certificate(path):
    if path.is_symlink() or not path.is_file() or path.stat().st_mode&0o077:
        raise Held('database-certificate-not-ready')
    data=path.read_bytes()
    if len(data)>32768 or not data.startswith(b'-----BEGIN CERTIFICATE-----'):
        raise Held('database-certificate-invalid')
    try:
        ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT).load_verify_locations(cadata=data.decode('ascii'))
    except (ValueError, UnicodeError, ssl.SSLError):
        raise Held('database-certificate-invalid') from None


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-approved-database',action='store_true',required=True)
    parser.parse_args()
    password=None
    try:
        if PRIVATE.stat().st_mode&0o077:raise Held('private-directory-permissions')
        paths=[PRIVATE/'supabase-password.txt',PRIVATE/'supabase-connection.json']
        if any(p.stat().st_mode&0o077 for p in paths):raise Held('private-file-permissions')
        validate_certificate(PRIVATE/'supabase-ca.crt')
        config=json.loads(paths[1].read_text())
        password=paths[0].read_text().removesuffix('\n')
        result=inspect(config,password)
        print(json.dumps(result))
        return 0
    except (Held,OSError,ValueError,KeyError) as error:
        print(json.dumps({'result':'held','category':str(error) if isinstance(error,Held) else 'database-private-configuration-unavailable','retry':False}))
        return 1
    finally:
        password=None


if __name__=='__main__':raise SystemExit(main())
