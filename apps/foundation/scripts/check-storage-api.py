"""Disposable local Storage API integration. Never uses hosted keys or projects."""
from pathlib import Path
import base64, hashlib, hmac, json, os, secrets, subprocess, time, uuid

ROOT = Path(__file__).resolve().parents[3]
POSTGRES = 'postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
STORAGE = 'public.ecr.aws/supabase/storage-api@sha256:1f6c99d3952d78d57129802aa2ae8a80d75e327492cf24742fd0aeaf90967b96'
run_id = uuid.uuid4().hex[:12]
network, db, api = ('stylist-storage-' + run_id + x for x in ['-net', '-db', '-api'])
secret = secrets.token_hex(32)
a, b = str(uuid.uuid4()), str(uuid.uuid4())
asset = str(uuid.uuid4())
key = a + '/' + asset + '.webp'
created = []


def run(args, **kw):
    return subprocess.run(args, capture_output=True, text=True,
                          timeout=kw.pop('timeout', 30), **kw)


def require(ok, message):
    if not ok:
        raise RuntimeError(message)


def sql(query, expected_error=None):
    r = run(['docker', 'exec', '-i', db, 'psql', '-U', 'postgres', '-Atq', '-v', 'ON_ERROR_STOP=1'], input=query)
    if expected_error is not None:
        require(r.returncode != 0 and expected_error in r.stderr, 'Expected SQL protection did not reject the operation')
        return ''
    require(r.returncode == 0, 'Local Storage SQL failed: ' + r.stderr[:700])
    return r.stdout.strip()


def token(role, owner=None):
    enc = lambda x: base64.urlsafe_b64encode(json.dumps(x, separators=(',', ':')).encode()).rstrip(b'=')
    payload = {'role': role, 'iss': 'local-test', 'iat': int(time.time()), 'exp': int(time.time()) + 300}
    if owner:
        payload['sub'] = owner
    body = enc({'alg': 'HS256', 'typ': 'JWT'}) + b'.' + enc(payload)
    signature = base64.urlsafe_b64encode(hmac.new(secret.encode(), body, hashlib.sha256).digest()).rstrip(b'=')
    return (body + b'.' + signature).decode()


FETCH = '''const fs=require('fs');const x=JSON.parse(fs.readFileSync(0,'utf8'));
(async()=>{const r=await fetch('http://127.0.0.1:5000'+x.path,{method:x.method,
headers:x.headers,body:x.body?Buffer.from(x.body,'base64'):undefined,
redirect:'error',signal:AbortSignal.timeout(5000)});
console.log(JSON.stringify({status:r.status,body:Buffer.from(await r.arrayBuffer()).toString('base64')}));
})().catch(()=>process.exit(1));'''


def request(path, jwt=None, method='GET', body=None, content_type=None, extra=None):
    require(path.startswith('/') and not path.startswith('//'), 'Unsafe local test path')
    headers = dict(extra or {})
    if jwt:
        headers['Authorization'] = 'Bearer ' + jwt
    if content_type:
        headers['Content-Type'] = content_type
    data = {'path': path, 'method': method, 'headers': headers,
            'body': base64.b64encode(body).decode() if body is not None else None}
    r = run(['docker', 'exec', '-i', api, 'node', '-e', FETCH], input=json.dumps(data), timeout=10)
    require(r.returncode == 0, 'Local Storage request failed')
    result = json.loads(r.stdout)
    return result['status'], base64.b64decode(result['body'])


def json_request(path, jwt, method, value):
    return request(path, jwt, method, json.dumps(value).encode(), 'application/json')


try:
    require(run(['docker', 'network', 'create', '--internal', network]).returncode == 0, 'Internal network unavailable')
    created.append(('network', network))
    r = run(['docker', 'run', '-d', '--pull=never', '--network', network, '--network-alias', 'db',
             '--name', db, '--memory', '256m', '--memory-swap', '256m', '--cpus', '1', '--pids-limit', '96',
             '--tmpfs', '/var/lib/postgresql/data:rw,size=256m',
             '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', POSTGRES])
    require(r.returncode == 0, 'Local PostgreSQL could not start')
    created.append(('container', db))
    for _ in range(100):
        if run(['docker', 'exec', db, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']).returncode == 0:
            break
        time.sleep(.2)
    else:
        raise RuntimeError('Local PostgreSQL startup timeout')
    sql("""create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
(nullif(current_setting('request.jwt.claims',true),'')::jsonb)->>'sub')::uuid $$;
""")
    sql("create table auth.sessions(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,not_after timestamptz); alter table auth.users add column banned_until timestamptz, add column deleted_at timestamptz, add column is_anonymous boolean default false;")
    sql(f"insert into auth.users(id) values ('{a}'),('{b}');")
    env = os.environ.copy()
    env.update({'AUTH_JWT_SECRET': secret, 'ANON_KEY': token('anon'),
                'SERVICE_KEY': token('service_role'), 'DATABASE_URL': 'postgres://postgres@db:5432/postgres',
                'DB_INSTALL_ROLES': 'true', 'DB_MIGRATIONS_STRATEGY': 'on_startup',
                'STORAGE_BACKEND': 'file', 'FILE_STORAGE_BACKEND_PATH': '/var/lib/storage',
                'GLOBAL_S3_BUCKET': 'local-fixtures', 'TENANT_ID': 'stylist-test', 'REGION': 'local',
                'POSTGREST_URL': 'http://127.0.0.1:1', 'ENABLE_IMAGE_TRANSFORMATION': 'false',
                'PG_QUEUE_ENABLE': 'false', 'S3_PROTOCOL_ENABLED': 'false', 'LOG_LEVEL': 'error'})
    variables = ['AUTH_JWT_SECRET', 'ANON_KEY', 'SERVICE_KEY', 'DATABASE_URL', 'DB_INSTALL_ROLES',
                 'DB_MIGRATIONS_STRATEGY', 'STORAGE_BACKEND', 'FILE_STORAGE_BACKEND_PATH',
                 'GLOBAL_S3_BUCKET', 'TENANT_ID', 'REGION', 'POSTGREST_URL',
                 'ENABLE_IMAGE_TRANSFORMATION', 'PG_QUEUE_ENABLE', 'S3_PROTOCOL_ENABLED', 'LOG_LEVEL']
    args = ['docker', 'run', '-d', '--pull=never', '--network', network, '--name', api,
            '--memory', '384m', '--memory-swap', '384m', '--cpus', '1', '--pids-limit', '96',
            '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--read-only',
            '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m',
            '--tmpfs', '/var/lib/storage:rw,noexec,nosuid,size=32m']
    for variable in variables:
        args += ['-e', variable]
    args += ['--entrypoint', 'node', STORAGE, 'dist/start/server.js']
    require(run(args, env=env).returncode == 0, 'Local Storage API could not start')
    created.append(('container', api))
    for _ in range(60):
        status = run(['docker', 'inspect', '--format', '{{.State.Status}}', api]).stdout.strip()
        if status == 'exited':
            logs = run(['docker', 'logs', '--tail', '5', api]).stdout
            # Test-only credentials are never returned by this failure summary.
            for value in [secret, env['ANON_KEY'], env['SERVICE_KEY']]:
                logs = logs.replace(value, '[redacted]')
            raise RuntimeError('Local Storage startup failed: ' + logs[-1400:])
        try:
            if request('/status')[0] == 200:
                break
        except RuntimeError:
            pass
        time.sleep(.25)
    else:
        raise RuntimeError('Local Storage API startup timeout')
    sql('grant usage on schema auth to authenticated,anon,service_role; grant execute on function auth.uid() to authenticated,anon,service_role;')
    migrations = sorted((ROOT / 'supabase/migrations').glob('*.sql'))
    require(len(migrations) == 16, 'Review upgrade rehearsal boundaries after changing migration count')
    for migration in migrations[:8]:
        sql(migration.read_text())
    owner, other, service, anon = token('authenticated', a), token('authenticated', b), token('service_role'), token('anon')
    legacy_id = str(uuid.uuid4())
    legacy_key = a + '/legacy-camera.jpg'
    legacy_path = '/object/stylist-wardrobe/' + legacy_key
    legacy_generated = run(['node', '--input-type=module', '-e',
        "import sharp from 'sharp';console.log((await sharp({create:{width:3,height:2,channels:3,background:'#286b85'}}).jpeg().toBuffer()).toString('base64'));"], cwd=ROOT / 'apps/foundation')
    require(legacy_generated.returncode == 0, 'Legacy fixture generation failed')
    legacy_image = base64.b64decode(legacy_generated.stdout.strip())
    require(request(legacy_path, service, 'POST', legacy_image, 'image/jpeg')[0] == 200, 'Legacy image upload failed')
    sql(f"insert into public.stylist_media_assets(id,user_id,storage_key,content_type,width,height) values ('{legacy_id}','{a}','{legacy_key}','image/jpeg',3,2);")
    actor = f"set role authenticated; set request.jwt.claim.sub='{a}'; "
    legacy_wardrobe = sql(actor + f"select (public.stylist_save_wardrobe('{legacy_id}','Existing jacket',true)).id;")
    legacy_items = json.dumps([{'assetId': legacy_id, 'label': 'Existing jacket'}])
    legacy_look = sql(actor + f"select (public.stylist_save_owned_look('Existing saved look','{legacy_items}'::jsonb,true)).id;")
    for migration in migrations[8:]:
        sql(migration.read_text())
    legacy_record = json.loads(sql(f"set role service_role; select public.stylist_read_media_operation('{legacy_id}','{a}');"))
    require(legacy_record['state'] == 'ready' and legacy_record['checksum'] is None and legacy_record['key'] == legacy_key,
            'Upgrade changed legacy media state/key')
    require(sql(actor + f"select count(*) from public.stylist_wardrobe_items where id='{legacy_wardrobe}' and asset_id='{legacy_id}';") == '1', 'Upgrade lost wardrobe reference')
    require(sql(actor + f"select count(*) from public.stylist_saved_look_items where look_id='{legacy_look}' and asset_id='{legacy_id}';") == '1', 'Upgrade lost saved-look reference')
    foreign = f"set role authenticated; set request.jwt.claim.sub='{b}'; "
    require(sql(foreign + f"select count(*) from public.stylist_media_assets where id='{legacy_id}';") == '0', 'Upgrade exposed foreign metadata')
    require(request(legacy_path, owner) == (200, legacy_image) and request(legacy_path, other)[0] != 200,
            'Upgrade changed legacy image bytes or owner protection')
    print('Actual Storage upgrade preserves legacy JPEG bytes, wardrobe/saved-look references and owner isolation')
    generated = run(['node', '--input-type=module', '-e',
                     "import sharp from 'sharp';console.log((await sharp({create:{width:2,height:2,channels:3,background:'#157568'}}).webp().toBuffer()).toString('base64'));"],
                    cwd=ROOT / 'apps/foundation')
    require(generated.returncode == 0, 'Generated fixture unavailable')
    image = base64.b64decode(generated.stdout.strip())
    path = '/object/stylist-wardrobe/' + key
    code, body = request(path, service, 'POST', image, 'image/webp', {'x-upsert': 'false'})
    require(code == 200, 'Service fixture upload failed')
    ack = json.loads(body)
    require(ack.get('Key') == 'stylist-wardrobe/' + key and bool(ack.get('Id')), 'Actual upload acknowledgment differs from prepared adapter')
    for jwt, label in [(owner, 'owner'), (other, 'other owner'), (anon, 'anonymous'), (None, 'missing token')]:
        code, body = request(path, jwt)
        require((code == 200 and body == image) if jwt == owner else code != 200,
                label + ' private read result incorrect')
    require(request('/object/public/stylist-wardrobe/' + key)[0] != 200, 'Private object exposed publicly')
    print('Private reads: owner allowed; foreign/anonymous/unauthenticated/public reads denied')
    for jwt in [owner, other, anon]:
        require(request('/object/stylist-wardrobe/' + a + '/new.webp', jwt, 'POST', image, 'image/webp')[0] != 200,
                'Direct customer upload allowed')
        require(request(path, jwt, 'PUT', image, 'image/webp')[0] != 200, 'Direct customer overwrite allowed')
        json_request('/object/stylist-wardrobe', jwt, 'DELETE', {'prefixes': [key]})
        require(request(path, owner) == (200, image), 'Direct customer removal changed object')
    print('Direct customer upload, overwrite and deletion cannot change the object')
    code, body = json_request('/object/sign/stylist-wardrobe/' + key, owner, 'POST', {'expiresIn': 2})
    require(code == 200, 'Owner could not create signed URL')
    signed = json.loads(body).get('signedURL')
    require(isinstance(signed, str) and signed.startswith('/object/sign/'), 'Unexpected signed URL shape')
    require(request(signed) == (200, image), 'Signed URL did not read exact image')
    for jwt in [other, anon]:
        require(json_request('/object/sign/stylist-wardrobe/' + key, jwt, 'POST', {'expiresIn': 2})[0] != 200,
                'Foreign customer created signed URL')
    time.sleep(3)
    require(request(signed)[0] != 200, 'Expired signed URL remained valid')
    print('Signed links: owner issuance and exact bytes pass; foreign issuance and expired reuse denied')
    code, body = json_request('/object/stylist-wardrobe', service, 'DELETE', {'prefixes': [key]})
    require(code == 200, 'Service removal failed')
    removed = json.loads(body)
    require(isinstance(removed, list) and len(removed) == 1 and removed[0].get('name') == key
            and removed[0].get('bucket_id') == 'stylist-wardrobe', 'Actual removal acknowledgment differs from prepared adapter')
    require(request(path, owner)[0] != 200, 'Removed object still readable')
    print('Exact service upload/removal acknowledgments match the prepared transport')
    # Execute the actual prepared TypeScript transport against this local HTTP API.
    # Only this test fetch maps the fixed synthetic HTTPS origin to loopback.
    transport = (ROOT / 'apps/foundation/src/server/supabase-storage.ts').read_text()
    writer = run(['docker', 'exec', '-i', api, 'node', '-e',
                  "require('fs').writeFileSync('/tmp/stylist-storage.ts',require('fs').readFileSync(0))"], input=transport)
    require(writer.returncode == 0, 'Local adapter fixture unavailable')
    reader_source = (ROOT / 'apps/foundation/src/server/media-read.ts').read_text()
    writer = run(['docker', 'exec', '-i', api, 'node', '-e',
                  "require('fs').writeFileSync('/tmp/stylist-media-read.ts',require('fs').readFileSync(0))"], input=reader_source)
    require(writer.returncode == 0, 'Local image-read fixture unavailable')
    adapter_check = r"""const fs=require('fs');const assert=require('assert/strict');
const {createHash}=require('crypto');const x=JSON.parse(fs.readFileSync(0,'utf8'));
(async()=>{const {createSupabaseStorage}=await import('file:///tmp/stylist-storage.ts');
const port=createSupabaseStorage('https://fixture.supabase.co/',x.token,(url,init)=>{
 const parsed=new URL(url);assert.equal(parsed.origin,'https://fixture.supabase.co');
 assert.ok(parsed.pathname.startsWith('/storage/v1/'));
 return fetch('http://127.0.0.1:5000'+parsed.pathname.slice('/storage/v1'.length),init);
});
const bytes=Buffer.from(x.image,'base64');await port.putIfAbsent(x.key,bytes);
assert.deepEqual(await port.inspect(x.key),{state:'present',checksum:createHash('sha256').update(bytes).digest('hex')});
await assert.rejects(port.putIfAbsent(x.key,bytes));
const {createMediaReadHandler}=await import('file:///tmp/stylist-media-read.ts');
const {Client}=require('pg');const db=new Client({connectionString:'postgres://postgres@db:5432/postgres'});await db.connect();
try{
 const id=x.key.split('/')[1].slice(0,-5);const owner=x.key.split('/')[0];
 await db.query("insert into public.stylist_media_assets(id,user_id,storage_key,content_type,width,height,checksum,state) values($1,$2,$3,'image/webp',2,2,$4,'ready')",[id,owner,x.key,createHash('sha256').update(bytes).digest('hex')]);
 await db.query('set role service_role');
 const handle=createMediaReadHandler('https://stylist.example',{
  // Identity verification stays simulated; actual Auth integration belongs to 2c.
  authorize:async(request)=>({ownerId:request.headers.get('authorization')===x.ownerToken?owner:x.otherOwner,isCurrent:async()=>true}),
  read:async(asset,who)=>(await db.query('select public.stylist_read_media_operation($1,$2) value',[asset,who])).rows[0].value,
  download:(key,signal)=>port.download(key,signal),
 });
 const url='https://stylist.example/api/media/'+id;
 const allowed=await handle(new Request(url,{headers:{authorization:x.ownerToken}}));
 assert.equal(allowed.status,200);assert.deepEqual(Buffer.from(await allowed.arrayBuffer()),bytes);
 assert.equal((await handle(new Request(url,{headers:{authorization:x.otherToken}}))).status,404);
 assert.ok(allowed.headers.get('cache-control').includes('no-store'));assert.equal(allowed.headers.has('location'),false);
 const legacy=await handle(new Request('https://stylist.example/api/media/'+x.legacyId,{headers:{authorization:x.ownerToken}}));
 assert.equal(legacy.status,200);assert.equal(legacy.headers.get('content-type'),'image/jpeg');assert.deepEqual(Buffer.from(await legacy.arrayBuffer()),Buffer.from(x.legacyImage,'base64'));
 console.log('Account-bound read handler passes actual local SQL/Storage bytes and copied-URL owner-isolation checks with simulated Auth');
}finally{await db.end();}
await port.remove(x.key);
assert.deepEqual(await port.inspect(x.key),{state:'absent'});
console.log('Prepared Storage transport passes actual local upload/checksum/no-overwrite/remove/absence checks');
})().catch(e=>{console.error(e.message);process.exit(1)});"""
    check_input = {'token': service, 'image': base64.b64encode(image).decode(),
                   'key': a + '/' + str(uuid.uuid4()) + '.webp',
                   'ownerToken': owner, 'otherToken': other, 'otherOwner': b,
                   'legacyId': legacy_id, 'legacyImage': base64.b64encode(legacy_image).decode()}
    checked = run(['docker', 'exec', '-i', api, 'node', '-e', adapter_check], input=json.dumps(check_input))
    require(checked.returncode == 0, 'Prepared adapter local API check failed: ' + checked.stderr[:500])
    print(checked.stdout.strip())
    # Existing references must protect real object bytes until all are removed.
    begin_legacy = actor + f"select public.stylist_begin_media_delete('{legacy_id}',1,true);"
    sql(begin_legacy, expected_error='asset referenced')
    require(sql(actor + f"select public.stylist_delete_wardrobe('{legacy_wardrobe}',1,true);") == 't', 'Legacy wardrobe removal failed')
    sql(begin_legacy, expected_error='asset referenced')
    require(request(legacy_path, owner) == (200, legacy_image), 'Removing one reference removed shared image bytes')
    require(sql(actor + f"select public.stylist_delete_saved_look('{legacy_look}',1,true);") == 't', 'Legacy saved-look removal failed')
    claim = json.loads(sql(begin_legacy))
    require(claim['key'] == legacy_key, 'Legacy deletion claim key mismatch')
    require(request(legacy_path, service)[0] == 200, 'Claim unexpectedly removed object bytes')
    code, body = json_request('/object/stylist-wardrobe', service, 'DELETE', {'prefixes': [legacy_key]})
    removed = json.loads(body)
    require(code == 200 and len(removed) == 1 and removed[0].get('name') == legacy_key, 'Legacy object removal failed')
    require(sql(f"set role service_role; select public.stylist_finish_media_delete('{legacy_id}','{a}','{claim['deletionToken']}');") == 't', 'Legacy metadata finalization failed')
    receipt = json.loads(sql(f"set role service_role; select public.stylist_read_media_operation('{legacy_id}','{a}');"))
    require(receipt['state'] == 'deleted' and request(legacy_path, owner)[0] != 200, 'Legacy deletion proof/object absence failed')
    require(sql(f"set role service_role; select public.stylist_read_media_operation('{legacy_id}','{b}');") == '', 'Foreign owner saw deletion receipt')
    sql(f"insert into public.stylist_media_assets(id,user_id,storage_key,content_type,width,height) values ('{legacy_id}','{a}','{legacy_key}','image/jpeg',3,2);", expected_error='image id retired')
    print('Shared legacy image is protected until both references are removed; actual deletion, receipt isolation and retired-ID protection pass')
    print('Actual local Storage API protection and signed-expiry checks pass; hosted acceptance remains open')
finally:
    failures = []
    for kind, name in reversed(created):
        args = ['docker', 'rm', '-f', name] if kind == 'container' else ['docker', 'network', 'rm', name]
        if run(args).returncode != 0:
            failures.append(kind)
    require(not failures, 'Temporary Storage integration cleanup failed')
