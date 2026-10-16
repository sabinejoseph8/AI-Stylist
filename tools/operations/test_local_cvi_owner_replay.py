"""Structural/locking tests with fake crypto; real signed proofs are in Vitest."""
import json
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import test_local_cvi_writer_lease as lease_tests
import local_cvi_owner_replay as guarded
import local_cvi_writer_lease as leases
import local_cvi_replay as replay
from local_cvi_transaction import connection

class OwnerReplayTests(unittest.TestCase):
    def setUp(self):
        lease_tests.WriterLeaseTests.setUp(self)
        self.lease=leases.activate(self.root,self.rotator,0,self.owner,lease_tests.h(100),1000,8000)
        self.replay_root=Path(self.temp.name)/'replay';self.replay_root.mkdir(mode=0o700)
        self.store=replay.prepare(self.replay_root,'a'*64,10000,1000)
        self.config=dict(nativeRoot=str(self.root),lease=self.lease,ownerDigest=self.owner,authorityPin={},readerPrincipal='b'*64,minimumRevision=2,replayStoreId=self.store,bindingDigest='a'*64,node='fake-node',verifier='fake-verifier')
        self.time=1000;self.calls=[]
        self.patch=patch.object(guarded.subprocess,'run',return_value=SimpleNamespace(returncode=0,stdout='{"revision":2}'));self.verifier=self.patch.start();self.addCleanup(self.patch.stop)
    def request(self):return dict(storeId=self.store,bindingDigest='a'*64,requestDigest='c'*64,now=self.time)
    def rpc(self,m):self.calls.append(m);return dict(request=dict(issuedAt=1000,expiresAt=9000),reply={})
    def run_operation(self,mode='reserve',request=None,rpc=None,clock=None):return guarded.operate(self.replay_root,request or self.request(),mode,self.config,rpc or self.rpc,clock or (lambda:self.time))
    def rows(self):return json.loads((self.replay_root/'ledger.json').read_text())['records']
    def test_original_lease_reserves_and_consumes_with_fresh_checks_inside_locks(self):
        receipt=self.run_operation();self.assertEqual(len(self.calls),3);self.assertEqual(self.run_operation('consume',receipt)['status'],'spent');self.assertEqual(self.rows()[0]['status'],'spent')
        self.assertEqual(len({m['nonce'] for m in self.calls}),6)
    def test_later_renewal_invalidates_old_reserve(self):
        leases.renew(self.root,self.rotator,self.lease,8000,lambda:1500);self.time=1500
        with self.assertRaises(ValueError):self.run_operation()
        self.assertEqual(self.rows(),[]);self.assertEqual(self.calls,[])
    def test_later_renewal_invalidates_old_consume(self):
        receipt=self.run_operation();before=self.rows();leases.renew(self.root,self.rotator,self.lease,8000,lambda:1500);self.time=1500;receipt['now']=1500
        with self.assertRaises(ValueError):self.run_operation('consume',receipt)
        self.assertEqual(self.rows(),before)
    def test_fencing_invalidates_the_original_lease(self):
        leases.fence(self.root,self.fencer,self.lease['generation'],1000)
        with self.assertRaises(ValueError):self.run_operation()
        self.assertEqual(self.rows(),[])
    def test_other_native_writer_cannot_mutate_while_replay_is_checking(self):
        blocked=[]
        def rpc(m):
            try:leases.renew(self.root,self.rotator,self.lease,8000,lambda:1500)
            except Exception:blocked.append(True)
            else:blocked.append(False)
            return self.rpc(m)
        self.run_operation(rpc=rpc);self.assertEqual(blocked,[True]*3)
    def test_another_replay_writer_cannot_enter_while_native_proof_is_pending(self):
        blocked=[]
        def rpc(m):
            try:replay.operate(self.replay_root,{**self.request(),'requestDigest':'d'*64},'reserve')
            except Exception:blocked.append(True)
            else:blocked.append(False)
            return self.rpc(m)
        self.run_operation(rpc=rpc);self.assertEqual(blocked,[True]*3);self.assertEqual(len(self.rows()),1)
    def test_expired_native_lease_prevents_reservation(self):
        self.time=9000
        with self.assertRaises(ValueError):self.run_operation()
        self.assertEqual(self.rows(),[])
    def test_backward_time_during_proof_refuses_before_save(self):
        times=iter([1000,999])
        with self.assertRaises(ValueError):self.run_operation(clock=lambda:next(times))
        self.assertEqual(self.rows(),[])
    def test_expiry_while_public_key_verification_runs_refuses_before_save(self):
        times=iter([1000,1000,9000])
        with self.assertRaises(ValueError):self.run_operation(clock=lambda:next(times))
        self.assertEqual(self.rows(),[])
    def test_missing_or_rejected_verifier_has_no_raw_fallback(self):
        self.verifier.return_value=SimpleNamespace(returncode=2,stdout='')
        with self.assertRaises(ValueError):self.run_operation()
        self.assertEqual(self.rows(),[])
    def test_lower_revision_is_not_accepted(self):
        self.verifier.return_value=SimpleNamespace(returncode=0,stdout='{"revision":1}')
        with self.assertRaises(ValueError):self.run_operation()
        self.assertEqual(self.rows(),[])
    def test_wrong_scope_refuses_before_authority_reads(self):
        self.config['bindingDigest']='d'*64
        with self.assertRaises(ValueError):self.run_operation()
        self.assertEqual(self.calls,[])
    def test_unknown_result_after_saved_reservation_retains_pending_record(self):
        def rpc(m):
            if len(self.calls)==2:raise ValueError('Simulated lost final proof')
            return self.rpc(m)
        with self.assertRaises(ValueError):self.run_operation(rpc=rpc)
        self.assertEqual(self.rows()[0]['status'],'reserved')
        with self.assertRaises(ValueError):self.run_operation()
        self.assertEqual(len(self.rows()),1)
    def test_unknown_result_after_saved_consume_retains_spent_record(self):
        receipt=self.run_operation();self.calls=[]
        def rpc(m):
            if len(self.calls)==2:raise ValueError('Simulated lost final proof')
            return self.rpc(m)
        with self.assertRaises(ValueError):self.run_operation('consume',receipt,rpc=rpc)
        self.assertEqual(self.rows()[0]['status'],'spent')
    def test_expired_signed_reply_after_verification_refuses(self):
        with self.assertRaises(ValueError):self.run_operation(rpc=lambda m:dict(request=dict(issuedAt=1000,expiresAt=1000),reply={}))
        self.assertEqual(self.rows(),[])
    def test_native_metadata_is_never_changed_by_replay_mutation(self):
        with connection(self.root) as db:before=guarded.control_metadata(db,1000)
        self.run_operation()
        with connection(self.root) as db:self.assertEqual(guarded.control_metadata(db,1000),before)

    def test_original_configuration_is_captured_before_callback_mutation(self):
        def rpc(m):
            self.config['lease']['token']='d'*64
            self.config['authorityPin']={'replaced':True}
            return self.rpc(m)
        result=self.run_operation(rpc=rpc)
        self.assertEqual(result['status'],'reserved')
        payload=json.loads(self.verifier.call_args.kwargs['input'])
        self.assertEqual(payload['pin'],{})
    def test_original_request_digest_is_captured_before_callback_mutation(self):
        request=self.request()
        def rpc(m):request['requestDigest']='d'*64;return self.rpc(m)
        result=self.run_operation(request=request,rpc=rpc)
        self.assertEqual(result['requestDigest'],'c'*64);self.assertEqual(self.rows()[0]['requestDigest'],'c'*64)
    def test_reply_expiry_cannot_be_extended_during_verification(self):
        evidence=dict(request=dict(issuedAt=1000,expiresAt=1200),reply={});times=iter([1000,1000,1500])
        def checked(*a,**kw):evidence['request']['expiresAt']=8000;return SimpleNamespace(returncode=0,stdout='{"revision":2}')
        self.verifier.side_effect=checked
        with self.assertRaises(ValueError):self.run_operation(rpc=lambda m:evidence,clock=lambda:next(times,1500))
        self.assertEqual(self.rows(),[])
