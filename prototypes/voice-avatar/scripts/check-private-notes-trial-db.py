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
 initializer=(migration.parent/'private-notes-trial-approval.sql').read_text();sql(initializer,False)
 if sql('select count(*) from stylist_notes_trial_private.allowance;')!='0':raise RuntimeError('Default initializer must not create approval.')
 approved_fixture=initializer.replace('approved_id text := NULL',"approved_id text := 'synthetic_not_approval'")
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
 sql(approved_fixture);sql(approved_fixture,False)
 if json.loads(sql('set role service_role;select public.stylist_private_notes_trial_read();'))!=base:raise RuntimeError('Initializer must preserve exact fixture and refuse replay.')
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
 composition=run(['node',str(Path(__file__).with_name('check-private-notes-owner-db.ts')),'--local-docker',name])
 if composition.returncode:raise RuntimeError('SQL-backed owner check failed: '+composition.stderr[-1200:])
 print(composition.stdout.strip())
 # Separately approved rows never replace the original singleton or one another.
 original=json.loads(sql('set role service_role;select public.stylist_private_notes_trial_read();'))
 sql((migration.parent/'private-notes-approved-trials-preparation.sql').read_text())
 next_initializer=(migration.parent/'private-notes-approved-trial-approval.sql').read_text()
 sql(next_initializer,False)
 sql(next_initializer.replace('approved_id text := NULL',"approved_id text := '"+original['approval']['id']+"'"),False)
 next_base=copy.deepcopy(base);next_base['approval']['id']='synthetic_followup'
 sql(next_initializer.replace('approved_id text := NULL',"approved_id text := 'synthetic_followup'"))
 sql(next_initializer.replace('approved_id text := NULL',"approved_id text := 'synthetic_followup'"),False)
 for role in ['anon','authenticated']:
  sql("set role "+role+";select public.stylist_private_notes_trial_read_approved('synthetic_followup');",False)
  sql("set role "+role+";select public.stylist_private_notes_trial_change_approved('synthetic_followup',null,null);",False)
 for role in ['anon','authenticated','service_role']:
  sql('set role '+role+';select * from stylist_notes_trial_private.approved_trials;',False)
 if json.loads(sql("set role service_role;select public.stylist_private_notes_trial_read_approved('synthetic_followup');"))!=next_base:raise RuntimeError('Approved record mismatch')
 next_open={**next_base,'reservation':{'id':'new_run','state':'reserved'}}
 def next_change(before,after,success=True):return sql("set role service_role;select public.stylist_private_notes_trial_change_approved('synthetic_followup',"+literal(before)+','+literal(after)+');',success)
 next_change(next_base,next_open);next_change(next_base,next_open,False)
 next_held={**next_open,'reservation':{'id':'new_run','state':'held'}}
 next_change(next_open,next_held);next_change(next_held,next_base,False)
 sql("set role service_role;select public.stylist_private_notes_trial_read_approved('missing');",False)
 if json.loads(sql("set role service_role;select public.stylist_private_notes_trial_read_approved('synthetic_followup');"))!=next_held:raise RuntimeError('Consumed approved record not preserved')
 sql(next_initializer.replace('approved_id text := NULL',"approved_id text := 'synthetic_concurrent'"))
 concurrent_base=copy.deepcopy(base);concurrent_base['approval']['id']='synthetic_concurrent'
 def approved_compete(run_id):
  replacement={**concurrent_base,'reservation':{'id':run_id,'state':'reserved'}}
  return run(['docker','exec','-i',name,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-Atq'],input="set role service_role;select public.stylist_private_notes_trial_change_approved('synthetic_concurrent',"+literal(concurrent_base)+','+literal(replacement)+');').returncode
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:approved_outcomes=list(pool.map(approved_compete,['candidate_one','candidate_two']))
 if sum(x==0 for x in approved_outcomes)!=1:raise RuntimeError('Multiple approved CAS winners')
 checks+=1
 if json.loads(sql('set role service_role;select public.stylist_private_notes_trial_read();'))!=original:raise RuntimeError('Original allowance changed')
 if sql("select relrowsecurity from pg_class where oid='stylist_notes_trial_private.approved_trials'::regclass;")!='t':raise RuntimeError('Missing approved-record RLS')
 next_rollback=(migration.parent/'private-notes-approved-trials-rollback.sql').read_text()
 sql(next_rollback,False)
 sql('delete from stylist_notes_trial_private.approved_trials;') # disposable local fixtures only
 sql(next_rollback)
 rollback=migration.with_name('private-notes-trial-preparation-rollback.sql').read_text();sql(rollback,False)
 if sql('select value from public.avatar_sentinel;')!='17':raise RuntimeError('Avatar sentinel changed.')
 sql('delete from stylist_notes_trial_private.allowance;');sql(rollback)
 if sql("select to_regnamespace('stylist_notes_trial_private') is null;")!='t':raise RuntimeError('Rollback incomplete.')
 print(f'{checks} isolated PostgreSQL checks passed. No hosted connection or actual approval used.')
finally:
 if created and run(['docker','stop','--time','3',name]).returncode:raise RuntimeError('Local database cleanup requires review.')
