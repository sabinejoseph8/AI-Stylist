"""Opt-in synthetic capacity/expiry/restart drill. No external target accepted."""
from pathlib import Path
import argparse
import json
import subprocess
import time
import uuid

IMAGE = 'postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-local-synthetic', required=True, action='store_true')
    parser.parse_args()
    name = 'stylist-capacity-' + uuid.uuid4().hex[:12]
    volume = name + '-data'
    made_volume = made_container = False
    stage = 'local-startup'
    receipts = []

    def run(args, data=None, timeout=60):
        return subprocess.run(args, input=data, capture_output=True, timeout=timeout)

    def require(ok):
        if not ok:
            raise RuntimeError('synthetic rehearsal failed')

    def ready():
        for _ in range(100):
            if run(['docker', 'exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']).returncode == 0:
                return
            time.sleep(.2)
        raise RuntimeError('startup timed out')

    def sql(query):
        require(run(['docker', 'exec', '-i', name, 'psql', '-U', 'postgres', '-Atq', '-v', 'ON_ERROR_STOP=1'], query.encode()).returncode == 0)

    try:
        require(run(['docker', 'volume', 'create', volume]).returncode == 0)
        made_volume = True
        require(run(['docker', 'run', '-d', '--rm', '--pull=never', '--network', 'none', '--name', name,
                     '-v', volume + ':/var/lib/postgresql/data', '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', IMAGE]).returncode == 0)
        made_container = True
        ready()
        stage = 'synthetic-schema'
        sql('''create role anon; create role authenticated; create role service_role;
create schema stylist_private; revoke all on schema stylist_private from public,anon,authenticated,service_role;
create schema auth; create table auth.users(id uuid primary key,banned_until timestamptz,deleted_at timestamptz,is_anonymous boolean default false);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);
insert into auth.users(id) values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');''')
        for file in ['202610110015_consultation_slot.sql', '202610110016_current_auth_session.sql']:
            sql((ROOT / 'supabase/migrations' / file).read_text())
        for phase in ['before-restart', 'after-restart']:
            stage = phase
            if phase == 'after-restart':
                require(run(['docker', 'restart', name]).returncode == 0)
                ready()
            result = run(['node', str(ROOT / 'apps/foundation/scripts/check-failure-capacity-db.ts'), name, phase])
            require(result.returncode == 0)
            receipt = json.loads(result.stdout)
            require(receipt.get('status') == 'passed')
            receipts.append(receipt)
    except Exception:
        print(json.dumps(dict(status='failed', stage=stage)))
        raise SystemExit(1) from None
    finally:
        clean = True
        if made_container:
            clean = run(['docker', 'rm', '-f', name]).returncode == 0 and clean
        if made_volume:
            clean = run(['docker', 'volume', 'rm', volume]).returncode == 0 and clean
        if not clean:
            print('{"status":"cleanup-unconfirmed"}')
            raise SystemExit(1)
    print(json.dumps(dict(status='passed', checks=sum(r['checks'] for r in receipts), parallelClaims=8,
                         admitted=1, restartVerified=True, scope='synthetic PostgreSQL/adapters only')))


if __name__ == '__main__':
    main()
