"""Isolated PostgreSQL rehearsal, with synthetic Supabase identity roles only."""
from pathlib import Path
import subprocess, time, uuid, json
from concurrent.futures import ThreadPoolExecutor
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
 # A minimal Storage schema rehearses policy SQL, not the Storage API/signing service.
 sql("create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text); alter table storage.objects enable row level security; grant usage on schema storage to authenticated,anon; grant select,insert,update,delete on storage.objects to authenticated,anon;")
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110002_private_image_bucket.sql').read_text())
 sql(f"insert into storage.objects(bucket_id,name) values ('stylist-wardrobe','{a}/fixture.jpg'),('other','{a}/other.jpg');")
 assert sql(actor(a,'select count(*) from storage.objects;'))=='1'
 assert sql(actor(b,'select count(*) from storage.objects;'))=='0'
 assert sql('set role anon; select count(*) from storage.objects;')=='0'
 sql(actor(a,f"insert into storage.objects(bucket_id,name) values ('stylist-wardrobe','{a}/new.jpg');"),False)
 assert sql(actor(a,"with changed as (delete from storage.objects returning *) select count(*) from changed;"))=='0'
 assert sql(actor(a,"with changed as (update storage.objects set name='changed' returning *) select count(*) from changed;"))=='0'
 assert sql("select public::text || ':' || file_size_limit::text from storage.buckets where id='stylist-wardrobe';")=='false:10485760'
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110003_controlled_wardrobe.sql').read_text())
 asset=sql('select id from public.stylist_media_assets limit 1;')
 def save(uid,label='Jacket',consent='true',item='null',revision='0',expected=True):
  return sql(actor(uid,f"select (public.stylist_save_wardrobe('{asset}','{label}',{consent},{item},{revision})).id;"),expected)
 save(a,consent='false',expected=False)
 save(a,consent='null',expected=False)
 save(a,label='',expected=False)
 save(a,revision='1',expected=False)
 save(b,expected=False)
 save('',expected=False)
 item=save(a)
 assert sql(actor(a,'select revision from public.stylist_wardrobe_items;'))=='1'
 assert sql(actor(b,'select count(*) from public.stylist_wardrobe_items;'))=='0'
 save(b,item=f"'{item}'",revision='1',expected=False)
 save(a,item=f"'{item}'",revision='1')
 save(a,item=f"'{item}'",revision='1',expected=False)
 assert sql(actor(a,'select revision from public.stylist_wardrobe_items;'))=='2'
 sql(actor(a,"update public.stylist_wardrobe_items set label='Bypass';"),False)
 sql(actor(a,'delete from public.stylist_wardrobe_items;'),False)
 sql('set role anon; select public.stylist_save_wardrobe(null, null, true);',False)
 def race():
  query=actor(a,f"select (public.stylist_save_wardrobe('{asset}','Concurrent',true,'{item}',2)).revision;")
  return run(['docker','exec','-i',name,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],input=query)
 with ThreadPoolExecutor(max_workers=2) as pool:
  results=list(pool.map(lambda _:race(),range(2)))
 assert sum(r.returncode==0 for r in results)==1
 assert sql(actor(a,'select revision from public.stylist_wardrobe_items;'))=='3'
 sql(f"insert into public.stylist_wardrobe_items(user_id,asset_id,label) values ('{b}','{asset}','Foreign');",False)
 sql(actor(a,f"insert into public.stylist_wardrobe_items(user_id,asset_id,label) values ('{a}','{asset}','Bypass');"),False)
 assert sql("select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='stylist_save_wardrobe' and p.prosecdef and p.proconfig=array['search_path=\"\"'];")=='1'
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110004_controlled_wardrobe_delete.sql').read_text())
 for uid,revision,confirm in [(a,2,'true'),(b,3,'true'),('',3,'true'),(a,3,'false'),(a,3,'null')]:
  sql(actor(uid,f"select public.stylist_delete_wardrobe('{item}',{revision},{confirm});"),False)
 assert sql(actor(a,'select count(*) from public.stylist_wardrobe_items;'))=='1'
 assert sql(actor(a,f"select public.stylist_delete_wardrobe('{item}',3,true);"))=='t'
 sql(actor(a,f"select public.stylist_delete_wardrobe('{item}',3,true);"),False)
 assert sql(actor(a,'select count(*) from public.stylist_wardrobe_items;'))=='0'
 assert sql('select count(*) from public.stylist_media_assets;')=='1'
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110005_controlled_profiles.sql').read_text())
 profile='\'{"preferredColors":["Blue"],"excludedColors":["Red"],"styles":["Structured"],"excludedCategories":[],"budgetCents":35000,"currency":"USD"}\'::jsonb'
 def profile_save(uid,revision,consent='true',payload=None,expected=True):
  return sql(actor(uid,f"select (public.stylist_save_profile({payload or profile},{revision},{consent})).revision;"),expected)
 profile_save(a,0,'false',expected=False)
 profile_save('',0,expected=False)
 profile_save(a,0,payload="'{\"notes\":{}}'::jsonb",expected=False)
 assert profile_save(a,0)=='1'
 assert sql(actor(b,'select count(*) from public.stylist_profiles;'))=='0'
 profile_save(a,0,expected=False)
 assert profile_save(a,1)=='2'
 profile_save(a,1,expected=False)
 sql(actor(a,"update public.stylist_profiles set revision=99;"),False)
 sql(actor(a,'select * from stylist_private.profile_changes;'),False)
 assert sql('select count(*) from stylist_private.profile_changes;')=='2'
 assert sql('select max(revision) from stylist_private.profile_changes;')=='2'
 valid={"preferredColors":["Blue"],"excludedColors":["Red"],"styles":["Structured"],"excludedCategories":[],"budgetCents":35000,"currency":"USD"}
 bad_profiles=[{**valid,"currency":None},{**valid,"currency":"EUR"},{**valid,"budgetCents":-1},{**valid,"budgetCents":1.5},{**valid,"budgetCents":9007199254740992},{**valid,"transcript":"private"},{**valid,"excludedColors":["blue"]},{**valid,"styles":["A","a"]},{**valid,"styles":[""]},{**valid,"styles":[None]},{**valid,"styles":["x"*81]}]
 for bad in bad_profiles:
  payload="'"+json.dumps(bad).replace("'","''")+"'::jsonb"
  profile_save(a,2,payload=payload,expected=False)
 assert sql('select count(*) from stylist_private.profile_changes;')=='2'
 def profile_race():
  query=actor(a,f"select (public.stylist_save_profile({profile},2,true)).revision;")
  return run(['docker','exec','-i',name,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],input=query)
 with ThreadPoolExecutor(max_workers=2) as pool:
  results=list(pool.map(lambda _:profile_race(),range(2)))
 assert sum(r.returncode==0 for r in results)==1
 assert sql(actor(a,'select revision from public.stylist_profiles;'))=='3'
 assert sql('select count(*) from stylist_private.profile_changes;')=='3'
 profile_save(a,2,expected=False)
 assert sql('select count(*) from stylist_private.profile_changes;')=='3'
 assert sql(actor(b,'select count(*) from public.stylist_profiles;'))=='0'
 sql(actor(a,'delete from public.stylist_profiles;'),False)
 sql('set role anon; select public.stylist_save_profile(null,0,true);',False)
 # Explicit transaction rollback must remove both the saved data and its signal.
 sql(actor(a,f"begin; select public.stylist_save_profile({profile},3,true); rollback;"))
 assert sql(actor(a,'select revision from public.stylist_profiles;'))=='3'
 assert sql('select count(*) from stylist_private.profile_changes;')=='3'
 print('85 data-protection checks passed. PostgreSQL plus simulated Storage schema; no hosted or signed-URL acceptance.')
finally:
 if created: run(['docker','rm','-f',name])
