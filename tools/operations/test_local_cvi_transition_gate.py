"""Original lock/marker invariants. Proof ports are explicit fake crypto.

Separate processes and SQLite are actual; signed native/adoption integration
remains required before this primitive can complete protected publication.
"""
import copy
import hashlib
import json
import os
from pathlib import Path
import selectors
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import local_cvi_replay as replay
import local_cvi_transition_gate as gates
import local_cvi_witness as witness
from local_recovery_abuse import encoded

H=lambda n:hashlib.sha256(str(n).encode()).hexdigest()
CHILD='''import json,sys
import local_cvi_replay as r
import local_cvi_transition_gate as g
x=json.loads(sys.stdin.readline())
if x['mode']=='reserve':
 try:r.operate(x['root'],x['request'],'reserve');print('unexpected',flush=True)
 except ValueError:print('held',flush=True)
else:
 source=lambda m,n:dict(nonce=n)
 verify=lambda m,p,n,e,at:dict(status='transition-finish-verified',operationId=p['id'],targetDigest=g.sha(p['to']),challenge=n)
 with g.transition(x['root'],x['scope'],x['intent'],source,verify,lambda:x['intent']['now']) as gate:
  print('locked',flush=True)
  sys.stdin.readline()
  if x['mode']=='finish':gate.finish();print('finished',flush=True)
'''

class TransitionGateTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'replay';self.root.mkdir(mode=0o700)
        self.store=replay.prepare(self.root,H(1),10000,1000)
        native='11111111-1111-4111-8111-111111111111'
        before=dict(storeId=native,policyDigest=H(2),epochFloor=0,headFloor=H(3),observedClock=1000,historyDigest=H(4))
        body=dict(version=1,kind='activate',args=dict(previous=0,owner=H(5),boot=H(6),ttl=8000,token=H(7)),actor=dict(principalDigest=H(8),role='rotator'),now=1000,**{'from':before},to=dict(before,epochFloor=1,headFloor=H(9),historyDigest=H(10)))
        self.intent=dict(id=gates.sha(body),**body)
        self.scope=dict(storeId=self.store,bindingDigest=H(1),nativeStoreId=native,applicationExpiresAt=10000,expiresAt=8000)
        self.time=1000;self.proofs=[];self.checks=[]
        self.source=lambda m,n:self.proofs.append((copy.deepcopy(m),n)) or dict(nonce=n)
        def verify(m,p,n,e,at):
            self.checks.append((copy.deepcopy(m),copy.deepcopy(p),n,copy.deepcopy(e),at))
            if e!=dict(nonce=n):raise ValueError('fake-proof-held')
            return dict(status='transition-finish-verified',operationId=p['id'],targetDigest=gates.sha(p['to']),challenge=n)
        self.verify=verify
    def enter(self,**patches):
        args=dict(root=self.root,scope=self.scope,intent=self.intent,proof_source=self.source,verify=self.verify,clock=lambda:self.time)
        args.update(patches);return gates.transition(**args)
    def request(self,now=None,challenge=None):return dict(storeId=self.store,bindingDigest=H(1),challenge=challenge or H(30),now=self.time if now is None else now)
    def reserve(self):return replay.operate(self.root,dict(storeId=self.store,bindingDigest=H(1),requestDigest=H(40),now=self.time),'reserve')
    def state(self):return json.loads((self.root/'ledger.json').read_text())
    def marker(self):return self.root/witness.TRANSITION_MARKER
    def child(self,mode):
        env=dict(os.environ,PYTHONPATH=str(Path(__file__).parent))
        p=subprocess.Popen([sys.executable,'-c',CHILD],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,env=env)
        p.stdin.write(json.dumps(dict(mode=mode,root=str(self.root),scope=self.scope,intent=self.intent,request=dict(storeId=self.store,bindingDigest=H(1),requestDigest=H(41),now=1000)))+'\n');p.stdin.flush()
        return p
    def ready(self,p):
        with selectors.DefaultSelector() as s:
            s.register(p.stdout,selectors.EVENT_READ)
            self.assertTrue(s.select(3),'child did not reach gate')
            return p.stdout.readline().strip()
    def stop(self,p):
        if p.poll() is None:p.kill()
        p.wait(timeout=3)
        for stream in (p.stdin,p.stdout,p.stderr):stream.close()
    def test_original_finish_removes_only_marker_and_preserves_replay(self):
        before=self.state()
        with self.enter() as g:
            self.assertTrue(self.marker().exists());description=g.describe()
            self.assertEqual(description['operationId'],self.intent['id'])
            self.assertNotIn(self.intent['args']['token'],self.marker().read_text())
            result=g.finish();self.assertEqual(result['status'],'transition-finished')
            with self.assertRaises(ValueError):g.finish()
            with self.assertRaises(ValueError):g.inspect(self.request())
        self.assertFalse(self.marker().exists());self.assertEqual(self.state(),before);self.assertEqual(len(self.proofs),1)
    def test_exit_without_finish_retains_marker_and_cannot_reopen(self):
        with self.enter() as g:description=g.describe()
        self.assertTrue(self.marker().exists())
        for action in (lambda:g.finish(),lambda:g.inspect(self.request()),lambda:replay.load(self.root,self.store),lambda:replay.inspect_boundary(self.root,self.request()),self.reserve):
            with self.assertRaises(ValueError):action()
        with self.assertRaises(ValueError),self.enter():pass
        self.assertEqual(json.loads(self.marker().read_text()),description)
    def test_copied_handles_cannot_inspect_finish_or_retire_original(self):
        with self.enter() as g:
            for copied in (copy.copy(g),copy.deepcopy(g)):
                for call in (lambda:copied.inspect(self.request()),copied.finish,copied.hold,copied.describe):
                    with self.assertRaises(ValueError):call()
            self.assertEqual(g.finish()['status'],'transition-finished')
    def test_gate_inspection_is_read_only_and_advances_only_clock(self):
        before=self.state();self.time=1500
        with self.enter() as g:
            result=g.inspect(self.request());s=result['snapshot']
            self.assertEqual(result['operationId'],self.intent['id']);self.assertEqual(s['status'],'replay-idle')
            self.assertTrue(all(v is False for v in s['permissions'].values()));self.assertEqual(s['clock'],1500)
            self.assertEqual({k:v for k,v in self.state().items() if k!='clock'},{k:v for k,v in before.items() if k!='clock'})
            g.finish()
        self.assertEqual(self.state()['clock'],1500)
    def test_original_inspection_reuses_no_challenge(self):
        with self.enter() as g:
            g.inspect(self.request())
            with self.assertRaises(ValueError):g.inspect(self.request())
            with self.assertRaises(ValueError):g.finish()
        self.assertTrue(self.marker().exists())
    def test_pending_or_exhausted_replay_cannot_start_transition(self):
        receipt=self.reserve()
        with self.assertRaises(ValueError),self.enter():pass
        self.assertFalse(self.marker().exists());replay.operate(self.root,receipt,'consume')
        s=self.state();s['limit']=1;data=encoded(s);(self.root/'ledger.json').write_bytes(data);(self.root/'checkpoint.json').write_bytes(encoded(dict(sha256=hashlib.sha256(data).hexdigest())))
        with self.assertRaises(ValueError),self.enter():pass
        self.assertFalse(self.marker().exists());self.assertEqual(len(self.state()['records']),1)
    def test_unknown_finish_proof_holds_without_retry_or_marker_repair(self):
        source=lambda *_:(_ for _ in ()).throw(ValueError('unknown'))
        with self.enter(proof_source=source) as g:
            with self.assertRaises(ValueError):g.finish()
            with self.assertRaises(ValueError):g.finish()
        self.assertTrue(self.marker().exists());self.assertEqual(self.checks,[])
    def test_wrong_verifier_result_never_releases_marker(self):
        for mode in ('boolean','operation','target','nonce','extra'):
            with self.subTest(mode=mode):
                # Each case uses a fresh disposable journal, never clears a held marker.
                self.temp.cleanup();self.setUp()
                def bad(m,p,n,e,at):
                    result=self.verify(m,p,n,e,at)
                    if mode=='boolean':return True
                    result[dict(operation='operationId',target='targetDigest',nonce='challenge',extra='resume')[mode]]=True
                    return result
                with self.enter(verify=bad) as g:
                    with self.assertRaises(ValueError):g.finish()
                self.assertTrue(self.marker().exists())
    def test_changed_description_and_caller_plan_cannot_replace_captured_operation(self):
        original=copy.deepcopy(self.intent)
        with self.enter() as g:
            d=g.describe();d['targetNativeDigest']=H(99);self.intent['args']['token']=H(98);self.scope['expiresAt']=10000
            g.finish()
        self.assertEqual(self.checks[0][1],original);self.assertEqual(self.proofs[0][0]['expiresAt'],8000)
    def test_changed_marker_or_complete_replay_is_held_even_with_new_checksum(self):
        for mode in ('marker','journal'):
            with self.subTest(mode=mode):
                self.temp.cleanup();self.setUp()
                with self.enter() as g:
                    if mode=='marker':self.marker().write_text('{}')
                    else:
                        s=self.state();s['limit']=63;data=encoded(s);(self.root/'ledger.json').write_bytes(data);(self.root/'checkpoint.json').write_bytes(encoded(dict(sha256=hashlib.sha256(data).hexdigest())))
                    with self.assertRaises(ValueError):g.finish()
                self.assertTrue(self.marker().exists());self.assertEqual(self.proofs,[])
    def test_expiry_or_clock_regression_around_proof_refuses_completion(self):
        for mode in ('before','source','verify','rollback'):
            with self.subTest(mode=mode):
                self.temp.cleanup();self.setUp();source=self.source;verify=self.verify
                def produce(*a):
                    r=source(*a)
                    if mode=='source':self.time=8000
                    if mode=='rollback':self.time=999
                    return r
                def check(*a):
                    r=verify(*a)
                    if mode=='verify':self.time=8000
                    return r
                with self.enter(proof_source=produce,verify=check) as g:
                    if mode=='before':self.time=8000
                    with self.assertRaises(ValueError):g.finish()
                self.assertTrue(self.marker().exists())
    def test_competing_process_and_nested_transition_refuse_without_deadlock(self):
        with self.enter() as g:
            p=self.child('reserve')
            try:self.assertEqual(self.ready(p),'held');p.wait(timeout=3)
            finally:self.stop(p)
            with self.assertRaises(ValueError),self.enter():pass
            g.finish()
        self.assertEqual(self.reserve()['status'],'reserved')
    def test_process_loss_releases_lock_but_retains_original_marker(self):
        p=self.child('hold')
        try:self.assertEqual(self.ready(p),'locked')
        finally:self.stop(p)
        self.assertTrue(self.marker().exists())
        with self.assertRaises(ValueError):self.reserve()
        with self.assertRaises(ValueError),self.enter():pass
    def test_partial_marker_creation_is_never_repaired(self):
        def partial(path,data):path.write_bytes(b'partial');raise ValueError('lost fsync')
        with patch.object(gates,'durable_create',partial),self.assertRaises(ValueError),self.enter():pass
        self.assertEqual(self.marker().read_bytes(),b'partial')
        with self.assertRaises(ValueError):self.reserve()
    def test_pinned_witness_tracks_original_gate_inspection(self):
        w=Path(self.temp.name)/'witness';w.mkdir(mode=0o700);ref=witness.prepare(w,self.root,self.store,'replay')
        with self.enter(witness=ref) as g:
            self.time=1500;g.inspect(self.request());self.assertEqual(witness.load(ref)['head'],witness.digest_file(self.root));g.finish()
        self.assertEqual(replay.inspect_boundary(self.root,self.request(),witness=ref)['clock'],1500)
    def test_lost_finish_sync_holds_original_even_if_marker_was_removed(self):
        sync=gates.sync_root;calls=[]
        def fail(root):
            calls.append(True)
            if len(calls)==2:raise ValueError('unknown final sync')
            sync(root)
        with patch.object(gates,'sync_root',fail),self.enter() as g:
            with self.assertRaises(ValueError):g.finish()
            with self.assertRaises(ValueError):g.finish()
            with self.assertRaises(ValueError):g.inspect(self.request())
        self.assertFalse(self.marker().exists());self.assertEqual(len(self.proofs),1);self.assertEqual(self.state()['records'],[])
    def test_missing_ports_invalid_plan_and_widened_scope_do_not_create_marker(self):
        for changes in (dict(proof_source=None),dict(verify=None),dict(scope={**self.scope,'expiresAt':10000}),dict(scope={**self.scope,'nativeStoreId':self.store}),dict(intent={**self.intent,'id':H(97)})):
            with self.subTest(changes=list(changes)),self.assertRaises(ValueError),self.enter(**changes):pass
            self.assertFalse(self.marker().exists())

    def test_original_inspection_captures_request_before_clock_callback(self):
        raw=self.request();changing=False
        def clock():
            if changing:raw['challenge']=H(89)
            return self.time
        with self.enter(clock=clock) as g:
            changing=True;r=g.inspect(raw);self.assertEqual(r['snapshot']['challenge'],H(30));g.finish()
    def test_concurrent_finish_refuses_second_call_before_proof(self):
        import threading
        started=threading.Event();release=threading.Event();results=[]
        source=self.source
        def waiting(*a):
            started.set()
            if not release.wait(3):raise ValueError('test timeout')
            return source(*a)
        with self.enter(proof_source=waiting) as g:
            def finish():
                try:results.append(g.finish())
                except Exception:results.append('held')
            t=threading.Thread(target=finish);t.start()
            try:
                self.assertTrue(started.wait(3))
                with self.assertRaises(ValueError):g.finish()
                with self.assertRaises(ValueError):g.inspect(self.request())
                release.set();t.join(3);self.assertFalse(t.is_alive())
            finally:release.set();t.join(3)
        self.assertEqual(len(self.proofs),1);self.assertEqual(results[0]['status'],'transition-finished')
    def test_hold_during_finish_prevents_late_proof_from_removing_marker(self):
        import threading
        started=threading.Event();release=threading.Event();results=[];source=self.source
        def waiting(*a):
            started.set()
            if not release.wait(3):raise ValueError('test timeout')
            return source(*a)
        with self.enter(proof_source=waiting) as g:
            def finish():
                try:results.append(g.finish())
                except Exception:results.append('held')
            t=threading.Thread(target=finish);t.start()
            try:
                self.assertTrue(started.wait(3));g.hold();release.set();t.join(3);self.assertFalse(t.is_alive())
            finally:release.set();t.join(3)
        self.assertEqual(results,['held']);self.assertTrue(self.marker().exists());self.assertEqual(self.checks,[])
    def test_broken_symlink_marker_and_witness_bootstrap_are_refused(self):
        self.marker().symlink_to(self.root/'missing')
        with self.assertRaises(ValueError),self.enter():pass
        with self.assertRaises(ValueError):self.reserve()
        w=Path(self.temp.name)/'witness';w.mkdir(mode=0o700)
        with self.assertRaises(ValueError):witness.prepare(w,self.root,self.store,'replay')
        self.assertEqual(list(w.iterdir()),[]);self.assertTrue(self.marker().is_symlink())
    def test_bounded_original_inspection_does_not_rearm_on_exhaustion(self):
        with self.enter() as g:
            for i in range(64):g.inspect(self.request(challenge=H(300+i)))
            with self.assertRaises(ValueError):g.inspect(self.request(challenge=H(400)))
            with self.assertRaises(ValueError):g.finish()
        self.assertTrue(self.marker().exists());self.assertEqual(self.state()['records'],[])

    def pin(self):
        w=Path(self.temp.name)/'witness';w.mkdir(mode=0o700)
        return witness.prepare(w,self.root,self.store,'replay')
    def test_one_sided_restore_cannot_remove_unfinished_intent_with_pinned_witness(self):
        ref=self.pin();before={n:(self.root/n).read_bytes() for n in ('ledger.json','checkpoint.json')}
        with self.enter(witness=ref):pass
        self.marker().unlink() # Explicit simulated folder restore, never admission repair.
        for n,data in before.items():(self.root/n).write_bytes(data)
        self.assertNotEqual(witness.load(ref)['head'],witness.digest_file(self.root))
        with self.assertRaises(ValueError):replay.inspect_boundary(self.root,self.request(),witness=ref)
        with self.assertRaises(ValueError),self.enter(witness=ref):pass
        self.assertFalse(self.marker().exists())
    def test_negative_boundary_marker_restore_without_witness_can_look_idle(self):
        with self.enter():pass
        self.marker().unlink() # Privileged rollback is outside an unpinned fixture's guarantee.
        snapshot=replay.inspect_boundary(self.root,self.request())
        self.assertEqual(snapshot['status'],'replay-idle');self.assertTrue(all(v is False for v in snapshot['permissions'].values()))
    def test_witness_advance_before_lost_marker_creation_holds_missing_marker(self):
        ref=self.pin()
        with patch.object(gates,'durable_create',side_effect=ValueError('unknown marker write')),self.assertRaises(ValueError),self.enter(witness=ref):pass
        self.assertFalse(self.marker().exists());self.assertEqual(witness.load(ref)['epoch'],1)
        self.assertNotEqual(witness.load(ref)['head'],witness.digest_file(self.root))
        with self.assertRaises(ValueError):replay.inspect_boundary(self.root,self.request(),witness=ref)
        self.assertEqual(self.proofs,[])
    def test_unknown_marker_removal_keeps_witness_ahead_and_original_held(self):
        ref=self.pin()
        unlink=Path.unlink
        def fail(path,*a,**kw):
            if path==self.marker():raise ValueError('unknown unlink')
            return unlink(path,*a,**kw)
        with self.enter(witness=ref) as g:
            with patch.object(Path,'unlink',fail),self.assertRaises(ValueError):g.finish()
            with self.assertRaises(ValueError):g.finish()
        self.assertTrue(self.marker().exists());self.assertEqual(witness.load(ref)['epoch'],2)
        self.assertNotEqual(witness.load(ref)['head'],witness.digest_file(self.root))
        with self.assertRaises(ValueError):replay.inspect_boundary(self.root,self.request(),witness=ref)
    def test_clock_write_split_retains_transition_and_witness_evidence(self):
        ref=self.pin();save=witness.save
        def split(root,*a,**kw):
            save(root,*a,**kw)
            if Path(root)==Path(ref['root']):raise ValueError('lost witness acknowledgment')
        with self.enter(witness=ref) as g:
            self.time=1500
            with patch.object(witness,'save',split),self.assertRaises(ValueError):g.inspect(self.request())
            with self.assertRaises(ValueError):g.finish()
        self.assertTrue(self.marker().exists());self.assertEqual(self.state()['clock'],1000)
        self.assertNotEqual(witness.load(ref)['head'],witness.digest_file(self.root))
    def test_spent_records_capacity_and_expiry_survive_verified_transition(self):
        receipt=self.reserve();replay.operate(self.root,receipt,'consume');before=self.state()
        with self.enter() as g:
            snapshot=g.inspect(self.request())['snapshot'];self.assertEqual(snapshot['spentCount'],1);g.finish()
        self.assertEqual(self.state(),before)
        with self.assertRaises(ValueError):self.reserve()
    def test_verifier_cannot_replace_private_target_by_mutating_its_copies(self):
        def altered(m,p,n,e,at):
            p['to']['historyDigest']=H(901);m['targetNativeDigest']=gates.sha(p['to'])
            return dict(status='transition-finish-verified',operationId=p['id'],targetDigest=m['targetNativeDigest'],challenge=n)
        with self.enter(verify=altered) as g:
            with self.assertRaises(ValueError):g.finish()
        self.assertTrue(self.marker().exists());self.assertEqual(self.state()['records'],[])
    def test_stale_plan_cannot_reset_previously_observed_clock(self):
        self.time=1500;replay.inspect_boundary(self.root,self.request())
        with self.assertRaises(ValueError),self.enter():pass
        self.assertFalse(self.marker().exists());self.assertEqual(self.state()['clock'],1500)

class NativeTransitionGateTests(unittest.TestCase):
    def setUp(self):
        import test_local_cvi_writer_lease as fixtures
        import local_cvi_writer_lease as leases
        import local_cvi_mandatory_adapter as adapter
        self.leases=leases;self.adapter=adapter
        self.g=TransitionGateTests('runTest');self.g.setUp();self.addCleanup(self.g.doCleanups)
        self.n=fixtures.WriterLeaseTests('runTest');self.n.setUp();self.addCleanup(self.n.doCleanups)
        self.old=leases.activate(self.n.root,self.n.rotator,0,self.n.owner,H(100),1000,8000)
        self.config=dict(now=1500,actor={'fixture':'domain'},node='unused',verifier='unused',authorityPin={},readPrincipal='unused')
        self.plan=adapter.plan(self.n.root,self.config,self.n.rotator,'renew',dict(lease=self.old,ttl=8000,token=H(101)))
        self.g.intent=self.plan;self.g.scope.update(nativeStoreId=self.plan['from']['storeId'],expiresAt=9000);self.g.time=1500
        self.g.source=lambda m,n:dict(nonce=n,current=self.observe())
        def verify(m,p,n,e,at):
            if e!=dict(nonce=n,current=p['to']):raise ValueError('actual-native-target-held')
            return dict(status='transition-finish-verified',operationId=p['id'],targetDigest=gates.sha(p['to']),challenge=n)
        self.g.verify=verify
    def observe(self):
        from local_cvi_transaction import connection
        with connection(self.n.root) as db:return self.adapter.control_metadata(db,1500)
    def execute(self):
        with patch.object(self.adapter,'verify',lambda *_:None):return self.adapter.execute(self.n.root,self.config,self.plan,{},lambda m:{})
    def test_native_renewal_commits_under_replay_gate_without_reverse_lock(self):
        before=self.g.state();ref=self.g.pin()
        with self.g.enter(witness=ref) as gate:
            renewed=self.execute();self.assertEqual(self.observe(),self.plan['to']);self.assertNotEqual(renewed['token'],self.old['token'])
            child=self.g.child('reserve')
            try:self.assertEqual(self.g.ready(child),'held');child.wait(timeout=3)
            finally:self.g.stop(child)
            gate.finish()
        self.assertEqual(self.g.state(),before);self.assertEqual(witness.load(ref)['head'],witness.digest_file(self.g.root))
        # The original old worker cannot write even though its old expiry is still live.
        import local_cvi_owner_replay as guarded
        calls=[];config=dict(nativeRoot=str(self.n.root),lease=self.old,ownerDigest=self.n.owner,authorityPin={},readerPrincipal=H(102),minimumRevision=0,replayStoreId=self.g.store,bindingDigest=H(1),node='unused',verifier='unused')
        request=dict(storeId=self.g.store,bindingDigest=H(1),requestDigest=H(103),now=1500)
        with self.assertRaises(ValueError):guarded.operate(self.g.root,request,'reserve',config,lambda m:calls.append(m),lambda:1500)
        self.assertEqual(calls,[]);self.assertEqual(self.g.state(),before)
    def test_process_loss_after_native_commit_retains_uncertainty_without_reapply(self):
        child=self.g.child('hold')
        try:
            self.assertEqual(self.g.ready(child),'locked');self.execute();self.assertEqual(self.observe(),self.plan['to'])
        finally:self.g.stop(child)
        before=self.observe();self.assertTrue(self.g.marker().exists())
        with self.assertRaises(ValueError),self.g.enter():pass
        with self.assertRaises(ValueError):self.g.reserve()
        self.assertEqual(self.observe(),before);self.assertEqual(self.g.state()['records'],[])
    def test_uncommitted_native_target_cannot_finish_gate(self):
        with self.g.enter() as gate:
            with self.assertRaises(ValueError):gate.finish()
        self.assertEqual(self.observe(),self.plan['from']);self.assertTrue(self.g.marker().exists())
    def test_nonparticipating_native_change_is_detected_at_finish(self):
        with self.g.enter() as gate:
            self.execute();self.leases.fence(self.n.root,self.n.fencer,self.old['generation'],1500)
            with self.assertRaises(ValueError):gate.finish()
        self.assertTrue(self.g.marker().exists());self.assertNotEqual(self.observe(),self.plan['to'])
    def test_negative_boundary_unfenced_native_change_after_verification_is_not_excluded(self):
        verify=self.g.verify
        def outside_writer(*args):
            checked=verify(*args)
            self.leases.fence(self.n.root,self.n.fencer,self.old['generation'],1500)
            return checked
        with self.g.enter(verify=outside_writer) as gate:
            self.execute();result=gate.finish()
        self.assertEqual(result['status'],'transition-finished')
        self.assertNotEqual(self.observe(),self.plan['to'])
        # This primitive is not protected publication or universal writer fencing.
        self.assertNotIn('resume',result);self.assertNotIn('lease',result)
