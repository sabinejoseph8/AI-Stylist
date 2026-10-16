"""Opt-in disposable PostgreSQL permission/transaction contract. Offline only."""
import argparse
import json
import os
from pathlib import Path
import selectors
import stat
import subprocess
import time
import uuid
from local_cvi_database_adapter import DatabaseTransactionAdapter,DatabaseHeld

ROOT=Path(__file__).resolve().parents[2]
IMAGE='postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
ROLES=['writer','rotator','fencer','signer','observer','verifier']

def literal(x):return "'"+str(x).replace("'","''")+"'"
def state(x):return literal(json.dumps(x,separators=(',',':')))+'::jsonb'

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--run-local-synthetic',action='store_true',required=True);parser.parse_args()
    socket=Path.home()/'.docker/run/docker.sock';binary=Path.home()/'.docker/bin/docker'
    if not stat.S_ISSOCK(socket.stat().st_mode):raise RuntimeError('local Docker unavailable')
    docker=[str(binary),'--host','unix://'+str(socket)]
    name='stylist-cvi-transactions-'+uuid.uuid4().hex[:12];created=False;checks=0;stage='startup';sessions=[]
    def run(args,data=None):return subprocess.run(docker+args,input=data,text=True,capture_output=True,timeout=30)
    def require(ok):
        nonlocal checks
        if not ok:raise RuntimeError('local transaction rehearsal held')
        checks+=1
    def sql(query,principal='postgres'):
        return run(['exec','-i',name,'psql','-U',principal,'-d','postgres','-Atq','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose'],query)
    def good(query,principal='postgres'):
        r=sql(query,principal)
        if r.returncode:print(json.dumps({'fixtureError':r.stderr[-500:]}))
        require(r.returncode==0);return r.stdout.strip()
    def denied(query,principal,code='42501'):
        r=sql(query,principal);require(r.returncode!=0 and code in r.stderr)
    class Session:
        def __init__(self,principal):
            self.principal=principal
            self.p=subprocess.Popen(docker+['exec','-i',name,'psql','-U',principal,'-d','postgres','-Atq','-v','ON_ERROR_STOP=1'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,bufsize=1)
            self.buffer='';self.sel=selectors.DefaultSelector();self.sel.register(self.p.stdout,selectors.EVENT_READ);sessions.append(self)
            self.query("BEGIN; SET LOCAL lock_timeout='150ms'; SET LOCAL statement_timeout='2s';")
            self.xid=self.query('SELECT pg_current_xact_id()::text;').splitlines()[-1]
        def query(self,q):
            marker='marker_'+uuid.uuid4().hex
            self.p.stdin.write(q+'\n\\echo '+marker+'\n');self.p.stdin.flush();out=[];limit=time.monotonic()+5
            while time.monotonic()<limit:
                while '\n' in self.buffer:
                    line,self.buffer=self.buffer.split('\n',1)
                    if line.strip()==marker:return '\n'.join(out)
                    out.append(line.strip())
                if not self.sel.select(.1):continue
                chunk=os.read(self.p.stdout.fileno(),65536)
                if not chunk:raise DatabaseHeld('local fixture held')
                self.buffer+=chunk.decode()
            raise DatabaseHeld('local fixture held')
        def identity(self):return dict(principal=self.principal,transactionId=self.xid)
        def execute_admitted(self,op,claim):
            result=json.loads(self.query('SELECT cvi_tx_fixture.execute_admitted('+literal(str(uuid.UUID(op)))+','+literal(claim)+');'))
            result['operationId']=uuid.UUID(result['operationId']).hex
            return result
        def commit(self):self.query('COMMIT;')
        def rollback(self):self.query('ROLLBACK;')
        def close(self):
            self.p.stdin.close()
            if self.p.poll() is None:
                try:self.p.stdin.close();self.p.wait(timeout=3)
                except Exception:self.p.kill();self.p.wait(timeout=3)
            self.sel.close();self.p.stdout.close()
    initial=dict(generation=0,fenced=True,owner='0'*64,boot='0'*64,head='a'*64)
    class Verifier:
        # This rehearsal simulates verified authority evidence. No cryptographic
        # or production bridge is claimed. Existing signed-authority tests stand separately.
        def admit(self,b):
            p=b['intent'];connection=b['connection'];claim=uuid.uuid4().hex*2
            record='NULL' if p['recordHash'] is None else literal(p['recordHash'])
            good('SELECT cvi_tx_fixture.admit('+','.join([literal(str(uuid.UUID(p['operationId']))),literal(claim),literal(connection['principal']),literal(p['kind']),literal(connection['transactionId'])+'::xid8',state(p['previous']),state(p['target']),record,"clock_timestamp()+interval '7 seconds'"])+');','fixture_verifier')
            return dict(binding=b,claimHash=claim)
        def confirm(self,*args):return True
    def command(kind,previous,target,record=None):return dict(operationId=uuid.uuid4().hex,kind=kind,previous=previous,target=target,recordHash=record,expiresAt=8000)
    def current():return json.loads(good('SELECT payload FROM cvi_tx_fixture.state;'))
    def execute(p,principal):
        port=type('Port',(),{'begin':lambda _:Session(principal)})()
        return DatabaseTransactionAdapter(principal,p['kind'],port,Verifier(),lambda:1000).execute(p)
    try:
        require(run(['image','inspect',IMAGE]).returncode==0)
        require(run(['run','-d','--rm','--pull=never','--network','none','--memory','512m','--cpus','1','--name',name,'--tmpfs','/var/lib/postgresql/data:rw,size=256m,uid=999,gid=999','-e','POSTGRES_HOST_AUTH_METHOD=trust',IMAGE]).returncode==0);created=True
        for _ in range(100):
            if run(['exec',name,'pg_isready','-h','127.0.0.1','-U','postgres']).returncode==0:break
            time.sleep(.1)
        else:raise RuntimeError('local startup held')
        stage='schema';good((ROOT/'tools/operations/sql/cvi-transaction-contract.sql').read_text())
        for role in ROLES:
            good('CREATE ROLE fixture_'+role+' LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION; GRANT cvi_tx_'+role+' TO fixture_'+role+';')
        good('CREATE ROLE anon LOGIN; CREATE ROLE authenticated LOGIN; CREATE ROLE service_role LOGIN;')
        good('INSERT INTO cvi_tx_fixture.state VALUES(true,'+state(initial)+');')
        stage='permission-matrix'
        actors=['anon','authenticated','service_role']+['fixture_'+r for r in ROLES]
        for actor in actors:
            # NOINHERIT logins need explicit group role. Session_user stays the
            # authenticated identity used by SECURITY DEFINER functions.
            prefix='SET ROLE cvi_tx_'+actor.removeprefix('fixture_')+'; ' if actor.startswith('fixture_') else ''
            for table in ['state','admissions','executions','releases']:
                for q in ['SELECT * FROM ','DELETE FROM ','TRUNCATE ']:denied(prefix+q+'cvi_tx_fixture.'+table+';',actor)
                denied(prefix+'INSERT INTO cvi_tx_fixture.'+table+' DEFAULT VALUES;',actor)
                update={'state':"payload='{}'::jsonb",'admissions':'consumed=false','executions':'transaction_id=pg_current_xact_id()','releases':"record_hash=repeat('f',64)"}[table]
                denied(prefix+'UPDATE cvi_tx_fixture.'+table+' SET '+update+';',actor)
            denied(prefix+'GRANT cvi_tx_owner TO '+actor+';',actor)
            denied(prefix+'ALTER TABLE cvi_tx_fixture.state DISABLE ROW LEVEL SECURITY;',actor)
            denied(prefix+'CREATE TABLE cvi_tx_fixture.bypass(id int);',actor)
            denied(prefix+'SET ROLE cvi_tx_owner;',actor)
        # Sessions explicitly assume their one granted role, without changing session_user.
        original=Session.__init__
        def initialize(self,principal):
            original(self,principal);self.query('SET LOCAL ROLE cvi_tx_'+principal.removeprefix('fixture_')+';')
        Session.__init__=initialize
        original_good=good
        def good(query,principal='postgres'):
            if principal.startswith('fixture_'):query='SET ROLE cvi_tx_'+principal.removeprefix('fixture_')+'; '+query
            return original_good(query,principal)
        stage='full-sequence'
        active={**initial,'generation':1,'fenced':False,'owner':'1'*64,'boot':'2'*64}
        execute(command('activate',initial,active),'fixture_rotator');require(current()==active)
        changed={**active,'head':'b'*64};execute(command('apply',active,changed),'fixture_writer');require(current()==changed)
        fenced={**changed,'fenced':True};execute(command('fence',changed,fenced),'fixture_fencer');require(current()==fenced)
        execute(command('release',fenced,fenced,'c'*64),'fixture_signer');require(good('SELECT count(*) FROM cvi_tx_fixture.releases;')=='1')
        stage='rollback-and-retry'
        next_state={**fenced,'generation':2,'fenced':False,'boot':'3'*64}
        p=command('activate',fenced,next_state);s=Session('fixture_rotator');grant=Verifier().admit(dict(intent=p,connection=s.identity()))
        s.execute_admitted(p['operationId'],grant['claimHash']);s.rollback();s.close();require(current()==fenced)
        retry=Session('fixture_rotator')
        try:retry.execute_admitted(p['operationId'],grant['claimHash']);raise RuntimeError('unexpected replay')
        except DatabaseHeld:checks+=1
        finally:retry.close()
        require(good('SELECT consumed FROM cvi_tx_fixture.admissions WHERE operation_id='+literal(str(uuid.UUID(p['operationId'])))+';')=='f')
        stage='wrong-owner'
        p=command('activate',fenced,next_state);s=Session('fixture_rotator');grant=Verifier().admit(dict(intent=p,connection=s.identity()));other=Session('fixture_writer')
        try:other.execute_admitted(p['operationId'],grant['claimHash']);raise RuntimeError('unexpected owner')
        except DatabaseHeld:checks+=1
        finally:other.close();s.rollback();s.close()
        stage='duplicate-release'
        try:execute(command('release',fenced,fenced,'c'*64),'fixture_signer');raise RuntimeError('unexpected release')
        except DatabaseHeld:checks+=1
        require(good('SELECT count(*) FROM cvi_tx_fixture.releases;')=='1')
        stage='function-grants'
        admission_sql="SELECT cvi_tx_fixture.admit('"+str(uuid.uuid4())+"',repeat('d',64),'fixture_writer','apply','123'::xid8,"+state(fenced)+","+state(fenced)+",NULL,clock_timestamp()+interval '7 seconds');"
        for actor in actors:
            prefix='SET ROLE cvi_tx_'+actor.removeprefix('fixture_')+'; ' if actor.startswith('fixture_') else ''
            if actor!='fixture_verifier':denied(prefix+admission_sql,actor)
            if actor not in ['fixture_writer','fixture_rotator','fixture_fencer','fixture_signer']:
                denied(prefix+"SELECT cvi_tx_fixture.execute_admitted('"+str(uuid.uuid4())+"',repeat('a',64));",actor)
        stage='closed-mutation-shapes'
        for kind,target,actor in [('apply',{**fenced,'head':'d'*64},'fixture_writer'),('activate',{**next_state,'extra':True},'fixture_rotator'),('activate',{**next_state,'generation':True},'fixture_rotator'),('activate',next_state,'fixture_writer')]:
            p=command(kind,fenced,target);s=Session(actor)
            try:Verifier().admit(dict(intent=p,connection=s.identity()));raise RuntimeError('unexpected invalid admission')
            except RuntimeError as e:
                if str(e)=='unexpected invalid admission':raise
                checks+=1
            finally:s.close()
        stage='expired-and-substituted-claim'
        p=command('activate',fenced,next_state);s=Session('fixture_rotator');grant=Verifier().admit(dict(intent=p,connection=s.identity()))
        try:s.execute_admitted(p['operationId'],'0'*64);raise RuntimeError('unexpected wrong claim')
        except DatabaseHeld:checks+=1
        finally:s.close()
        s=Session('fixture_rotator');p=command('activate',fenced,next_state)
        # Admit a very short-lived fixture proof, then let it expire on the same connection.
        record='NULL';claim='e'*64
        good('SELECT cvi_tx_fixture.admit('+','.join([literal(str(uuid.UUID(p['operationId']))),literal(claim),literal(s.principal),literal(p['kind']),literal(s.xid)+'::xid8',state(fenced),state(next_state),record,"clock_timestamp()+interval '100 milliseconds'"])+');','fixture_verifier')
        s.query('SELECT pg_sleep(.15);')
        try:s.execute_admitted(p['operationId'],claim);raise RuntimeError('unexpected expired proof')
        except DatabaseHeld:checks+=1
        finally:s.close()
        stage='concurrent-writes'
        first,second=Session('fixture_rotator'),Session('fixture_rotator')
        p,q=command('activate',fenced,next_state),command('activate',fenced,{**next_state,'boot':'4'*64})
        g,h=Verifier().admit(dict(intent=p,connection=first.identity())),Verifier().admit(dict(intent=q,connection=second.identity()))
        first.execute_admitted(p['operationId'],g['claimHash'])
        try:second.execute_admitted(q['operationId'],h['claimHash']);raise RuntimeError('unexpected concurrent write')
        except DatabaseHeld:checks+=1
        finally:second.close()
        first.commit();first.close();require(current()==next_state)
        stage='stale-baseline'
        try:execute(command('activate',fenced,{**next_state,'boot':'5'*64}),'fixture_rotator');raise RuntimeError('unexpected stale write')
        except DatabaseHeld:checks+=1
        require(current()==next_state)
        stage='metadata'
        require(good("SELECT count(*)=7 AND bool_and(NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole AND NOT rolcreatedb AND NOT rolreplication) FROM pg_roles WHERE rolname LIKE 'cvi_tx_%';")=='t')
        require(good("SELECT count(*)=4 AND bool_and(relrowsecurity AND relforcerowsecurity) FROM pg_class WHERE relnamespace='cvi_tx_fixture'::regnamespace AND relkind='r';")=='t')
        require(good("SELECT count(*)=0 FROM pg_auth_members WHERE roleid='cvi_tx_owner'::regrole;")=='t')
        print(json.dumps(dict(status='passed',checks=checks,hostedChanges=False,authorityVerification='simulated',network='none')))
    except Exception:
        print(json.dumps(dict(status='held',stage=stage,checks=checks)));raise SystemExit(1)
    finally:
        for s in sessions:
            try:s.close()
            except Exception:pass
        if created:run(['rm','-f',name])

if __name__=='__main__':main()
