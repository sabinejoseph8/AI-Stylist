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
from local_cvi_database_adapter import DatabaseTransactionAdapter,ReconciledDatabaseAdapter,DatabaseHeld

ROOT=Path(__file__).resolve().parents[2]
IMAGE='postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3'
ROLES=['writer','rotator','fencer','signer','observer','verifier']

def literal(x):return "'"+str(x).replace("'","''")+"'"
def state(x):return literal(json.dumps(x,separators=(',',':')))+'::jsonb'

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--run-local-synthetic',action='store_true',required=True);parser.add_argument('--signed-authority-bridge',action='store_true');parser.add_argument('--full-state-reconciliation',action='store_true');parser.add_argument('--continuous-full-state',action='store_true');options=parser.parse_args()
    socket=Path.home()/'.docker/run/docker.sock';binary=Path.home()/'.docker/bin/docker'
    if not stat.S_ISSOCK(socket.stat().st_mode):raise RuntimeError('local Docker unavailable')
    docker=[str(binary),'--host','unix://'+str(socket)]
    name='stylist-cvi-transactions-'+uuid.uuid4().hex[:12];created=False;checks=0;stage='startup';sessions=[];workers=[]
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
        def identity(self):return json.loads(self.query("SELECT jsonb_build_object('principal',session_user,'transactionId',pg_current_xact_id()::text);"))
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
    class BridgeWorker:
        def __init__(self,full=False,operation='activate'):
            node=Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
            self.p=subprocess.Popen([str(node),str(ROOT/'apps/foundation/tests/support/cvi-database-bridge-worker.ts')]+(['--full-state','--continuous'] if operation=='sequence' else (['--full-state','--stage='+operation] if full else [])),stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,bufsize=1)
            self.timeout=30 if operation=='sequence' else 12;self.buffer='';self.sel=selectors.DefaultSelector();self.sel.register(self.p.stdout,selectors.EVENT_READ);self.active=None;workers.append(self)
            self.prepared=self.call('prepare');self.command=self.prepared['command']
        def call(self,method,**args):
            self.p.stdin.write(json.dumps(dict(method=method,**args))+'\n');self.p.stdin.flush();limit=time.monotonic()+self.timeout
            while time.monotonic()<limit:
                while '\n' in self.buffer:
                    line,self.buffer=self.buffer.split('\n',1);message=json.loads(line)
                    if message['stage']=='result':return message['result']
                    if message['stage']=='held':raise DatabaseHeld('signed bridge held')
                    if message['stage']=='committed':
                        # A separate observer connection sees only committed MVCC state.
                        raw=good('SELECT row_to_json(v) FROM cvi_tx_fixture.committed_full v;','fixture_observer')
                        observed=json.loads(raw) if raw else None
                        if observed:observed['operationId']=uuid.UUID(observed['operationId']).hex
                        self.p.stdin.write(json.dumps(dict(observed=observed))+'\n');self.p.stdin.flush();continue
                    if message['stage']!='observe' or self.active is None:raise DatabaseHeld('signed bridge held')
                    observed=dict(intent=self.command,connection=self.active.identity())
                    self.p.stdin.write(json.dumps(dict(binding=observed))+'\n');self.p.stdin.flush()
                if not self.sel.select(.1):continue
                chunk=os.read(self.p.stdout.fileno(),65536)
                if not chunk:raise DatabaseHeld('signed bridge held')
                self.buffer+=chunk.decode()
            raise DatabaseHeld('signed bridge held')
        def close(self):
            if self.p.poll() is None:
                try:self.call('close')
                except Exception:pass
            self.p.stdin.close()
            try:self.p.wait(timeout=3)
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
        if options.signed_authority_bridge:
            class SignedVerifier:
                def __init__(self,worker,fail=False):self.worker=worker;self.fail=fail
                def admit(self,b):
                    result=self.worker.call('admit',binding=b);p=b['intent'];c=b['connection'];record='NULL' if p['recordHash'] is None else literal(p['recordHash'])
                    good('SELECT cvi_tx_fixture.admit('+','.join([literal(str(uuid.UUID(p['operationId']))),literal(result['claimHash']),literal(c['principal']),literal(p['kind']),literal(c['transactionId'])+'::xid8',state(p['previous']),state(p['target']),record,"clock_timestamp()+interval '7 seconds'"])+');','fixture_verifier')
                    if self.fail:raise DatabaseHeld('lost admission reply')
                    return result
                def confirm(self,b,claim):return self.worker.call('confirm',binding=b,claimHash=claim)
            for mode in ['normal','bad-proof','bad-claim','lost-claim','replayed-proof','lost-admission','lost-commit']:
                stage='signed-'+mode
                # Each synthetic scenario has a fresh authority journal. Only
                # this disposable database is reset, never a real history store.
                good('TRUNCATE cvi_tx_fixture.releases,cvi_tx_fixture.executions,cvi_tx_fixture.admissions; UPDATE cvi_tx_fixture.state SET payload='+state(initial)+';')
                w=BridgeWorker();w.call('mode',mode=mode);s=Session('fixture_rotator');w.active=s
                if mode=='lost-commit':
                    original_commit=s.commit
                    def lost_commit():original_commit();raise DatabaseHeld('lost commit reply')
                    s.commit=lost_commit
                port=type('Port',(),{'begin':lambda _:s})()
                a=DatabaseTransactionAdapter('fixture_rotator','activate',port,SignedVerifier(w,mode=='lost-admission'),lambda:1000)
                if mode=='normal':
                    require(a.execute(w.command)['target']==w.command['target']);require(current()==w.command['target'])
                else:
                    try:a.execute(w.command);raise RuntimeError('unexpected signed success')
                    except DatabaseHeld:checks+=1
                    require(current()==(w.command['target'] if mode=='lost-commit' else initial))
                evidence=w.call('inspect');require(evidence['claimed']==(mode!='bad-proof'))
                # Successful SQL still leaves full-state authority reconciliation open.
                require(evidence['operations']==1 and evidence['pending'] is not None)
                if evidence['claimed']:
                    w.call('fresh-bridge');retry=Session('fixture_rotator');w.active=retry
                    try:w.call('admit',binding=dict(intent=w.command,connection=retry.identity()));raise RuntimeError('unexpected fresh replay')
                    except DatabaseHeld:checks+=1
                    finally:retry.close()
                w.close()
            good('TRUNCATE cvi_tx_fixture.releases,cvi_tx_fixture.executions,cvi_tx_fixture.admissions; UPDATE cvi_tx_fixture.state SET payload='+state(initial)+';')
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
        for kind,target,actor in [('apply',{**fenced,'head':'d'*64},'fixture_writer'),('activate',{**next_state,'extra':True},'fixture_rotator'),('activate',{**next_state,'generation':True},'fixture_rotator'),('activate',next_state,'fixture_writer'),('apply',{**fenced,'fenced':False},'fixture_writer')]:
            p=command(kind,target if kind=='apply' and target.get('fenced') is False else fenced,target);s=Session(actor)
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
        if options.full_state_reconciliation or options.continuous_full_state:
            stage='full-schema';good((ROOT/'tools/operations/sql/cvi-full-state-contract.sql').read_text())
            for role in ROLES:
                for table in ['full_states','full_admissions']:
                    prefix='SET ROLE cvi_tx_'+role+'; '
                    denied(prefix+'SELECT * FROM cvi_tx_fixture.'+table+';','fixture_'+role)
                    denied(prefix+'DELETE FROM cvi_tx_fixture.'+table+';','fixture_'+role)
                    denied(prefix+'TRUNCATE cvi_tx_fixture.'+table+';','fixture_'+role)
            for role in ['writer','rotator','fencer','signer']:
                denied('SET ROLE cvi_tx_'+role+"; SELECT cvi_tx_fixture.execute_admitted('"+str(uuid.uuid4())+"',repeat('a',64));",'fixture_'+role)
            class FullVerifier:
                def __init__(self,w,mode):self.worker=w;self.mode=mode
                def admit(self,b):
                    result=self.worker.call('admit',binding=b);p=b['intent'];c=b['connection']
                    query='BEGIN; SELECT cvi_tx_fixture.admit('+','.join([literal(str(uuid.UUID(p['operationId']))),literal(result['claimHash']),literal(c['principal']),literal(p['kind']),literal(c['transactionId'])+'::xid8',state(p['previous']),state(p['target']),'NULL' if p['recordHash'] is None else literal(p['recordHash']),"clock_timestamp()+interval '7 seconds'"])+');'
                    if self.mode!='missing-full':query+=' SELECT cvi_tx_fixture.admit_full('+literal(str(uuid.UUID(p['operationId'])))+','+state(self.worker.prepared['states']['previous'])+','+state(self.worker.prepared['states']['target'])+');'
                    good(query+' COMMIT;','fixture_verifier');return result
                def confirm(self,b,claim):
                    result=self.worker.call('confirm',binding=b,claimHash=claim)
                    if self.mode=='uncommitted':self.worker.call('finalize')
                    return result
            for mode in ['normal','uncommitted','tampered-grant','missing-full','lost-commit','lost-reconcile','commit','claim','fence','release']:
                stage='full-'+mode;typed=mode in ['commit','claim','fence','release'];w=BridgeWorker(True,mode if typed else 'activate');w.call('mode',mode='normal' if typed else mode)
                good('TRUNCATE cvi_tx_fixture.full_states,cvi_tx_fixture.full_admissions,cvi_tx_fixture.releases,cvi_tx_fixture.executions,cvi_tx_fixture.admissions; UPDATE cvi_tx_fixture.state SET payload='+state(w.command['previous'])+'; INSERT INTO cvi_tx_fixture.full_states VALUES(true,'+state(w.prepared['states']['previous'])+',NULL);')
                s=Session(w.prepared['principal']);w.active=s
                def apply_full(op,claim):
                    result=json.loads(s.query('SELECT cvi_tx_fixture.execute_full('+literal(str(uuid.UUID(op)))+','+literal(claim)+');'));result['operationId']=uuid.UUID(result['operationId']).hex;return result
                s.execute_admitted=apply_full
                if mode=='lost-commit':
                    commit=s.commit
                    def unknown_commit():commit();raise DatabaseHeld('lost commit reply')
                    s.commit=unknown_commit
                base=DatabaseTransactionAdapter(w.prepared['principal'],w.command['kind'],type('Port',(),{'begin':lambda _:s})(),FullVerifier(w,mode),lambda:1000)
                class Finalizer:
                    def finalize(self,p,result):
                        if mode=='tampered-grant':good("UPDATE cvi_tx_fixture.full_states SET snapshot=jsonb_set(snapshot,'{grants,0,3}',to_jsonb(repeat('0',64)));")
                        return w.call('finalize')
                wrapper=ReconciledDatabaseAdapter(base,Finalizer(),w.prepared['targetDigest'],lambda:1000)
                if mode=='normal' or typed:
                    require(wrapper.execute(w.command)['reconciliation']['status']=='reconciled')
                    require(w.call('inspect')['pending'] is None)
                else:
                    try:wrapper.execute(w.command);raise RuntimeError('unexpected full reconciliation')
                    except DatabaseHeld:checks+=1
                    require((w.call('inspect')['pending'] is None)==(mode=='lost-reconcile'))
                if mode in ['uncommitted','missing-full']:require(current()==w.command['previous'])
                if mode in ['normal','lost-commit','lost-reconcile'] or typed:require(current()==w.command['target'])
                try:wrapper.execute(w.command);raise RuntimeError('unexpected full retry')
                except DatabaseHeld:checks+=1
                w.close()
        if options.continuous_full_state:
            stage='continuous-start';w=BridgeWorker(True,'sequence')
            good('TRUNCATE cvi_tx_fixture.full_states,cvi_tx_fixture.full_admissions,cvi_tx_fixture.releases,cvi_tx_fixture.executions,cvi_tx_fixture.admissions; UPDATE cvi_tx_fixture.state SET payload='+state(w.command['previous'])+'; INSERT INTO cvi_tx_fixture.full_states VALUES(true,'+state(w.prepared['states']['previous'])+',NULL);')
            saved=None
            for n in range(5):
                stage='continuous-step-'+str(n)
                if n:
                    w.call('next',index=n);w.prepared=w.call('prepare');w.command=w.prepared['command']
                if n==0:
                    try:w.call('startup');raise RuntimeError('unexpected pending startup')
                    except DatabaseHeld:checks+=1
                s=Session(w.prepared['principal']);w.active=s
                def apply_continuous(op,claim):
                    result=json.loads(s.query('SELECT cvi_tx_fixture.execute_full('+literal(str(uuid.UUID(op)))+','+literal(claim)+');'));result['operationId']=uuid.UUID(result['operationId']).hex
                    # A competing connection cannot use the original admission.
                    if n==1:
                        other=Session(w.prepared['principal'])
                        try:other.query('SELECT cvi_tx_fixture.execute_full('+literal(str(uuid.UUID(op)))+','+literal(claim)+');');raise RuntimeError('unexpected competing writer')
                        except DatabaseHeld:pass
                        finally:other.close()
                    return result
                s.execute_admitted=apply_continuous
                base=DatabaseTransactionAdapter(w.prepared['principal'],w.command['kind'],type('Port',(),{'begin':lambda _:s})(),FullVerifier(w,'normal'),lambda:1000)
                final=type('Finalizer',(),{'finalize':lambda _,p,r:w.call('finalize')})()
                wrapper=ReconciledDatabaseAdapter(base,final,w.prepared['targetDigest'],lambda:1000)
                require(wrapper.execute(w.command)['reconciliation']['status']=='reconciled')
                require(w.call('verify-current') is True)
                startup=w.call('startup');require(startup['status']=='checkpoint-consistent' and all(v is False for v in startup['permissions'].values()))
                require(good('SELECT count(*) FROM cvi_tx_fixture.executions;')==str(n+1))
                if n==1:
                    require(True);w.call('checkpoint-authority')
                    saved={table:json.loads(good('SELECT coalesce(jsonb_agg(to_jsonb(t)),\'[]\'::jsonb) FROM cvi_tx_fixture.'+table+' t;')) for table in ['state','admissions','full_admissions','executions','releases','full_states']}
            require(good('SELECT count(*) FROM cvi_tx_fixture.releases;')=='1')
            stage='continuous-startup-refusals'
            for bad in ['missing-registry','stale-registry','authority-unavailable','bad-signature']:
                try:w.call('startup',mode=bad);raise RuntimeError('unexpected startup acceptance')
                except DatabaseHeld:checks+=1
            require(w.call('startup',mode='missing-handoff')['permissions']['sign'] is False)
            stage='continuous-database-restore'
            latest={table:json.loads(good('SELECT coalesce(jsonb_agg(to_jsonb(t)),\'[]\'::jsonb) FROM cvi_tx_fixture.'+table+' t;')) for table in ['state','admissions','full_admissions','executions','releases','full_states']}
            def restore_view(checkpoint):
                query='BEGIN; TRUNCATE cvi_tx_fixture.full_states,cvi_tx_fixture.full_admissions,cvi_tx_fixture.releases,cvi_tx_fixture.executions,cvi_tx_fixture.admissions,cvi_tx_fixture.state;'
                for table in ['state','admissions','full_admissions','executions','releases','full_states']:
                    query+=' INSERT INTO cvi_tx_fixture.'+table+' SELECT * FROM jsonb_populate_recordset(NULL::cvi_tx_fixture.'+table+','+state(checkpoint[table])+');'
                good(query+' COMMIT;')
            restore_view(saved)
            try:w.call('verify-current');raise RuntimeError('unexpected database restore acceptance')
            except DatabaseHeld:checks+=1
            try:w.call('startup');raise RuntimeError('unexpected restored database startup')
            except DatabaseHeld:checks+=1
            restore_view(latest);require(w.call('verify-current') is True)
            stage='continuous-authority-restore';w.call('restore-authority')
            try:w.call('verify-current');raise RuntimeError('unexpected authority restore acceptance')
            except DatabaseHeld:checks+=1
            stage='continuous-coordinated-restore';restore_view(saved)
            # Negative boundary: matching rollback of both stores still passes a current-state comparison.
            require(w.call('verify-current') is True)
            try:w.call('startup');raise RuntimeError('unexpected startup below retained floor')
            except DatabaseHeld:checks+=1
            diagnostic=w.call('startup',mode='lost-minimum');require(diagnostic['status']=='checkpoint-consistent' and diagnostic['permissions']['resume'] is False)
            w.close()
        print(json.dumps(dict(status='passed',checks=checks,hostedChanges=False,authorityVerification='continuous-full-state' if options.continuous_full_state else ('full-reconciliation' if options.full_state_reconciliation else ('signed-bridge' if options.signed_authority_bridge else 'simulated')),network='none')))
    except Exception:
        print(json.dumps(dict(status='held',stage=stage,checks=checks)));raise SystemExit(1)
    finally:
        for w in workers:
            try:w.close()
            except Exception:pass
        for s in sessions:
            try:s.close()
            except Exception:pass
        if created:run(['rm','-f',name])

if __name__=='__main__':main()
