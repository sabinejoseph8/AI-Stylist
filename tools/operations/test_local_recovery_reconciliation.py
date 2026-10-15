"""Independent fixture keys, disposable journals and fresh reconciliation processes only."""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
import hashlib
import hmac
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import uuid
import local_recovery_abuse as ledger
import local_recovery_reconciliation as model

CHILD='''
import json,sys
import local_recovery_reconciliation as m
x=json.load(sys.stdin)
for name in ('fence_key','cleanup_key'):x[name]=bytes.fromhex(x[name])
try:print(json.dumps(m.reconcile(**x)))
except Exception:print('{"status":"unavailable"}');sys.exit(2)
'''

class ReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='stylist-reconciliation-');self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)
        self.expected=ledger.prepare(self.root,dict(guesses=3,sends=5,total=12,resend_interval=10,code_ttl=100,expires=1000),100)
        self.fence_key=os.urandom(32);self.cleanup_key=os.urandom(32);self.epoch=1
        self.send(100);self.operation=self.reserve(101)

    def reserve(self,now,generation=1,kind='verify'):
        operation='fixture-operation-'+uuid.uuid4().hex
        ledger.reserve(self.root,self.expected,subject='fixture-subject-a',kind=kind,generation=None if kind=='send' else generation,now=now,operation_id=operation)
        return operation

    def send(self,now):
        operation=self.reserve(now,kind='send');ledger.finish(self.root,self.expected,operation,outcome='completed',cleanup_verified=True)

    def sign(self,body,key):return dict(body=body,signature=hmac.new(key,ledger.encoded(body),hashlib.sha256).hexdigest())

    def proofs(self,operation=None,now=102,epoch=None):
        operation=operation or self.operation;epoch=epoch or self.epoch
        base=model.challenge(self.root,self.expected,operation)
        common=dict(base,version=1,issued_at=now,expires_at=now+10,fence_epoch=epoch)
        fence=self.sign(dict(common,role='fence',evidence_id='fixture-evidence-'+uuid.uuid4().hex,worker_fenced=True,capabilities_retired=True),self.fence_key)
        cleanup=self.sign(dict(common,role='cleanup',evidence_id='fixture-evidence-'+uuid.uuid4().hex,provider_final=True,sessions_absent=True,all_correlated=True,fence_digest=model.digest(fence)),self.cleanup_key)
        return fence,cleanup

    def options(self,fence=None,cleanup=None,**extra):
        if fence is None:fence,cleanup=self.proofs()
        return dict(root=self.root,expected=self.expected,operation_id=self.operation,fence=fence,cleanup=cleanup,
                    fence_key=self.fence_key,cleanup_key=self.cleanup_key,fence_epoch=self.epoch,now=102,max_age=30,**extra)

    def child(self,options):
        x=dict(options,root=str(options['root']),fence_key=options['fence_key'].hex(),cleanup_key=options['cleanup_key'].hex())
        return subprocess.run([sys.executable,'-c',CHILD],input=json.dumps(x),text=True,capture_output=True,timeout=10,cwd=Path(__file__).resolve().parent)

    def reconcile(self,**extra):return model.reconcile(**{**self.options(),**extra})

    def blocked(self,options):
        before=(self.root/'ledger.json').read_bytes();result=self.child(options)
        self.assertEqual(result.returncode,2);self.assertEqual(json.loads(result.stdout),{'status':'unavailable'});self.assertEqual((self.root/'ledger.json').read_bytes(),before)

    def test_matching_independent_witnesses_retire_in_fresh_process_without_refunding(self):
        before=ledger.inspect(self.root,self.expected);result=self.child(self.options());self.assertEqual(result.returncode,0)
        after=ledger.inspect(self.root,self.expected);self.assertEqual(len(before['records']),len(after['records']))
        self.assertEqual(after['records'][-1]['state'],'retired');self.assertNotIn('resetComplete',result.stdout)
        self.assertEqual(after['records'][-1]['retirement']['previous_state'],'reserved')

    def test_resetting_and_held_states_can_retire_with_fresh_correlated_evidence(self):
        ledger.claim_reset(self.root,self.expected,self.operation,now=101);self.assertEqual(self.reconcile()['status'],'retired')
        self.send(110);self.operation=self.reserve(111,2);ledger.finish(self.root,self.expected,self.operation,outcome='uncertain',cleanup_verified=False);self.epoch=2
        f,c=self.proofs(now=112);options=self.options(f,c);options['now']=112;self.assertEqual(model.reconcile(**options)['status'],'retired')

    def test_no_witness_does_not_release_unresolved_work(self):
        options=self.options();options['cleanup']={};self.blocked(options)
        with self.assertRaises(ledger.RecoveryHeld):self.reserve(103)

    def test_tampered_signature_and_wrong_authority_are_refused(self):
        for name in ('fence','cleanup'):
            options=self.options();options[name]['signature']='0'*64;self.blocked(options)
        options=self.options();options['fence_key']=self.cleanup_key;self.blocked(options)

    def test_same_key_for_two_roles_is_not_independent(self):
        options=self.options();options['cleanup_key']=self.fence_key;self.blocked(options)

    def test_unsigned_claims_and_extra_fields_are_refused(self):
        options=self.options();options['cleanup']['body']['extra']=True;self.blocked(options)
        options=self.options();options['fence']['body']['worker_fenced']='true';options['fence']=self.sign(options['fence']['body'],self.fence_key);self.blocked(options)

    def test_unknown_or_false_cleanup_and_fencing_facts_never_release(self):
        for role,key,fields in [('fence',self.fence_key,['worker_fenced','capabilities_retired']),('cleanup',self.cleanup_key,['provider_final','sessions_absent','all_correlated'])]:
            for field in fields:
                for value in [False,None,1,'unknown']:
                    options=self.options();options[role]['body'][field]=value;options[role]=self.sign(options[role]['body'],key);self.blocked(options)

    def test_other_store_policy_operation_subject_or_generation_is_refused(self):
        for field,value in [('store_id',str(uuid.uuid4())),('policy_digest','0'*64),('operation_id','fixture-operation-'+'f'*32),('subject','fixture-subject-b'),('generation',2)]:
            options=self.options();options['cleanup']['body'][field]=value;options['cleanup']=self.sign(options['cleanup']['body'],self.cleanup_key);self.blocked(options)

    def test_expired_future_or_overlong_witnesses_are_refused(self):
        for changes in [dict(issued_at=103,expires_at=113),dict(expires_at=102),dict(expires_at=500)]:
            options=self.options();options['cleanup']['body'].update(changes);options['cleanup']=self.sign(options['cleanup']['body'],self.cleanup_key);self.blocked(options)

    def test_cleanup_must_follow_and_bind_the_exact_fence_witness(self):
        for change in [dict(fence_digest='0'*64),dict(issued_at=101)]:
            options=self.options();options['cleanup']['body'].update(change);options['cleanup']=self.sign(options['cleanup']['body'],self.cleanup_key);self.blocked(options)

    def test_external_epoch_must_match_and_may_not_be_taken_from_the_witness(self):
        for epoch in [0,True,2]:
            options=self.options();options['fence_epoch']=epoch;self.blocked(options)

    def test_snapshot_change_while_collecting_evidence_requires_new_witnesses(self):
        options=self.options();ledger.claim_reset(self.root,self.expected,self.operation,now=101);self.blocked(options)

    def test_witness_replay_cannot_retire_twice_or_reopen_the_record(self):
        options=self.options();model.reconcile(**options);self.blocked(options)
        with self.assertRaises(ledger.RecoveryHeld):ledger.claim_reset(self.root,self.expected,self.operation,now=103)
        with self.assertRaises(ledger.RecoveryHeld):ledger.finish(self.root,self.expected,self.operation,outcome='completed',cleanup_verified=True)

    def test_old_generation_and_operation_id_remain_retired_after_reconciliation(self):
        self.reconcile()
        with self.assertRaises(ledger.RecoveryHeld):self.reserve(103,1)
        with self.assertRaises(ledger.RecoveryHeld):ledger.reserve(self.root,self.expected,subject='fixture-subject-a',kind='send',generation=None,now=110,operation_id=self.operation)
        self.send(110);new=self.reserve(111,2);self.assertNotEqual(new,self.operation)

    def test_guess_allowance_is_not_refunded_across_multiple_retirements(self):
        for generation in range(1,4):
            if generation>1:self.send(100+generation*10);self.operation=self.reserve(101+generation*10,generation)
            self.epoch=generation;f,c=self.proofs(now=102+generation*10)
            options=self.options(f,c);options['now']=102+generation*10;model.reconcile(**options)
        self.send(150)
        with self.assertRaises(ledger.RecoveryHeld):self.reserve(151,4)
        self.assertEqual(sum(x['kind']=='verify' for x in ledger.inspect(self.root,self.expected)['records']),3)

    def test_send_allowance_is_not_refunded_by_retirement(self):
        self.reconcile();self.send(110)
        for generation in range(3,6):
            self.operation=self.reserve(100+generation*10,kind='send');self.epoch=generation
            f,c=self.proofs(now=101+generation*10);options=self.options(f,c);options['now']=101+generation*10;model.reconcile(**options)
        with self.assertRaises(ledger.RecoveryHeld):self.reserve(170,kind='send')

    def test_counter_policy_and_expiry_are_not_extended(self):
        f,c=self.proofs(now=1001);options=self.options(f,c);options['now']=1001;self.assertEqual(model.reconcile(**options)['status'],'retired')
        with self.assertRaises(ledger.RecoveryHeld):self.reserve(1002,kind='send')
        self.assertEqual(ledger.inspect(self.root,self.expected)['policy']['expires'],1000)

    def test_missing_and_damaged_state_cannot_be_repaired_by_reconciliation(self):
        options=self.options();(self.root/'ledger.json').unlink();result=self.child(options);self.assertEqual(result.returncode,2);self.assertFalse((self.root/'ledger.json').exists())

    def test_two_reconcilers_cannot_both_retire_the_same_operation(self):
        options=self.options()
        with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:self.child(options),range(2)))
        self.assertEqual(sum(x.returncode==0 for x in results),1);self.assertEqual(ledger.inspect(self.root,self.expected)['records'][-1]['state'],'retired')

    def test_interrupted_reconciliation_never_silently_unblocks(self):
        for stage in ['pending','ledger','checkpoint']:
            with self.subTest(stage=stage),tempfile.TemporaryDirectory() as tmp:
                original_root=self.root;original_expected=self.expected;self.root=Path(tmp)
                self.expected=ledger.prepare(self.root,dict(guesses=3,sends=5,total=12,resend_interval=10,code_ttl=100,expires=1000),100);self.send(100);self.operation=self.reserve(101)
                result=self.child(self.options(crash_at=stage));self.assertEqual(result.returncode,71)
                with self.assertRaises(ledger.RecoveryHeld):self.reserve(110,kind='send')
                self.assertTrue((self.root/'pending').exists());self.root=original_root;self.expected=original_expected

    def test_evidence_ids_and_epoch_cannot_be_reused_for_a_new_operation(self):
        first=self.options();model.reconcile(**first);self.send(110);self.operation=self.reserve(111,2)
        f,c=self.proofs(now=112,epoch=1);options=self.options(f,c);options['now']=112;self.blocked(options)
        self.epoch=2;f,c=self.proofs(now=112);f['body']['evidence_id']=first['fence']['body']['evidence_id'];f=self.sign(f['body'],self.fence_key);c['body']['fence_digest']=model.digest(f);c=self.sign(c['body'],self.cleanup_key)
        options=self.options(f,c);options['now']=112;self.blocked(options)

    def test_audit_receipt_contains_no_keys_or_authentication_material(self):
        self.reconcile();payload=(self.root/'ledger.json').read_text()
        for forbidden in [self.fence_key.hex(),self.cleanup_key.hex(),'password','access_token','session_cookie','signature']:
            self.assertNotIn(forbidden,payload)
        self.assertIn('evidence_digest',payload)

    def test_damaged_checkpoint_cannot_be_replaced_by_valid_witnesses(self):
        options=self.options();(self.root/'checkpoint.json').write_bytes(b'{}')
        result=self.child(options);self.assertEqual(result.returncode,2)
        self.assertEqual((self.root/'checkpoint.json').read_bytes(),b'{}')
        with self.assertRaises(ledger.RecoveryHeld):self.reserve(110,kind='send')

    def test_reconciliation_disk_failure_never_reports_retirement_or_unblocks(self):
        from unittest.mock import patch
        original=ledger.durable_create;options=self.options()
        def fail(path,data):
            if path.name=='ledger.next':raise OSError('synthetic disk full')
            return original(path,data)
        with patch.object(ledger,'durable_create',fail):
            with self.assertRaises(ledger.RecoveryHeld):model.reconcile(**options)
        self.assertTrue((self.root/'pending').exists())
        with self.assertRaises(ledger.RecoveryHeld):self.reserve(110,kind='send')

    def test_external_fence_epoch_refuses_old_proof_even_after_local_pair_rollback(self):
        options=self.options();before={name:(self.root/name).read_bytes() for name in ('ledger.json','checkpoint.json')}
        model.reconcile(**options)
        for name,data in before.items():(self.root/name).write_bytes(data)
        # External authority is assumed independently preserved; this is not complete rollback protection for admission.
        options['fence_epoch']=2;self.blocked(options)

if __name__=='__main__':unittest.main()
