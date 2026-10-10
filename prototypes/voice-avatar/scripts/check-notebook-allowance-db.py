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
name = 'ai-stylist-notebook-db-' + uuid.uuid4().hex[:12]
checks = 0

def command(args, **kwargs):
    return subprocess.run(args, capture_output=True, text=True, timeout=30, **kwargs)

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
    return sql('set role service_role; select public.stylist_notebook_allowance_change(' + literal(before) + ',' + literal(after) + ');', succeeds)

created = False
try:
    started = command(['docker', 'run', '--detach', '--rm', '--pull=never', '--network', 'none', '--name', name,
                       '--tmpfs', '/var/lib/postgresql/data:rw,size=256m', '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', image])
    if started.returncode:
        raise RuntimeError('The pinned local PostgreSQL image must be available before running checks.')
    created = True
    deadline = time.monotonic() + 20
    while command(['docker', 'exec', name, 'pg_isready', '-U', 'postgres']).returncode:
        if time.monotonic() >= deadline:
            raise RuntimeError('Isolated PostgreSQL did not become ready.')
        time.sleep(.2)
    sql('create role anon; create role authenticated; create role service_role; create table public.stylist_prototype_budget(ledger jsonb); insert into public.stylist_prototype_budget values (\'{"synthetic_legacy":true,"closed_attempts":9}\');')
    migration = Path(__file__).resolve().parents[1] / 'supabase/notebook-allowance-preparation.sql'
    sql(migration.read_text())
    sql('set role service_role; select public.stylist_notebook_allowance_read();', False)
    base = {'version': 1, 'purpose': 'notes-only-simulation', 'approval': {'id': 'synthetic_only', 'attempts': 3, 'centsPerAttempt': 100, 'secondsPerAttempt': 85}, 'runs': []}
    opened = copy.deepcopy(base); opened['runs'].append({'id': 'first', 'closed': False})
    closed = copy.deepcopy(opened); closed['runs'][0]['closed'] = True
    cases = [(base, opened, True), (opened, closed, True), (base, base, False), (opened, base, False), (closed, opened, False)]
    for field in ['id', 'attempts', 'centsPerAttempt', 'secondsPerAttempt']:
        altered = copy.deepcopy(closed)
        altered['approval'][field] = 'changed' if field == 'id' else altered['approval'][field] + 1
        cases.append((opened, altered, False))
    appended_closed = copy.deepcopy(closed); appended_closed['runs'].append({'id': 'second', 'closed': True})
    cases.append((closed, appended_closed, False))
    for bad in [None, {'version': 1, 'runs': []}, {**base, 'extra': 'synthetic'}, {**base, 'purpose': 'spoken'}]:
        cases.append((bad, opened, False))
    duplicate = copy.deepcopy(closed); duplicate['runs'].append({'id': 'first', 'closed': False})
    cases.append((closed, duplicate, False))
    exhausted = copy.deepcopy(base); exhausted['runs'] = [{'id': f'closed_{i}', 'closed': True} for i in range(3)]
    over = copy.deepcopy(exhausted); over['runs'].append({'id': 'fourth', 'closed': False})
    cases.append((exhausted, over, False))
    combined = copy.deepcopy(closed); combined['runs'].append({'id': 'replacement', 'closed': False})
    cases.append((opened, combined, False))
    for before, after, expected in cases:
        actual = sql('select stylist_notebook_private.valid_transition(' + literal(before) + ',' + literal(after) + ');')
        if actual != ('t' if expected else 'f'):
            raise RuntimeError('Transition parity check failed.')
    sql('insert into stylist_notebook_private.allowance(ledger) values (' + literal({**base, 'extra': 'synthetic'}) + ');', False)
    sql('insert into stylist_notebook_private.allowance(ledger) values (' + literal(base) + ');')
    for role in ['anon', 'authenticated']:
        sql('set role ' + role + '; select public.stylist_notebook_allowance_read();', False)
        sql('set role ' + role + '; select public.stylist_notebook_allowance_change(' + literal(base) + ',' + literal(opened) + ');', False)
        sql('set role ' + role + '; select * from stylist_notebook_private.allowance;', False)
    sql('set role service_role; select * from stylist_notebook_private.allowance;', False)
    sql('set role service_role; select stylist_notebook_private.valid_ledger(' + literal(base) + ');', False)
    if json.loads(sql('set role service_role; select public.stylist_notebook_allowance_read();')) != base:
        raise RuntimeError('Server read mismatch.')
    if change(base, opened) != 't': raise RuntimeError('Append failed.')
    change(base, opened, False)  # stale expected snapshot
    if change(opened, closed) != 't': raise RuntimeError('Closure failed.')
    change(closed, closed, False)  # no-op closure/refund is forbidden
    change(closed, opened, False)  # cannot reopen
    sql('update stylist_notebook_private.allowance set ledger = ' + literal(base) + ';')
    other = copy.deepcopy(opened); other['runs'][0]['id'] = 'competing'
    def competing(next_value):
        return command(['docker', 'exec', '-i', name, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atq'], input='set role service_role; select public.stylist_notebook_allowance_change(' + literal(base) + ',' + literal(next_value) + ');').returncode
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(competing, [opened, other]))
    if sum(code == 0 for code in outcomes) != 1:
        raise RuntimeError('Concurrent compare-and-swap allowed multiple owners.')
    checks += 1
    stored = json.loads(sql('set role service_role; select public.stylist_notebook_allowance_read();'))
    if len(stored['runs']) != 1 or stored['runs'][0]['closed']:
        raise RuntimeError('Concurrent reservation history mismatch.')
    if json.loads(sql('select ledger from public.stylist_prototype_budget;')) != {'synthetic_legacy': True, 'closed_attempts': 9}:
        raise RuntimeError('Synthetic legacy sentinel changed.')
    if sql("select bool_and(not prosecdef) from pg_proc where oid in ('public.stylist_notebook_allowance_read()'::regprocedure,'public.stylist_notebook_allowance_change(jsonb,jsonb)'::regprocedure);") != 't':
        raise RuntimeError('Exposed wrappers must use caller privileges.')
    if sql("select relrowsecurity from pg_class where oid='stylist_notebook_private.allowance'::regclass;") != 't':
        raise RuntimeError('Row security missing.')
    rollback = migration.with_name('notebook-allowance-preparation-rollback.sql').read_text()
    sql(rollback, False)  # initialized history must prevent destructive rollback
    if json.loads(sql('select ledger from stylist_notebook_private.allowance;')) != stored:
        raise RuntimeError('Refused rollback changed reservation history.')
    sql('delete from stylist_notebook_private.allowance;')  # isolated synthetic fixture only
    sql(rollback)
    if sql("select to_regnamespace('stylist_notebook_private') is null and to_regprocedure('public.stylist_notebook_allowance_read()') is null and to_regprocedure('public.stylist_notebook_allowance_change(jsonb,jsonb)') is null;") != 't':
        raise RuntimeError('Empty preparation rollback left objects behind.')
    if json.loads(sql('select ledger from public.stylist_prototype_budget;')) != {'synthetic_legacy': True, 'closed_attempts': 9}:
        raise RuntimeError('Rollback changed the synthetic legacy sentinel.')
    sql(migration.read_text())
    sql('set role service_role; select public.stylist_notebook_allowance_read();', False)
    composition = command(['node', str(Path(__file__).with_name('check-notebook-owner-db.ts')), '--local-docker', name])
    if composition.returncode:
        raise RuntimeError('Local TypeScript composition checks failed: ' + composition.stderr[-1500:])
    print(composition.stdout.strip())
    print(f'{checks} isolated PostgreSQL checks passed. No Supabase connection or actual allowance was used.')
finally:
    if created:
        stopped = command(['docker', 'stop', '--time', '3', name])
        if stopped.returncode:
            raise RuntimeError('Local database cleanup requires review.')
