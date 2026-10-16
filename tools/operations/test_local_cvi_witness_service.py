"""Durable service journal tests. Auth keys/proofs are tested in TypeScript."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from local_recovery_abuse import encoded
import local_cvi_witness_service as service

h=lambda n:hashlib.sha256(str(n).encode()).hexdigest()

class WitnessServiceTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
        self.pin=dict(authorityId='fixture-authority-service',witnessId='11111111-1111-4111-8111-111111111111',storeId='22222222-2222-4222-8222-222222222222',policyDigest=h(1))
        self.current=dict(storeId=self.pin['storeId'],policyDigest=h(1),epochFloor=0,headFloor=h(2),observedClock=1000,historyDigest=h(3));self.target=dict(self.current,epochFloor=1,headFloor=h(4),historyDigest=h(5))
        self.writer=dict(principalDigest=h(10),role='writer');self.reconciler=dict(principalDigest=h(11),role='reconciler');self.n=100
        service.prepare(self.root,self.pin,self.current,1000)
    def op(self,actor,mode,args,now=1000,crash=None):return service.operate(self.root,self.pin,actor,mode,args,now,crash)
    def inspect(self):return self.op(self.writer,'inspect',{})
    def ticket(self,actor=None,action='advance',operation=None,revision=0,**patch):
        self.n+=1;args=dict(id=h(self.n),challenge=h(self.n+1000),action=action,operationId=operation or h(20),expectedRevision=revision,issuedAt=1000,expiresAt=3000);args.update(patch)
        return self.op(actor or self.writer,'admit',args)['token']
    def advance(self,**patch):
        token=self.ticket();return self.op(self.writer,'advance',dict(token=token,**{'from':self.current},to=dict(self.target,**patch)))
    def recovery(self,**patch):
        token=self.ticket(self.reconciler,'reconcile',revision=1)
        return self.op(self.reconciler,'reconcile',dict(token=token,targetDigest=service.digest(self.target),ownerDigest=self.writer['principalDigest'],revision=1,validUntil=2000,**patch))
    def test_advance_preserves_target_until_reconciled(self):
        self.assertEqual(self.advance()['status'],'advanced');self.assertEqual(self.recovery()['status'],'reconciled');s=self.inspect();self.assertEqual(s['current'],self.target);self.assertIsNone(s['pending']);self.assertEqual(s['revision'],2)
    def test_observer_cannot_admit_advance(self):
        with self.assertRaises(ValueError):self.ticket(dict(self.writer,role='observer'))
    def test_signer_cannot_admit_advance(self):
        with self.assertRaises(ValueError):self.ticket(dict(self.writer,role='signer'))
    def test_writer_cannot_admit_reconcile(self):
        with self.assertRaises(ValueError):self.ticket(action='reconcile')
    def test_claimed_role_cannot_replace_ticket_owner(self):
        token=self.ticket()
        with self.assertRaises(ValueError):self.op(dict(self.writer,role='reconciler'),'advance',dict(token=token,**{'from':self.current},to=self.target))
    def test_cross_principal_cannot_use_ticket(self):
        token=self.ticket()
        with self.assertRaises(ValueError):self.op(dict(self.writer,principalDigest=h(99)),'advance',dict(token=token,**{'from':self.current},to=self.target))
    def test_ticket_use_is_permanent(self):
        token=self.ticket();args=dict(token=token,**{'from':self.current},to=self.target);self.op(self.writer,'advance',args)
        with self.assertRaises(ValueError):self.op(self.writer,'advance',args)
    def test_new_nonce_cannot_repeat_admitted_advance_operation(self):
        self.ticket()
        with self.assertRaises(ValueError):self.ticket()
    def test_arbitrary_admission_fields_refused(self):
        with self.assertRaises(ValueError):self.ticket(role='reconciler')
    def test_epoch_floor_regression_is_held_and_ticket_spent(self):
        self.assertEqual(self.advance(epochFloor=0,headFloor=h(99))['status'],'held');self.assertEqual(self.inspect()['current'],self.current);self.assertEqual(self.inspect()['requests'][0]['state'],'used')
    def test_observed_time_cannot_regress(self):
        self.assertEqual(self.advance(observedClock=999)['status'],'held')
    def test_future_observed_time_cannot_be_accepted(self):
        self.assertEqual(self.advance(observedClock=1001)['status'],'held')
    def test_policy_cannot_be_replaced(self):
        self.assertEqual(self.advance(policyDigest=h(99))['status'],'held')
    def test_pending_split_blocks_another_advance(self):
        self.advance();token=self.ticket(operation=h(21),revision=1);self.assertEqual(self.op(self.writer,'advance',dict(token=token,**{'from':self.target},to=dict(self.target,epochFloor=2,historyDigest=h(9))))['status'],'held');self.assertEqual(self.inspect()['revision'],1)
    def test_wrong_recovery_target_is_held(self):
        self.advance();token=self.ticket(self.reconciler,'reconcile',revision=1);self.assertEqual(self.op(self.reconciler,'reconcile',dict(token=token,targetDigest=h(99),ownerDigest=self.writer['principalDigest'],revision=1,validUntil=2000))['status'],'held');self.assertEqual(self.inspect()['pending'],h(20))
    def test_wrong_recovery_owner_is_held(self):
        self.advance();token=self.ticket(self.reconciler,'reconcile',revision=1);self.assertEqual(self.op(self.reconciler,'reconcile',dict(token=token,targetDigest=service.digest(self.target),ownerDigest=h(99),revision=1,validUntil=2000))['status'],'held')
        token=self.ticket(self.reconciler,'reconcile',revision=1)
        self.assertEqual(self.op(self.reconciler,'reconcile',dict(token=token,targetDigest=service.digest(self.target),ownerDigest=self.writer['principalDigest'],revision=True,validUntil=2000))['status'],'held')
    def test_completed_recovery_cannot_repeat(self):
        self.advance();self.recovery();token=self.ticket(self.reconciler,'reconcile',revision=2);self.assertEqual(self.op(self.reconciler,'reconcile',dict(token=token,targetDigest=service.digest(self.target),ownerDigest=self.writer['principalDigest'],revision=2,validUntil=2000))['status'],'held');self.assertEqual(self.inspect()['revision'],2)
    def test_scope_substitution_refused(self):
        with self.assertRaises(ValueError):service.operate(self.root,dict(self.pin,storeId='foreign'),self.writer,'inspect',{},1000)
    def test_lost_commit_reply_does_not_refund(self):
        token=self.ticket()
        with self.assertRaises(ValueError):self.op(self.writer,'advance',dict(token=token,**{'from':self.current},to=self.target),crash='after-save')
        self.assertEqual(self.inspect()['current'],self.target)
        with self.assertRaises(ValueError):self.ticket()
    def test_failure_before_commit_keeps_admission_consumed(self):
        token=self.ticket()
        with self.assertRaises(ValueError):self.op(self.writer,'advance',dict(token=token,**{'from':self.current},to=self.target),crash='before-save')
        self.assertEqual(self.inspect()['current'],self.current)
        with self.assertRaises(ValueError):self.ticket()
    def test_existing_service_cannot_rebootstrap(self):
        with self.assertRaises(ValueError):service.prepare(self.root,self.pin,self.current,1000)
    def test_missing_journal_not_reseeded(self):
        (self.root/'ledger.json').unlink()
        with self.assertRaises(ValueError):self.inspect()
        self.assertFalse((self.root/'ledger.json').exists())
    def test_clock_regression_refused_after_restart(self):
        token=self.ticket(action='read');self.op(self.writer,'read',dict(token=token),1100)
        with self.assertRaises(ValueError):self.op(self.writer,'inspect',{},1000)
    def test_invalid_revision_with_recomputed_checksum_refused(self):
        s=self.inspect();s['revision']=True;data=encoded(s);(self.root/'ledger.json').write_bytes(data);(self.root/'checkpoint.json').write_bytes(encoded(dict(sha256=hashlib.sha256(data).hexdigest())))
        with self.assertRaises(ValueError):self.inspect()

    def test_expired_admission_cannot_commit(self):
        token=self.ticket()
        with self.assertRaises(ValueError):self.op(self.writer,'advance',dict(token=token,**{'from':self.current},to=self.target),3000)
        self.assertEqual(self.inspect()['current'],self.current)
    def test_expired_proof_cannot_clear_pending_at_atomic_commit(self):
        self.advance();token=self.ticket(self.reconciler,'reconcile',revision=1)
        self.assertEqual(self.op(self.reconciler,'reconcile',dict(token=token,targetDigest=service.digest(self.target),ownerDigest=self.writer['principalDigest'],revision=1,validUntil=1000))['status'],'held')
        self.assertEqual(self.inspect()['pending'],h(20))
    def test_execution_claim_is_permanent_while_operation_is_prepared(self):
        self.advance();args=dict(operationId=h(20),revision=1,challenge=h(800),issuedAt=1000,expiresAt=2000)
        self.assertEqual(self.op(self.writer,'claim-execution',args)['status'],'execution-claimed')
        with self.assertRaises(ValueError):self.op(self.writer,'claim-execution',dict(args,challenge=h(801)))
        self.assertEqual(self.inspect()['pending'],h(20))
    def test_execution_claim_bound_to_original_owner(self):
        self.advance();args=dict(operationId=h(20),revision=1,challenge=h(800),issuedAt=1000,expiresAt=2000)
        with self.assertRaises(ValueError):self.op(dict(self.writer,principalDigest=h(99)),'claim-execution',args)
    def test_lost_execution_claim_reply_does_not_reset_permission(self):
        self.advance();args=dict(operationId=h(20),revision=1,challenge=h(800),issuedAt=1000,expiresAt=2000)
        with self.assertRaises(ValueError):self.op(self.writer,'claim-execution',args,crash='after-save')
        with self.assertRaises(ValueError):self.op(self.writer,'claim-execution',dict(args,challenge=h(801)))
