"""Synthetic control invariants. Real transaction/signing composition is in Vitest."""
import hashlib
import json
import sqlite3
import unittest
import test_local_cvi_receipt_witness as receipt_tests
from local_cvi_transaction import connection
import local_cvi_writer_lease as leases

h=lambda n:hashlib.sha256(str(n).encode()).hexdigest()

class WriterLeaseTests(unittest.TestCase):
    def setUp(self):
        receipt_tests.ReceiptWitnessTests.setUp(self)
        with connection(self.root) as db:
            state=json.loads(db.execute('SELECT payload FROM history').fetchone()[0]);state['expiresAt']=10000;db.execute('UPDATE history SET payload=?',(json.dumps(state),));db.commit()
        leases.bootstrap(self.root);self.rotator=dict(role='rotator',principalDigest=h(1));self.fencer=dict(role='fencer',principalDigest=h(2));self.owner=h(3)
    def activate(self,previous=0,**patch):return leases.activate(self.root,self.rotator,previous,self.owner,patch.pop('boot',h(previous+100)),patch.pop('now',1000),**patch)
    def validate(self,lease,now=1000,owner=None):
        with connection(self.root) as db:return leases.assert_writer(db,lease,owner or self.owner,now)
    def test_initial_state_is_fenced(self):
        with connection(self.root) as db:self.assertEqual(leases.gate(db,1000)['state'],'fenced')
    def test_current_lease_validates_after_new_connection(self):
        l=self.activate();self.assertEqual(self.validate(l)['generation'],1)
    def test_restart_generation_retires_old_boot(self):
        old=self.activate();new=self.activate(1)
        with self.assertRaises(ValueError):self.validate(old)
        self.assertEqual(self.validate(new)['generation'],2)
        with connection(self.root) as db:self.assertEqual(db.execute('SELECT state FROM writer_grants ORDER BY generation').fetchall(),[('retired',),('active',)])
    def test_stale_previous_generation_cannot_activate(self):
        self.activate()
        with self.assertRaises(ValueError):self.activate()
    def test_boot_cannot_be_reused(self):
        old=self.activate()
        with self.assertRaises(ValueError):self.activate(1,boot=old['bootDigest'])
    def test_non_rotator_cannot_activate(self):
        with self.assertRaises(ValueError):leases.activate(self.root,self.fencer,0,self.owner,h(10),1000)
    def test_non_fencer_cannot_fence(self):
        self.activate()
        with self.assertRaises(ValueError):leases.fence(self.root,self.rotator,1,1000)
    def test_fence_invalidates_active_lease(self):
        old=self.activate();barrier=leases.fence(self.root,self.fencer,1,1000)
        with self.assertRaises(ValueError):self.validate(old)
        with connection(self.root) as db:leases.assert_barrier(db,barrier,1000)
    def test_old_barrier_invalidated_by_new_activation(self):
        self.activate();barrier=leases.fence(self.root,self.fencer,1,1000);self.activate(1)
        with connection(self.root) as db,self.assertRaises(ValueError):leases.assert_barrier(db,barrier,1000)
    def test_wrong_fence_generation_refused(self):
        self.activate()
        with self.assertRaises(ValueError):leases.fence(self.root,self.fencer,0,1000)
    def test_duplicate_fence_refused(self):
        self.activate();leases.fence(self.root,self.fencer,1,1000)
        with self.assertRaises(ValueError):leases.fence(self.root,self.fencer,1,1000)
    def test_expired_lease_refused(self):
        l=self.activate()
        with self.assertRaises(ValueError):self.validate(l,2000)
    def test_expired_lease_can_still_be_fenced(self):
        self.activate();self.assertEqual(leases.fence(self.root,self.fencer,1,2000)['state'],'fenced')
    def test_wrong_owner_refused(self):
        l=self.activate()
        with self.assertRaises(ValueError):self.validate(l,owner=h(99))
    def test_token_substitution_refused(self):
        l=self.activate()
        with self.assertRaises(ValueError):self.validate(dict(l,token=h(99)))
    def test_boot_substitution_refused(self):
        l=self.activate()
        with self.assertRaises(ValueError):self.validate(dict(l,bootDigest=h(99)))
    def test_store_substitution_refused(self):
        l=self.activate()
        with self.assertRaises(ValueError):self.validate(dict(l,storeId='foreign'))
    def test_policy_substitution_refused(self):
        l=self.activate()
        with self.assertRaises(ValueError):self.validate(dict(l,policyDigest=h(99)))
    def test_boolean_generation_cannot_substitute_for_one(self):
        l=self.activate()
        with self.assertRaises(ValueError):self.validate(dict(l,generation=True))
    def test_declared_expiry_cannot_extend_grant(self):
        l=self.activate()
        with self.assertRaises(ValueError):self.validate(dict(l,expiresAt=3000))
    def test_future_issue_time_refused(self):
        l=self.activate()
        with self.assertRaises(ValueError):self.validate(l,999)
    def test_clock_rollback_after_fence_refused(self):
        self.activate();leases.fence(self.root,self.fencer,1,1100)
        with self.assertRaises(ValueError):self.activate(1)
    def test_boolean_clock_refused(self):
        with self.assertRaises(ValueError):self.activate(now=True)
    def test_existing_gate_cannot_be_rebootstrapped(self):
        self.activate()
        with self.assertRaises(sqlite3.Error):leases.bootstrap(self.root)
        with connection(self.root) as db:self.assertEqual(leases.gate(db,1000)['generation'],1)
    def test_gate_cannot_issue_past_domain_expiry(self):
        with self.assertRaises(ValueError):self.activate(now=10000)
    def test_generation_capacity_is_not_refunded(self):
        for previous in range(128):self.activate(previous)
        with self.assertRaises(ValueError):self.activate(128)
        with connection(self.root) as db:self.assertEqual(db.execute('SELECT count(*) FROM writer_grants').fetchone()[0],128)
