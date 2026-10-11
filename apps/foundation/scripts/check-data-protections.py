"""Isolated PostgreSQL rehearsal, with synthetic Supabase identity roles only."""
from pathlib import Path
import subprocess, time, uuid
name='stylist-data-'+uuid.uuid4().hex[:10]
image='postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
def run(args, **kw):
 return subprocess.run(args,capture_output=True,text=True,timeout=30,**kw)
def sql(text, expected=True):
 r=run(['docker','exec','-i',name,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],input=text)
 assert (r.returncode==0)==expected, r.stderr
 return r.stdout.strip()
a='00000000-0000-0000-0000-000000000001'
b='00000000-0000-0000-0000-000000000002'
created=False
try:
 r=run(['docker','run','-d','--rm','--pull=never','--network','none','--name',name,'--tmpfs','/var/lib/postgresql/data:rw,size=256m','-e','POSTGRES_HOST_AUTH_METHOD=trust',image])
 assert r.returncode==0, 'Pinned PostgreSQL image must be available locally.'
 created=True
 for _ in range(100):
  if run(['docker','exec',name,'pg_isready','-h','127.0.0.1','-U','postgres']).returncode==0: break
  time.sleep(.2)
 else: raise RuntimeError('Database startup timed out')
 sql("create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;")
 sql(f"insert into auth.users values ('{a}'),('{b}');")
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110001_customer_media_foundation.sql').read_text())
 sql(f"insert into public.stylist_media_assets(user_id,storage_key,content_type,width,height) values ('{a}','{a}/fixture.jpg','image/jpeg',100,100);")
 def actor(uid,query): return f"set role authenticated; set request.jwt.claim.sub='{uid}'; "+query
 assert sql(actor(a,'select count(*) from public.stylist_media_assets;'))=='1'
 assert sql(actor(b,'select count(*) from public.stylist_media_assets;'))=='0'
 assert sql(actor('','select count(*) from public.stylist_media_assets;'))=='0'
 sql('set role anon; select * from public.stylist_media_assets;',False)
 for uid in [a,b]:
  for query in ["delete from public.stylist_media_assets;",f"update public.stylist_media_assets set user_id='{b}';",f"insert into public.stylist_media_assets(user_id,storage_key,content_type,width,height) values ('{uid}','{uid}/new.jpg','image/jpeg',1,1);"]:
   sql(actor(uid,query),False)
 sql(f"insert into public.stylist_media_assets(user_id,storage_key,content_type,width,height) values ('{a}','{b}/bad.jpg','image/jpeg',1,1);",False)
 assert sql('select count(*) from public.stylist_media_assets;')=='1'
 print('12 data-protection checks passed. Synthetic local database only; no Storage or hosted acceptance.')
finally:
 if created: run(['docker','rm','-f',name])
