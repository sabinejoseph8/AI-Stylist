"""Local-only SQL permission, transition, concurrency and restore rehearsal."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess, json, uuid, time, argparse
parser=argparse.ArgumentParser();parser.add_argument("--repaired",action="store_true");options=parser.parse_args()
PREFIX="stylist_connection_probe_repaired" if options.repaired else "stylist_connection_probe"
SCHEMA=PREFIX+"_private"
def selected(query):return query.replace("stylist_connection_probe_private",SCHEMA).replace("public.stylist_connection_probe_","public."+PREFIX+"_")
name='stylist-probe-'+uuid.uuid4().hex[:10]
image='postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
def run(args, **kw):return subprocess.run(args,capture_output=True,text=True,timeout=30,**kw)
def raw(query):return run(['docker','exec','-i',name,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],input=query)
def sql(query,success=True):
 r=raw(selected(query))
 assert (r.returncode==0)==success,r.stderr
 return r.stdout.strip()
def literal(value):return "'"+json.dumps(value).replace("'","''")+"'::jsonb"
created=False
try:
 r=run(['docker','run','-d','--rm','--pull=never','--network','none','--name',name,'--tmpfs','/var/lib/postgresql/data:rw,size=256m','-e','POSTGRES_HOST_AUTH_METHOD=trust',image])
 assert r.returncode==0,'Pinned local PostgreSQL must be available.'
 created=True
 for _ in range(100):
  if run(['docker','exec',name,'pg_isready','-h','127.0.0.1','-U','postgres']).returncode==0:break
  time.sleep(.2)
 else:raise RuntimeError('Local SQL startup timeout')
 sql('create role anon;create role authenticated;create role service_role;')
 original=(Path(__file__).resolve().parents[1]/'supabase/cvi-connection-probe-preparation.sql').read_text()
 assert raw(original).returncode==0
 old_ended=None
 if options.repaired:
  old=json.loads(raw('select public.stylist_connection_probe_read();').stdout)
  for reservation in [{'id':'previous','state':'reserved','roomId':None},{'id':'previous','state':'reserved','roomId':'old-room'},{'id':'previous','state':'ended','roomId':'old-room'}]:
   after={**old,'reservation':reservation};assert raw('set role service_role;select public.stylist_connection_probe_change('+literal(old)+','+literal(after)+');').returncode==0;old=after
  old_ended=old
  repaired=Path(__file__).resolve().parents[1]/'supabase/cvi-connection-probe-repaired-preparation.sql'
  assert raw(repaired.read_text()).returncode==0

 initial=json.loads(sql('select public.stylist_connection_probe_read();'))
 checks=1
 for role in ('anon','authenticated','service_role'):
  sql(f'set role {role};select * from stylist_connection_probe_private.allowance;',False);checks+=1
 for role in ('anon','authenticated'):
  sql(f'set role {role};select public.stylist_connection_probe_read();',False);checks+=1
 for field in ('version','purpose','approvalId','additionalCents','maxRooms','maxSeconds'):
  bad={**initial,field:99}
  assert sql(f'select stylist_connection_probe_private.valid_record({literal(bad)});')=='f';checks+=1
 reserved={**initial,'reservation':{'id':'one','state':'reserved','roomId':None}}
 def change(a,b):return 'set role service_role;select public.stylist_connection_probe_change('+literal(a)+','+literal(b)+');'
 with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:raw(selected(change(initial,reserved))),range(2)))
 assert sum(r.returncode==0 for r in results)==1;checks+=1
 sql(change(reserved,initial),False);checks+=1
 ended={**reserved,'reservation':{**reserved['reservation'],'state':'ended','roomId':'room'}}
 sql(change(reserved,ended),False);checks+=1
 attached={**reserved,'reservation':{**reserved['reservation'],'roomId':'room'}}
 assert sql(change(reserved,attached))=='t';checks+=1
 sql(change(attached,{**attached,'reservation':{**attached['reservation'],'roomId':'replacement'}}),False);checks+=1
 assert sql(change(attached,ended))=='t';checks+=1
 sql(change(ended,reserved),False);checks+=1
 sql('set role service_role;delete from stylist_connection_probe_private.allowance;',False);checks+=1
 # Dump and restore into a second local database, preserving consumed allowance.
 dump=run(['docker','exec',name,'pg_dump','-U','postgres','--no-owner','--no-acl'])
 assert dump.returncode==0
 sql('create database restored;')
 restored=run(['docker','exec','-i',name,'psql','-U','postgres','-d','restored','-Atq','-v','ON_ERROR_STOP=1'],input=dump.stdout)
 assert restored.returncode==0,restored.stderr
 result=run(['docker','exec','-i',name,'psql','-U','postgres','-d','restored','-Atq','-v','ON_ERROR_STOP=1'],input=selected('select public.stylist_connection_probe_read();'))
 assert json.loads(result.stdout)==ended;checks+=1
 if options.repaired:
  assert json.loads(raw('select public.stylist_connection_probe_read();').stdout)==old_ended;checks+=1
  restored_old=run(['docker','exec','-i',name,'psql','-U','postgres','-d','restored','-Atq','-v','ON_ERROR_STOP=1'],input='select public.stylist_connection_probe_read();')
  assert json.loads(restored_old.stdout)==old_ended;checks+=1

 print(f'{checks} local PostgreSQL probe checks passed; consumed record survives dump/restore. No hosted change.')
finally:
 if created:
  r=run(['docker','rm','-f',name]);assert r.returncode==0,'Local container cleanup requires review'
