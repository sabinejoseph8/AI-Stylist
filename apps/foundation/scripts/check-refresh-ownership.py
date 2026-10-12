"""Isolated PostgreSQL refresh ownership rehearsal. Synthetic identity and ciphertext only."""
from pathlib import Path
import subprocess,uuid,time,json
from concurrent.futures import ThreadPoolExecutor
name='stylist-refresh-'+uuid.uuid4().hex[:10]
image='postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
def run(args,**kw): return subprocess.run(args,capture_output=True,text=True,timeout=kw.pop('timeout',30),**kw)
def sql(query,expected=True):
 r=run(['docker','exec','-i',name,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],input=query)
 assert (r.returncode==0)==expected,r.stderr
 return r.stdout.strip()
owner='11111111-1111-4111-8111-111111111111';other='33333333-3333-4333-8333-333333333333';session='22222222-2222-4222-8222-222222222222'
envelope=json.dumps(dict(version=1,keyId='fixture',nonce='A'*16,ciphertext='fixture',tag='A'*22))
expiry="(extract(epoch from clock_timestamp())*1000)::bigint+60000"
created=False;volume_created=False;volume=name+'-data'
try:
 r=run(['docker','volume','create',volume]);assert r.returncode==0,r.stderr;volume_created=True
 r=run(['docker','run','-d','--rm','--pull=never','--network','none','--name',name,'-v',volume+':/var/lib/postgresql/data','-e','POSTGRES_HOST_AUTH_METHOD=trust',image]);assert r.returncode==0,r.stderr;created=True
 for _ in range(100):
  if run(['docker','exec',name,'pg_isready','-U','postgres']).returncode==0: break
  time.sleep(.2)
 else: raise RuntimeError('Database startup timed out')
 sql("create role anon;create role authenticated;create role service_role;create schema auth;create schema stylist_private;create table auth.users(id uuid primary key,deleted_at timestamptz,is_anonymous boolean default false,banned_until timestamptz);create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);")
 sql(f"insert into auth.users(id) values('{owner}'),('{other}');insert into auth.sessions values('{session}','{owner}',null);")
 root=Path(__file__).resolve().parents[3]
 for migration in ['202610110016_current_auth_session.sql','202610110017_refresh_ownership.sql']:sql((root/'supabase/migrations'/migration).read_text())
 adopt=f"select public.stylist_adopt_refresh('{owner}','{session}',{expiry},'{envelope}'::jsonb);"
 assert sql('set role service_role;'+adopt)=='t'
 assert sql('set role service_role;'+adopt)=='f'
 for role in ['anon','authenticated','service_role']:sql(f'set role {role};select * from stylist_private.refresh_ownership;',False)
 for role in ['anon','authenticated']:sql(f'set role {role};'+adopt,False)
 assert sql(f"select public.stylist_claim_refresh('{other}','{session}',1);")==''
 claim=f"select public.stylist_claim_refresh('{owner}','{session}',1);"
 with ThreadPoolExecutor(2) as pool: results=list(pool.map(lambda _:sql('set role service_role;'+claim),range(2)))
 winners=[json.loads(result) for result in results if result];assert len(winners)==1
 lease=winners[0]['lease_id'];assert winners[0]['state']=='rotating'
 r=run(['docker','restart',name]);assert r.returncode==0,r.stderr
 for _ in range(100):
  if run(['docker','exec',name,'pg_isready','-U','postgres']).returncode==0: break
  time.sleep(.2)
 else: raise RuntimeError('Database restart timed out')
 assert sql(claim)=='' # a real database/container restart does not reclaim an unresolved rotation
 finish=lambda gen,l:f"select public.stylist_finish_refresh('{owner}','{session}',{gen},'{l}',{expiry},'{envelope}'::jsonb);"
 assert sql(finish(2,lease))=='f'
 assert sql(finish(1,'44444444-4444-4444-8444-444444444444'))=='f'
 assert sql(f"select public.stylist_hold_refresh('{owner}','{session}',1,'{lease}');")=='t'
 assert sql(finish(1,lease))=='f';assert sql(claim)==''
 inspected=json.loads(sql(f"set role service_role;select public.stylist_inspect_refresh('{owner}','{session}');"));assert inspected['state']=='held'
 assert sql(f"set role service_role;select public.stylist_inspect_refresh('{other}','{session}');")==''
 sql(f"set role authenticated;select public.stylist_inspect_refresh('{owner}','{session}');",False)
 assert sql(f"select public.stylist_remove_refresh('{owner}','{session}',1,'{lease}',false);")=='f'
 assert sql(f"select public.stylist_remove_refresh('{owner}','{session}',1,'{lease}',true);")=='t'
 assert sql(adopt)=='t';next_value=json.loads(sql(claim));assert sql(finish(1,next_value['lease_id']))=='t'
 assert sql("select generation||':'||state from stylist_private.refresh_ownership;")=='2:ready'
 assert sql(finish(1,next_value['lease_id']))=='f'
 sql(f"update stylist_private.refresh_ownership set envelope='{{\"plaintext\":\"forbidden\"}}';",False)
 sql(f"delete from auth.sessions where id='{session}';")
 assert sql('select count(*) from stylist_private.refresh_ownership;')=='0'
 print('Refresh ownership PostgreSQL rehearsal passed: service-only access, one concurrent winner, database restart hold, fencing, confirmed removal, rotation and cascade.')
finally:
 if created:run(['docker','rm','-f',name])
 if volume_created:run(['docker','volume','rm',volume])
