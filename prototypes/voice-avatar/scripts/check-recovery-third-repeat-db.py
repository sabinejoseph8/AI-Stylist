#!/usr/bin/env python3
"""Explicit isolated local database checks. No Supabase URL, key or network."""
import argparse
import concurrent.futures
import copy
import json
from pathlib import Path
import subprocess
import time
import uuid

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--local-docker', action='store_true', required=True)
parser.parse_args()
image = 'postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
name = 'ai-stylist-recovery-db-' + uuid.uuid4().hex[:12]
checks = 0

def command(args, **kwargs):
    return subprocess.run(args, capture_output=True, text=True, timeout=kwargs.pop('timeout', 30), **kwargs)

def sql(query, succeeds=True):
    global checks
    result = command(['docker', 'exec', '-i', name, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atq'], input=query)
    if (result.returncode == 0) != succeeds:
        raise RuntimeError('Local SQL check failed: ' + result.stderr[-1500:])
    checks += 1
    return result.stdout.strip()

def literal(value):
    return "'" + json.dumps(value, separators=(',', ':')).replace("'", "''") + "'::jsonb"

def change(before, after, succeeds=True):
    return sql('set role service_role; select public.stylist_prototype_budget_change(' + literal(before) + ',' + literal(after) + ');', succeeds)

created=False
try:
    started=command(['docker','run','--detach','--rm','--pull=never','--network','none','--name',name,'--tmpfs','/var/lib/postgresql/data:rw,size=256m','-e','POSTGRES_HOST_AUTH_METHOD=trust',image])
    if started.returncode: raise RuntimeError('Pinned local PostgreSQL image unavailable')
    created=True
    deadline=time.monotonic()+20
    while command(['docker','exec',name,'pg_isready','-h','127.0.0.1','-U','postgres']).returncode:
        if time.monotonic()>deadline: raise RuntimeError('Database startup failed')
        time.sleep(.2)
    sql('create role anon; create role authenticated; create role service_role;')
    root=Path(__file__).resolve().parents[1]
    sql((root/'supabase/prototype-budget.sql').read_text())
    base={'version':1,'repeatTrial':{'approvedOn':'2026-10-09','baseAttempts':8,'extraAttempts':1,'cents':200,'seconds':300,'source':'reserve','purpose':'automatic-capture-repeat','totalBudgetCents':2500},'runs':[{'id':str(uuid.uuid4()),'cents':200,'seconds':300,'closed':True} for _ in range(9)]}
    sql('alter table public.stylist_prototype_budget drop constraint stylist_prototype_budget_ledger_check; insert into public.stylist_prototype_budget(singleton,ledger) values(true,'+literal(base)+'); alter table public.stylist_prototype_budget add constraint stylist_prototype_budget_ledger_check check(true);')
    base['recoveryTrial']={'approvedOn':'2026-10-12','baseAttempts':9,'extraAttempts':2,'cents':400,'seconds':600,'purpose':'replacement-room-resume','totalBudgetCents':2900}
    base['runs'] += [{'id':str(uuid.uuid4()),'cents':200,'seconds':300,'closed':True,'kind':'recovery','started':True,'room':'ended-initial'},{'id':str(uuid.uuid4()),'cents':200,'seconds':300,'closed':False,'kind':'recovery','started':False}]
    sql('update public.stylist_prototype_budget set ledger='+literal(base)+';')
    sql((root/'supabase/prototype-recovery-repeat.sql').read_text())
    base=json.loads(sql('select ledger from public.stylist_prototype_budget;'))
    base['runs'] += [{'id':str(uuid.uuid4()),'cents':200,'seconds':300,'closed':True,'kind':'recovery','started':True,'room':'ended-repeat'},{'id':str(uuid.uuid4()),'cents':200,'seconds':300,'closed':False,'kind':'recovery','started':False}]
    sql('update public.stylist_prototype_budget set ledger='+literal(base)+';')
    sql((root/'supabase/prototype-recovery-second-repeat.sql').read_text())
    base=json.loads(sql('select ledger from public.stylist_prototype_budget;'))
    base['runs'] += [{'id':str(uuid.uuid4()),'cents':200,'seconds':300,'closed':True,'kind':'recovery','started':True,'room':'ended-second-repeat'},{'id':str(uuid.uuid4()),'cents':200,'seconds':300,'closed':False,'kind':'recovery','started':False}]
    sql('update public.stylist_prototype_budget set ledger='+literal(base)+';')
    migration=(root/'supabase/prototype-recovery-third-repeat.sql').read_text()
    sql(migration)
    approved=json.loads(sql('select ledger from public.stylist_prototype_budget;'))
    assert approved['runs']==base['runs']
    sql(migration,False)
    for role in ['anon','authenticated']:
        sql('set role '+role+'; select public.stylist_prototype_budget_read();',False)
        sql('set role '+role+'; select public.stylist_prototype_budget_change('+literal(approved)+','+literal(approved)+');',False)
    pair=copy.deepcopy(approved)
    pair['runs'] += [{'id':str(uuid.uuid4()),'cents':200,'seconds':300,'closed':False,'kind':'recovery','started':False} for _ in range(2)]
    partial=copy.deepcopy(pair);partial['runs'].pop();change(approved,partial,False)
    change(approved,pair)
    change(approved,pair,False)
    for mutation in ['history','amount','third','duplicate','premature','unclaimed']:
        bad=copy.deepcopy(pair)
        if mutation=='history': bad['runs'][0]['closed']=False
        if mutation=='amount': bad['runs'][15]['cents']=201
        if mutation=='third': bad['runs'].append(copy.deepcopy(bad['runs'][15]))
        if mutation=='duplicate': bad['runs'][16]['id']=bad['runs'][15]['id']
        if mutation=='premature': bad['runs'][16]['started']=True
        if mutation=='unclaimed': bad['runs'][15]['room']='invalid'
        change(pair,bad,False)
    current=copy.deepcopy(pair);current['runs'][15]['started']=True;change(pair,current)
    assigned=copy.deepcopy(current);assigned['runs'][15]['room']='initial';change(current,assigned)
    closed=copy.deepcopy(assigned);closed['runs'][15]['closed']=True;change(assigned,closed)
    replacement=copy.deepcopy(closed);replacement['runs'][16]['started']=True;change(closed,replacement)
    reopened=copy.deepcopy(replacement);reopened['runs'][15]['closed']=False;change(replacement,reopened,False)
    undone=copy.deepcopy(replacement);undone['runs'][16]['started']=False;change(replacement,undone,False)
    print(str(checks)+' isolated SQL checks passed; no hosted changes or provider calls.')
finally:
    if created: command(['docker','rm','--force',name])
