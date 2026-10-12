"""Disposable isolated PostgreSQL rehearsal; aggregate synthetic counters only."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess,uuid,time,json
name='stylist-admission-'+uuid.uuid4().hex[:10]
volume=name+'-data'
image='postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
created=False;volume_created=False

def run(args,**kw):
 return subprocess.run(args,capture_output=True,text=True,timeout=kw.pop('timeout',30),**kw)
def sql(query,expected=True):
 r=run(['docker','exec','-i',name,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],input=query)
 assert (r.returncode==0)==expected,r.stderr
 return r.stdout.strip()
def ready():
 for _ in range(100):
  if run(['docker','exec',name,'pg_isready','-h','127.0.0.1','-U','postgres']).returncode==0:return
  time.sleep(.2)
 raise RuntimeError('Database startup timed out')
try:
 r=run(['docker','volume','create',volume]);assert r.returncode==0,r.stderr;volume_created=True
 r=run(['docker','run','-d','--rm','--pull=never','--network','none','--name',name,'-v',volume+':/var/lib/postgresql/data','-e','POSTGRES_HOST_AUTH_METHOD=trust',image]);assert r.returncode==0,r.stderr;created=True;ready()
 sql('create role anon;create role authenticated;create role service_role;create schema stylist_private;revoke all on schema stylist_private from public,anon,authenticated,service_role;')
 root=Path(__file__).resolve().parents[3]
 sql((root/'supabase/migrations/202610120021_account_admission.sql').read_text())
 for role in ['anon','authenticated','service_role']:
  sql(f'set role {role};select * from stylist_private.account_admission;',False)
 for role in ['anon','authenticated']:
  sql(f'set role {role};select public.stylist_consume_account_admission();',False)
 consume='set role service_role;select public.stylist_consume_account_admission();'
 with ThreadPoolExecutor(12) as pool:
  results=list(pool.map(lambda _:json.loads(sql(consume)),range(72)))
 assert sum(x['allowed'] for x in results)==60
 assert all(x==dict(allowed=True,retryAfter=0) or (x['allowed'] is False and 1<=x['retryAfter']<=60) for x in results)
 assert sql('select used from stylist_private.account_admission;')=='60'
 r=run(['docker','restart',name]);assert r.returncode==0,r.stderr;ready()
 assert json.loads(sql(consume))['allowed'] is False
 sql("update stylist_private.account_admission set window_started=clock_timestamp()-interval '61 seconds';")
 assert json.loads(sql(consume))==dict(allowed=True,retryAfter=0)
 assert sql('select used from stylist_private.account_admission;')=='1'
 sql("update stylist_private.account_admission set window_started=clock_timestamp()+interval '1 minute';")
 sql(consume,False)
 assert sql('select used from stylist_private.account_admission;')=='1'
 print('Isolated PostgreSQL admission passed: role denial, atomic 60/72 allowance, restart persistence, expiry renewal and backward-clock refusal. No hosted change.')
finally:
 if created:
  r=run(['docker','rm','-f',name]);assert r.returncode==0,r.stderr
 if volume_created:
  r=run(['docker','volume','rm',volume]);assert r.returncode==0,r.stderr
