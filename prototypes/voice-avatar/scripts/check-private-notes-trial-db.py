#!/usr/bin/env python3
"""Isolated PostgreSQL checks for the unapplied private notes trial contract."""
import argparse, concurrent.futures, copy, json, subprocess, time, uuid
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--local-docker',action='store_true',required=True);p.parse_args()
name='stylist-private-notes-'+uuid.uuid4().hex[:12]
image='postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
checks=0;created=False

def run(args,**kw):return subprocess.run(args,capture_output=True,text=True,timeout=30,**kw)
def sql(query,success=True):
 global checks
 r=run(['docker','exec','-i',name,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-Atq'],input=query)
 if (r.returncode==0)!=success:raise RuntimeError('Local SQL check failed: '+r.stderr[-1200:])
 checks+=1;return r.stdout.strip()
def literal(v):return "'"+json.dumps(v,separators=(',',':')).replace("'","''")+"'::jsonb"
def change(a,b,success=True):return sql('set role service_role;select public.stylist_private_notes_trial_change('+literal(a)+','+literal(b)+');',success)
try:
 r=run(['docker','run','--detach','--rm','--pull=never','--network','none','--name',name,'--tmpfs','/var/lib/postgresql/data:rw,size=256m','-e','POSTGRES_HOST_AUTH_METHOD=trust',image])
 if r.returncode:raise RuntimeError('Pinned local PostgreSQL image/runtime unavailable.')
 created=True;deadline=time.monotonic()+20
 while run(['docker','exec',name,'pg_isready','-h','127.0.0.1','-U','postgres']).returncode:
  if time.monotonic()>deadline:raise RuntimeError('Local database startup timed out.')
  time.sleep(.2)
 sql('create role anon;create role authenticated;create role service_role;create table public.avatar_sentinel(value integer);insert into public.avatar_sentinel values(17);')
 migration=Path(__file__).resolve().parents[1]/'supabase/private-notes-trial-preparation.sql';sql(migration.read_text())
 sql('set role service_role;select public.stylist_private_notes_trial_read();',False)
 base={'version':1,'purpose':'notes-only-private-trial','approval':{'id':'synthetic_not_approval','cents':200,'maxSeconds':85,'maxTurns':2,'maxExtractions':64,'maxInputTokens':1000000,'maxOutputTokens':2048},'reservation':None}
 opened={**base,'reservation':{'id':'one','state':'reserved'}};closed={**base,'reservation':{'id':'one','state':'transport-closed'}};held={**base,'reservation':{'id':'one','state':'held'}}
 cases=[(base,opened,True),(opened,closed,True),(opened,held,True),(base,base,False),(opened,base,False),(closed,opened,False),(closed,held,False),(base,closed,False)]
 for k in base['approval']:
  altered=copy.deepcopy(closed);altered['approval'][k]='other' if k=='id' else altered['approval'][k]+1;cases.append((opened,altered,False))
 for bad in [None,{**base,'purpose':'notes-only-simulation'},{**base,'extra':'content'},{**opened,'reservation':{'id':'one','state':['held']}}]:cases.append((bad,opened,False))
 for a,b,expected in cases:
  result=sql('select stylist_notes_trial_private.valid_transition('+literal(a)+','+literal(b)+');')
  if result!=('t' if expected else 'f'):raise RuntimeError('Transition parity failure.')
 for bad in [None,{**base,'extra':'content'},{**opened,'reservation':{'id':'one','state':None}}]:sql('insert into stylist_notes_trial_private.allowance(ledger)values('+literal(bad)+');',False)
 sql('insert into stylist_notes_trial_private.allowance(ledger)values('+literal(base)+');')
 for role in ['anon','authenticated']:
  sql('set role '+role+';select public.stylist_private_notes_trial_read();',False)
  sql('set role '+role+';select public.stylist_private_notes_trial_change('+literal(base)+','+literal(opened)+');',False)
 for role in ['anon','authenticated','service_role']:sql('set role '+role+';select * from stylist_notes_trial_private.allowance;',False)
 if change(base,opened)!='t':raise RuntimeError('Reservation failed.')
 change(base,opened,False);change(opened,closed);change(closed,base,False)
 # New connections observe consumed usage; transport closure cannot refund it.
 if json.loads(sql('set role service_role;select public.stylist_private_notes_trial_read();'))!=closed:raise RuntimeError('Restart/read evidence mismatch.')
 sql('update stylist_notes_trial_private.allowance set ledger='+literal(base)+';') # synthetic fixture reset only
 other={**base,'reservation':{'id':'two','state':'reserved'}}
 def compete(v):return run(['docker','exec','-i',name,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-Atq'],input='set role service_role;select public.stylist_private_notes_trial_change('+literal(base)+','+literal(v)+');').returncode
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:outcomes=list(pool.map(compete,[opened,other]))
 if sum(x==0 for x in outcomes)!=1:raise RuntimeError('Multiple CAS winners.')
 checks+=1
 if sql("select relrowsecurity from pg_class where oid='stylist_notes_trial_private.allowance'::regclass;")!='t':raise RuntimeError('Missing RLS.')
 rollback=migration.with_name('private-notes-trial-preparation-rollback.sql').read_text();sql(rollback,False)
 if sql('select value from public.avatar_sentinel;')!='17':raise RuntimeError('Avatar sentinel changed.')
 sql('delete from stylist_notes_trial_private.allowance;');sql(rollback)
 if sql("select to_regnamespace('stylist_notes_trial_private') is null;")!='t':raise RuntimeError('Rollback incomplete.')
 print(f'{checks} isolated PostgreSQL checks passed. No hosted connection or actual approval used.')
finally:
 if created and run(['docker','stop','--time','3',name]).returncode:raise RuntimeError('Local database cleanup requires review.')
