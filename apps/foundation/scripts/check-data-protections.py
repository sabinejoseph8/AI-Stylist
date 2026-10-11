"""Isolated PostgreSQL rehearsal, with synthetic Supabase identity roles only."""
from pathlib import Path
import subprocess, time, uuid, json
from concurrent.futures import ThreadPoolExecutor
name='stylist-data-'+uuid.uuid4().hex[:10]
image='postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
def run(args, **kw):
 return subprocess.run(args,capture_output=True,text=True,timeout=kw.pop('timeout',30),**kw)
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
 sql("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;")
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
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110006_profile_revision_read.sql').read_text())
 snapshot=json.loads(sql(actor(a,'select public.stylist_read_profile_revision();')))
 assert snapshot['revision']==3 and snapshot['sequence']>0
 assert json.loads(sql(actor(b,'select public.stylist_read_profile_revision();')))=={'revision':0,'sequence':0}
 sql('set role anon; select public.stylist_read_profile_revision();',False)
 sql(actor('','select public.stylist_read_profile_revision();'),False)
 assert profile_save(a,3)=='4'
 latest=json.loads(sql(actor(a,'select public.stylist_read_profile_revision();')))
 assert latest['revision']==4 and latest['sequence']>snapshot['sequence']
 assert json.loads(sql(actor(b,'select public.stylist_read_profile_revision();')))=={'revision':0,'sequence':0}
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110007_saved_looks.sql').read_text())
 components="'"+json.dumps([{'assetId':asset,'label':'Jacket'}])+"'::jsonb"
 def look_save(uid,items=None,consent='true',look='null',revision=0,expected=True):
  return sql(actor(uid,f"select (public.stylist_save_owned_look('Saved look',{items or components},{consent},{look},{revision})).id;"),expected)
 look_save(a,consent='false',expected=False)
 look_save(b,expected=False)
 look_save(a,items="'[]'::jsonb",expected=False)
 look_save(a,items="'[{\"transcript\":\"private\"}]'::jsonb",expected=False)
 look=look_save(a)
 assert sql(actor(a,'select count(*) from public.stylist_saved_look_items;'))=='1'
 assert sql(actor(b,'select count(*) from public.stylist_saved_looks;'))=='0'
 assert sql(actor(b,'select count(*) from public.stylist_saved_look_items;'))=='0'
 look_save(a,look=f"'{look}'",revision=1)
 look_save(a,look=f"'{look}'",revision=1,expected=False)
 duplicate="'"+json.dumps([{'assetId':asset,'label':'One'},{'assetId':asset,'label':'Two'}])+"'::jsonb"
 look_save(a,items=duplicate,look=f"'{look}'",revision=2,expected=False)
 assert sql(actor(a,'select revision from public.stylist_saved_looks;'))=='2'
 assert sql(actor(a,'select count(*) from public.stylist_saved_look_items;'))=='1'
 sql(actor(a,"update public.stylist_saved_looks set label='Bypass';"),False)
 sql(actor(a,'delete from public.stylist_saved_look_items;'),False)
 sql('set role anon; select * from public.stylist_saved_looks;',False)
 def look_race():
  query=actor(a,f"select (public.stylist_save_owned_look('Concurrent',{components},true,'{look}',2)).revision;")
  return run(['docker','exec','-i',name,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],input=query)
 with ThreadPoolExecutor(max_workers=2) as pool:
  results=list(pool.map(lambda _:look_race(),range(2)))
 assert sum(r.returncode==0 for r in results)==1
 assert sql(actor(a,'select revision from public.stylist_saved_looks;'))=='3'
 assert sql(actor(a,'select count(*) from public.stylist_saved_look_items;'))=='1'
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110008_saved_look_delete.sql').read_text())
 for uid,rev,confirm in [(a,2,'true'),(b,3,'true'),('',3,'true'),(a,3,'false'),(a,3,'null')]:
  sql(actor(uid,f"select public.stylist_delete_saved_look('{look}',{rev},{confirm});"),False)
 assert sql(actor(a,'select count(*) from public.stylist_saved_looks;'))=='1'
 assert sql(actor(a,f"select public.stylist_delete_saved_look('{look}',3,true);"))=='t'
 assert sql(actor(a,'select count(*) from public.stylist_saved_look_items;'))=='0'
 assert sql(actor(a,'select count(*) from public.stylist_saved_looks;'))=='0'
 assert sql('select count(*) from public.stylist_media_assets;')=='1'
 sql(actor(a,f"select public.stylist_delete_saved_look('{look}',3,true);"),False)
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110009_media_lifecycle.sql').read_text())
 staged='00000000-0000-0000-0000-000000000003'
 checksum='a'*64
 sql(f"set role service_role; select public.stylist_stage_media('{staged}','{a}','{checksum}',10,10);")
 sql(actor(a,f"select public.stylist_commit_media('{staged}','{a}','{checksum}');"),False)
 sql(actor(a,f"select public.stylist_save_wardrobe('{staged}','Staged',true);"),False)
 sql(f"set role service_role; select public.stylist_commit_media('{staged}','{b}','{checksum}');",False)
 sql(f"set role service_role; select public.stylist_commit_media('{staged}','{a}','{'b'*64}');",False)
 sql(f"set role service_role; select public.stylist_commit_media('{staged}','{a}','{checksum}');")
 saved=sql(actor(a,f"select (public.stylist_save_wardrobe('{staged}','Ready',true)).id;"))
 sql(actor(a,f"select public.stylist_begin_media_delete('{staged}',2,true);"),False)
 sql(actor(a,f"select public.stylist_delete_wardrobe('{saved}',1,true);"))
 sql(actor(b,f"select public.stylist_begin_media_delete('{staged}',2,true);"),False)
 claim=json.loads(sql(actor(a,f"select public.stylist_begin_media_delete('{staged}',2,true);")))
 assert claim['key']==f'{a}/{staged}.webp'
 sql(actor(a,f"select public.stylist_save_wardrobe('{staged}','Deleting',true);"),False)
 sql(f"set role service_role; select public.stylist_finish_media_delete('{staged}','{a}','{staged}');",False)
 assert sql(f"select state from public.stylist_media_assets where id='{staged}';")=='deleting'
 sql(f"set role service_role; select public.stylist_finish_media_delete('{staged}','{a}','{claim['deletionToken']}');")
 assert sql(f"select count(*) from public.stylist_media_assets where id='{staged}';")=='0'
 race_id='00000000-0000-0000-0000-000000000004'
 sql(f"set role service_role; select public.stylist_stage_media('{race_id}','{a}','{checksum}',10,10); select public.stylist_commit_media('{race_id}','{a}','{checksum}');")
 def reference_race(action):
  query=actor(a,f"select public.stylist_save_wardrobe('{race_id}','Race',true);" if action=='save' else f"select public.stylist_begin_media_delete('{race_id}',2,true);")
  return run(['docker','exec','-i',name,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],input=query)
 with ThreadPoolExecutor(max_workers=2) as pool:
  results=list(pool.map(reference_race,['save','delete']))
 assert sum(r.returncode==0 for r in results)==1
 state=sql(f"select state from public.stylist_media_assets where id='{race_id}';")
 references=int(sql(f"select count(*) from public.stylist_wardrobe_items where asset_id='{race_id}';"))
 assert (state=='ready' and references==1) or (state=='deleting' and references==0)
 sql(actor(a,f"select public.stylist_stage_media('{staged}','{a}','{checksum}',10,10);"),False)
 sql('set role anon; select public.stylist_stage_media(null,null,null,null,null);',False)
 sql(f"set role service_role; select public.stylist_stage_media('{staged}','{a}','{checksum}',8192,8192);",False)
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110010_media_operation_read.sql').read_text())
 pending=json.loads(sql(f"set role service_role; select public.stylist_read_media_operation('{race_id}','{a}');"))
 assert pending['id']==race_id and pending['ownerId']==a and pending['state']==state
 assert sql(f"set role service_role; select public.stylist_read_media_operation('{race_id}','{b}');") in ['', 'null']
 sql(actor(a,f"select public.stylist_read_media_operation('{race_id}','{a}');"),False)
 sql('set role anon; select public.stylist_read_media_operation(null,null);',False)
 sql((Path(__file__).resolve().parents[3]/'supabase/migrations/202610110011_media_deletion_receipts.sql').read_text())
 checked=run(['node',str(Path(__file__).resolve().parent/'check-media-lifecycle-db.ts'),name],timeout=60)
 assert checked.returncode==0, checked.stderr
 print(checked.stdout.strip())
 print('All local data-protection scenarios passed. PostgreSQL plus simulated Storage schema; no hosted or signed-URL acceptance.')
finally:
 if created: run(['docker','rm','-f',name])
