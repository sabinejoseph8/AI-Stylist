"""Fresh processes, owner-only disposable directories and synthetic callbacks only."""
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import uuid
import local_recovery_abuse as m

CHILD='''
import json,os,sys
from pathlib import Path
import local_recovery_abuse as m
x=json.load(sys.stdin);root=Path(x.pop('root'));expected=x.pop('expected');mode=x.pop('mode')
def operation():
 fd=os.open(root/'fake-provider-calls.txt',os.O_WRONLY|os.O_APPEND|os.O_CREAT|os.O_NOFOLLOW,0o600)
 with os.fdopen(fd,'ab') as out:out.write(b'call\\n');out.flush();os.fsync(out.fileno())
 if x.pop('provider_crash',False):os._exit(72)
 if x.pop('provider_error',False):raise RuntimeError('synthetic private error')
 return x.pop('result',dict(outcome='rejected',cleanup_verified=True))
try:
 if mode=='inspect':result=m.inspect(root,expected)
 elif mode=='reserve':result=m.reserve(root,expected,**x)
 elif mode=='finish':m.finish(root,expected,**x);result={'finished':True}
 elif mode=='run':
  options={k:v for k,v in x.items() if k not in ('result','provider_crash','provider_error')}
  result=m.run(root,expected,operation=operation,**options)
 else:raise ValueError()
 print(json.dumps(result))
except Exception:
 print('{"status":"unavailable"}');sys.exit(2)
'''

class RecoveryAbuseTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='stylist-recovery-abuse-')
        self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)
        self.policy=dict(guesses=3,sends=2,total=12,resend_interval=10,code_ttl=50,expires=1000)
        self.expected=m.prepare(self.root,self.policy,100);self.subject='fixture-subject-a'

    def child(self,mode,**options):
        return subprocess.run([sys.executable,'-c',CHILD],input=json.dumps(dict(root=str(self.root),expected=self.expected,mode=mode,**options)),text=True,capture_output=True,timeout=10,cwd=Path(__file__).resolve().parent)

    def args(self,kind='verify',now=101,generation=1,subject=None):
        return dict(subject=subject or self.subject,kind=kind,generation=None if kind=='send' else generation,now=now,operation_id='fixture-operation-'+uuid.uuid4().hex)

    def run_child(self,kind='verify',now=101,generation=1,**extra):
        return self.child('run',**self.args(kind,now,generation),**extra)

    def send(self,now=100):
        self.assertEqual(json.loads(self.run_child('send',now,result=dict(outcome='completed',cleanup_verified=True)).stdout),{'status':'rehearsalComplete'})

    def calls(self):
        path=self.root/'fake-provider-calls.txt'
        return len(path.read_text().splitlines()) if path.exists() else 0

    def state(self):
        result=self.child('inspect');self.assertEqual(result.returncode,0,result.stderr);return json.loads(result.stdout)

    def unavailable(self,result):self.assertEqual(json.loads(result.stdout),{'status':'unavailable'})

    def test_guesses_survive_fresh_processes_and_do_not_refund_rejection(self):
        self.send()
        for _ in range(3):self.unavailable(self.run_child())
        self.unavailable(self.run_child());self.assertEqual(self.calls(),4)
        self.assertEqual([x['state'] for x in self.state()['records']],['completed','rejected','rejected','rejected'])

    def test_resend_does_not_reset_subject_guess_count(self):
        self.send();self.run_child();self.run_child();self.send(110)
        self.unavailable(self.run_child(now=111,generation=2));self.unavailable(self.run_child(now=112,generation=2))
        self.assertEqual(self.calls(),5);self.assertEqual(sum(x['kind']=='verify' for x in self.state()['records']),3)

    def test_resend_limit_survives_restart(self):
        self.send();self.send(110);self.unavailable(self.run_child('send',120));self.assertEqual(self.calls(),2)

    def test_resend_cooldown_blocks_before_simulated_provider_work(self):
        self.send();self.unavailable(self.run_child('send',109));self.assertEqual(self.calls(),1);self.send(110);self.assertEqual(self.calls(),2)

    def test_superseded_generation_and_code_expiry_are_refused(self):
        self.send();self.send(110);self.unavailable(self.run_child(now=111,generation=1));self.unavailable(self.run_child(now=160,generation=2));self.assertEqual(self.calls(),2)

    def test_no_initial_send_means_no_guess_admission(self):
        self.unavailable(self.run_child());self.assertEqual(self.calls(),0)

    def test_changing_subject_cannot_bypass_shared_total(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);expected=m.prepare(root,{**self.policy,'total':3},100)
            for index in range(3):
                receipt=m.reserve(root,expected,**self.args('send',100,subject=f'fixture-subject-{index}'));m.finish(root,expected,receipt['operation_id'],outcome='completed',cleanup_verified=True)
            with self.assertRaises(m.RecoveryHeld):m.reserve(root,expected,**self.args('send',100,subject='fixture-subject-new'))

    def test_concurrent_fresh_processes_cannot_both_claim_last_guess(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.root=Path(tmp);self.expected=m.prepare(self.root,{**self.policy,'guesses':1},100);self.send()
            with ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(lambda _:self.run_child(),range(8)))
            for result in results:self.unavailable(result)
            self.assertEqual(self.calls(),2);self.assertEqual(len(self.state()['records']),2)

    def test_crash_after_reservation_does_not_release_or_retry(self):
        self.send();self.assertEqual(self.child('reserve',**self.args()).returncode,0)
        self.unavailable(self.run_child(now=102));self.assertEqual(self.calls(),1);self.assertEqual(self.state()['records'][-1]['state'],'reserved')

    def test_crash_after_provider_work_blocks_next_call(self):
        self.send();self.assertEqual(self.run_child(provider_crash=True).returncode,72);self.unavailable(self.run_child(now=102));self.assertEqual(self.calls(),2);self.assertEqual(self.state()['records'][-1]['state'],'reserved')

    def test_unknown_provider_failure_creates_persistent_hold(self):
        self.send();self.unavailable(self.run_child(provider_error=True));self.unavailable(self.run_child(now=102));self.assertEqual(self.calls(),2);self.assertEqual(self.state()['records'][-1]['state'],'held')

    def test_uncertain_cleanup_cannot_report_success(self):
        self.send();self.unavailable(self.run_child(result=dict(outcome='completed',cleanup_verified=False)));self.unavailable(self.run_child(now=102));self.assertEqual(self.calls(),2);self.assertEqual(self.state()['records'][-1]['state'],'held')

    def test_success_still_consumes_guess(self):
        self.send();self.assertEqual(json.loads(self.run_child(result=dict(outcome='completed',cleanup_verified=True)).stdout),{'status':'rehearsalComplete'})
        self.run_child();self.run_child();self.unavailable(self.run_child());self.assertEqual(self.calls(),4)

    def test_duplicate_operation_id_cannot_invoke_provider_again(self):
        self.send();args=self.args();self.child('run',**args);self.unavailable(self.child('run',**args));self.assertEqual(self.calls(),2)

    def test_wrong_or_replayed_completion_cannot_release(self):
        self.send();receipt=json.loads(self.child('reserve',**self.args()).stdout)
        self.unavailable(self.child('finish',operation_id='fixture-operation-'+'a'*32,outcome='completed',cleanup_verified=True));self.unavailable(self.run_child(now=102));self.assertEqual(self.calls(),1)
        self.assertEqual(self.child('finish',operation_id=receipt['operation_id'],outcome='rejected',cleanup_verified=True).returncode,0)
        self.unavailable(self.child('finish',operation_id=receipt['operation_id'],outcome='completed',cleanup_verified=True))

    def test_missing_records_never_initialize_replacement(self):
        for name in ['ledger.json','checkpoint.json','lock']:
            with self.subTest(name=name),tempfile.TemporaryDirectory() as tmp:
                self.root=Path(tmp);self.expected=m.prepare(self.root,self.policy,100);(self.root/name).unlink()
                self.unavailable(self.run_child('send',100));self.assertFalse((self.root/name).exists());self.assertEqual(self.calls(),0)

    def test_corrupt_truncated_or_shared_files_hold(self):
        for mode in ['corrupt','truncate','permissions']:
            with self.subTest(mode=mode),tempfile.TemporaryDirectory() as tmp:
                self.root=Path(tmp);self.expected=m.prepare(self.root,self.policy,100)
                if mode=='permissions':os.chmod(self.root/'ledger.json',0o644)
                else:(self.root/'ledger.json').write_bytes(b'{}' if mode=='corrupt' else b'{')
                self.unavailable(self.run_child('send',100));self.assertEqual(self.calls(),0)

    def test_pending_marker_survives_each_interrupted_write_stage(self):
        for stage in ['pending','ledger','checkpoint']:
            with self.subTest(stage=stage),tempfile.TemporaryDirectory() as tmp:
                self.root=Path(tmp);self.expected=m.prepare(self.root,self.policy,100)
                self.assertEqual(self.child('reserve',**self.args('send',100),crash_at=stage).returncode,71)
                self.unavailable(self.run_child('send',100));self.assertEqual(self.calls(),0);self.assertTrue((self.root/'pending').exists())

    def test_interrupted_completion_blocks_future_calls(self):
        self.send();receipt=json.loads(self.child('reserve',**self.args()).stdout)
        self.assertEqual(self.child('finish',operation_id=receipt['operation_id'],outcome='rejected',cleanup_verified=True,crash_at='ledger').returncode,71)
        self.unavailable(self.run_child(now=102));self.assertEqual(self.calls(),1)

    def test_one_sided_ledger_rollback_disagrees_with_checkpoint(self):
        self.send();before=(self.root/'ledger.json').read_bytes();self.run_child();(self.root/'ledger.json').write_bytes(before);self.unavailable(self.run_child(now=102));self.assertEqual(self.calls(),2)

    def test_policy_change_and_store_substitution_hold(self):
        self.send();original=self.expected
        for expected in [{**original,'store_id':str(uuid.uuid4())},{**original,'policy_digest':'0'*64}]:
            self.expected=expected;self.unavailable(self.run_child());self.assertEqual(self.calls(),1)
        self.expected=original

    def test_checksum_cannot_hide_structurally_invalid_history(self):
        self.send();self.run_child();state=self.state();state['records'][-1]['generation']=99
        payload=m.encoded(state);(self.root/'ledger.json').write_bytes(payload);(self.root/'checkpoint.json').write_bytes(m.encoded({'sha256':hashlib.sha256(payload).hexdigest()}))
        self.unavailable(self.run_child(now=102));self.assertEqual(self.calls(),2)

    def test_clock_rollback_and_policy_expiry_hold(self):
        self.send();self.run_child(now=120);self.unavailable(self.run_child(now=119));self.unavailable(self.run_child(now=1000));self.assertEqual(self.calls(),2)

    def test_real_identity_and_secret_material_are_not_ledger_inputs(self):
        for subject in ['sample@example.test','real@example.com','fixture-subject-a\n']:self.unavailable(self.child('run',**self.args('send',100,subject=subject)))
        self.assertEqual(self.calls(),0);self.send();text=(self.root/'ledger.json').read_text()
        for field in ['email','password','access_token','refresh_token','012345']:self.assertNotIn(field,text)

    def test_symlinks_and_shared_directories_are_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            target=Path(tmp)/'external';target.write_text('untouched');path=self.root/'ledger.json';path.unlink();path.symlink_to(target)
            self.unavailable(self.run_child('send',100));self.assertEqual(target.read_text(),'untouched');self.assertEqual(self.calls(),0)
        os.chmod(self.root,0o755);self.unavailable(self.run_child('send',100));self.assertEqual(self.calls(),0)

    def test_existing_fixture_is_not_reseeded_and_files_are_private(self):
        with self.assertRaises(m.RecoveryHeld):m.prepare(self.root,self.policy,100)
        self.send()
        for path in self.root.iterdir():self.assertEqual(path.stat().st_mode&0o077,0)

    def test_malformed_cleanup_result_holds_without_leaking_detail(self):
        self.send();result=self.run_child(result=dict(outcome='completed',cleanup_verified='yes',private='synthetic-private'));self.unavailable(result)
        self.assertNotIn('synthetic-private',result.stdout);self.assertEqual(self.state()['records'][-1]['state'],'held')

    def test_no_automatic_window_rollover_refunds_exhausted_allowance(self):
        self.send();self.run_child();self.run_child();self.run_child();self.send(200);self.unavailable(self.run_child(now=201,generation=2));self.assertEqual(self.calls(),5)

    def test_lock_contention_refuses_promptly_without_provider_work(self):
        import fcntl
        with (self.root/'lock').open('r+b') as locked:
            fcntl.flock(locked.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
            self.unavailable(self.run_child('send',100));self.assertEqual(self.calls(),0)
        self.send();self.assertEqual(self.calls(),1)

    def test_an_uncertain_late_outcome_does_not_automatically_unlock_a_hold(self):
        self.send();args=self.args();self.child('run',**args,result=dict(outcome='uncertain',cleanup_verified=True))
        self.unavailable(self.child('finish',operation_id=args['operation_id'],outcome='completed',cleanup_verified=True))
        self.unavailable(self.run_child(now=102));self.assertEqual(self.calls(),2)

    def test_late_confirmed_completion_never_refunds_a_reserved_guess(self):
        self.send();args=self.args();self.assertEqual(self.child('reserve',**args).returncode,0)
        self.unavailable(self.run_child(now=102))
        self.assertEqual(self.child('finish',operation_id=args['operation_id'],outcome='rejected',cleanup_verified=True).returncode,0)
        self.run_child(now=102);self.run_child(now=102);self.unavailable(self.run_child(now=102))
        self.assertEqual(sum(x['kind']=='verify' for x in self.state()['records']),3)

    def test_corrupt_or_missing_checkpoint_prevents_every_callback(self):
        self.send();(self.root/'checkpoint.json').write_bytes(b'[]');self.unavailable(self.run_child());self.assertEqual(self.calls(),1)

    def test_coordinated_valid_rollback_is_an_explicit_local_model_limit(self):
        self.send();old={name:(self.root/name).read_bytes() for name in ('ledger.json','checkpoint.json')};self.run_child()
        for name,data in old.items():(self.root/name).write_bytes(data)
        # No independent monotonic authority exists in this fixture. Do not claim this attack is detected.
        self.assertEqual(len(self.state()['records']),1)

    def test_invalid_fixture_policies_do_not_create_state(self):
        for changes in [{'guesses':True},{'sends':0},{'total':129},{'expires':100},{'code_ttl':-1}]:
            with self.subTest(changes=changes),tempfile.TemporaryDirectory() as tmp:
                with self.assertRaises(m.RecoveryHeld):m.prepare(Path(tmp),{**self.policy,**changes},100)
                self.assertEqual(list(Path(tmp).iterdir()),[])

    def test_canceled_callback_consumes_reservation_and_holds_after_restart(self):
        from concurrent.futures import CancelledError
        self.send()
        def cancel():raise CancelledError()
        self.assertEqual(m.run(self.root,self.expected,operation=cancel,**self.args()),{'status':'unavailable'})
        self.unavailable(self.run_child(now=102));self.assertEqual(self.calls(),1)
        self.assertEqual([x['state'] for x in self.state()['records']],['completed','held'])

    def test_reservation_write_failure_blocks_callback_and_next_process(self):
        from unittest.mock import patch
        calls=[];original=m.durable_create
        def failing(path,data):
            if path.name=='ledger.next':raise OSError('synthetic disk full')
            return original(path,data)
        with patch.object(m,'durable_create',failing):
            result=m.run(self.root,self.expected,operation=lambda:calls.append(True),**self.args('send',100))
        self.assertEqual(result,{'status':'unavailable'});self.assertEqual(calls,[])
        self.unavailable(self.run_child('send',100));self.assertTrue((self.root/'pending').exists());self.assertEqual(self.calls(),0)

    def test_completion_write_failure_never_reports_success_or_unlocks(self):
        from unittest.mock import patch
        original=m.durable_create;checkpoints=0;calls=[]
        def failing(path,data):
            nonlocal checkpoints
            if path.name=='checkpoint.next':
                checkpoints+=1
                if checkpoints==2:raise OSError('synthetic disk full')
            return original(path,data)
        def operation():calls.append(True);return dict(outcome='completed',cleanup_verified=True)
        with patch.object(m,'durable_create',failing):
            result=m.run(self.root,self.expected,operation=operation,**self.args('send',100))
        self.assertEqual(result,{'status':'unavailable'});self.assertEqual(calls,[True])
        self.unavailable(self.run_child('send',110));self.assertTrue((self.root/'pending').exists());self.assertEqual(self.calls(),0)

if __name__=='__main__':unittest.main()
