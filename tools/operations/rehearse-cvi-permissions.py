"""Opt-in LOCAL permission scaffold check; no hosted URL, pull or real credential."""
import argparse
import json
from pathlib import Path
import stat
import subprocess
import time
import uuid

ROOT=Path(__file__).resolve().parents[2]
IMAGE='postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'


def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--run-local-synthetic',action='store_true',required=True);parser.parse_args()
    socket=Path.home()/'.docker/run/docker.sock';binary=Path.home()/'.docker/bin/docker'
    if not stat.S_ISSOCK(socket.stat().st_mode):raise RuntimeError('local Docker unavailable')
    docker=[str(binary),'--host','unix://'+str(socket)]
    name='stylist-cvi-permissions-'+uuid.uuid4().hex[:12];created=False;checks=0;stage='startup'
    def run(args,data=None):return subprocess.run(docker+args,input=data,text=True,capture_output=True,timeout=30)
    def require(ok):
        if not ok:raise RuntimeError('local permission rehearsal held')
    def sql(query):return run(['exec','-i',name,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose'],query)
    try:
        require(run(['image','inspect',IMAGE]).returncode==0)
        r=run(['run','-d','--rm','--pull=never','--network','none','--memory','512m','--cpus','1','--name',name,
               '--tmpfs','/var/lib/postgresql/data:rw,size=256m,uid=999,gid=999','-e','POSTGRES_HOST_AUTH_METHOD=trust',IMAGE]);require(r.returncode==0);created=True
        for _ in range(100):
            if run(['exec',name,'pg_isready','-h','127.0.0.1','-U','postgres']).returncode==0:break
            time.sleep(.1)
        else:raise RuntimeError('local startup held')
        stage='schema-roles';require(sql('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;').returncode==0)
        stage='schema-proposal';setup=sql((ROOT/'tools/operations/sql/cvi-history-permissions-proposal.sql').read_text())
        if setup.returncode!=0:print(json.dumps({'fixtureSchemaError':setup.stderr[-600:]}))
        require(setup.returncode==0)
        cases=[
            ('heads','SELECT * FROM cvi_history_proposal.heads',{'cvi_history_observer','cvi_history_writer','cvi_history_rotator'},None),
            ('receipts-view','SELECT * FROM cvi_history_proposal.committed_receipts',{'cvi_history_ack_signer'},None),
            ('raw-history','SELECT * FROM cvi_history_proposal.history',set(),None),
            ('raw-receipts','SELECT * FROM cvi_history_proposal.receipts',set(),None),
            ('insert-history',"INSERT INTO cvi_history_proposal.history VALUES('00000000-0000-4000-8000-000000000001',0,repeat('a',64),'{}')",set(),None),
            ('update-history','UPDATE cvi_history_proposal.history SET epoch=0',set(),None),
            ('delete-history','DELETE FROM cvi_history_proposal.history',set(),None),
            ('truncate-history','TRUNCATE cvi_history_proposal.history',set(),None),
            ('insert-receipt',"INSERT INTO cvi_history_proposal.receipts VALUES('00000000-0000-4000-8000-000000000001','committed','{}')",set(),None),
            ('delete-receipt','DELETE FROM cvi_history_proposal.receipts',set(),None),
            ('upgrade-role','GRANT cvi_history_owner TO cvi_history_writer',set(),None),
            ('disable-rls','ALTER TABLE cvi_history_proposal.history DISABLE ROW LEVEL SECURITY',set(),None),
            ('reserve',"SELECT cvi_history_proposal.reserve('{}')",{'cvi_history_writer'},'55000'),
            ('consume',"SELECT cvi_history_proposal.consume('{}')",{'cvi_history_writer'},'55000'),
            ('rotate',"SELECT cvi_history_proposal.rotate('{}')",{'cvi_history_rotator'},'55000'),
        ]
        for role in ['anon','authenticated','service_role','cvi_history_observer','cvi_history_writer','cvi_history_rotator','cvi_history_ack_signer']:
            for label,query,allowed,disabled in cases:
                stage=role+'-'+label;r=sql('SET ROLE '+role+'; SET search_path=pg_temp,public; '+query+';')
                if role in allowed and disabled is None:require(r.returncode==0)
                else:require(r.returncode!=0 and (disabled if role in allowed else '42501') in r.stderr)
                checks+=1
        metadata=[
            "SELECT count(*)=5 AND bool_and(NOT rolcanlogin AND NOT rolsuper AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolbypassrls AND NOT rolreplication) FROM pg_roles WHERE rolname LIKE 'cvi_history_%'",
            "SELECT count(*)=2 AND bool_and(relrowsecurity AND relforcerowsecurity) FROM pg_class WHERE relnamespace='cvi_history_proposal'::regnamespace AND relkind='r'",
            "SELECT count(*)=3 AND bool_and(prosecdef AND proowner='cvi_history_owner'::regrole AND EXISTS(SELECT 1 FROM unnest(proconfig) p WHERE p ~ '^search_path=pg_catalog, ?cvi_history_proposal$')) FROM pg_proc WHERE pronamespace='cvi_history_proposal'::regnamespace",
            "SELECT count(*)=0 FROM pg_auth_members WHERE member IN (SELECT oid FROM pg_roles WHERE rolname LIKE 'cvi_history_%')",
            "SELECT count(*)=0 FROM cvi_history_proposal.history",
            "SELECT count(*)=0 FROM cvi_history_proposal.receipts",
        ]
        for query in metadata:
            stage='metadata';r=sql(query);require(r.returncode==0 and r.stdout.strip()=='t');checks+=1
        print(json.dumps({'status':'passed','checks':checks,'mutations':'disabled','hostedChanges':False}))
    except Exception:
        print(json.dumps({'status':'held','stage':stage,'checks':checks}));raise SystemExit(1)
    finally:
        if created:run(['rm','-f',name])

if __name__=='__main__':main()
