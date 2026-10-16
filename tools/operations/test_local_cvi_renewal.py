"""Synthetic native renewal invariants. No credentials or hosted operations."""
import unittest
from unittest.mock import patch
import test_local_cvi_writer_lease as fixtures
import local_cvi_writer_lease as leases
from local_cvi_transaction import connection

class RenewalTests(unittest.TestCase):
    def setUp(self):fixtures.WriterLeaseTests.setUp(self)
    def activate(self,ttl=1000):return leases.activate(self.root,self.rotator,0,self.owner,'a'*64,1000,ttl)
    def valid(self,lease,now):
        with connection(self.root) as db:return leases.assert_writer(db,lease,self.owner,now)
    def renew(self,lease,now=1500,ttl=8000):return leases.renew(self.root,self.rotator,lease,ttl,lambda:now)
    def test_rotates_token_and_keeps_owner_generation_boot(self):
        old=self.activate();new=self.renew(old)
        self.assertNotEqual(old['token'],new['token']);self.assertEqual(new['generation'],old['generation']);self.assertEqual(new['bootDigest'],old['bootDigest']);self.assertEqual(new['ownerDigest'],self.owner)
        self.assertEqual(new['expiresAt'],9500);self.valid(new,1500)
        with self.assertRaises(ValueError):self.valid(old,1500)
    def test_old_token_cannot_renew_again(self):
        old=self.activate();self.renew(old)
        with self.assertRaises(ValueError):self.renew(old)
    def test_expired_owner_cannot_renew(self):
        old=self.activate()
        with self.assertRaises(ValueError):self.renew(old,2000)
    def test_fenced_owner_cannot_renew(self):
        old=self.activate();leases.fence(self.root,self.fencer,1,1500)
        with self.assertRaises(ValueError):self.renew(old)
    def test_replaced_owner_cannot_renew(self):
        old=self.activate();leases.activate(self.root,self.rotator,1,self.owner,'b'*64,1500)
        with self.assertRaises(ValueError):self.renew(old)
    def test_other_roles_cannot_renew(self):
        old=self.activate()
        with self.assertRaises(ValueError):leases.renew(self.root,self.fencer,old,8000,lambda:1500)
        self.valid(old,1500)
    def test_invalid_durations_leave_original_valid(self):
        old=self.activate()
        for ttl in [0,8001,True,1.5]:
            with self.subTest(ttl=ttl),self.assertRaises(ValueError):self.renew(old,ttl=ttl)
        self.valid(old,1500)
    def test_new_token_cannot_equal_old_token(self):
        old=self.activate()
        with patch.object(leases.secrets,'token_hex',lambda n:old['token']),self.assertRaises(ValueError):self.renew(old)
        self.valid(old,1500)
    def test_cannot_shorten_or_repeat_original_expiry(self):
        old=self.activate()
        for ttl in [499,500]:
            with self.subTest(ttl=ttl),self.assertRaises(ValueError):self.renew(old,ttl=ttl)
        self.valid(old,1500)
    def test_fixed_domain_cap_cannot_slide(self):
        old=self.activate(ttl=8000);new=self.renew(old,8500)
        self.assertEqual(new['expiresAt'],10000);self.valid(new,9999)
        with self.assertRaises(ValueError):self.renew(new,9999)
        with self.assertRaises(ValueError):self.valid(new,10000)
    def test_expiry_during_locked_work_rolls_back(self):
        old=self.activate();times=iter([1500,2000])
        with self.assertRaises(ValueError):leases.renew(self.root,self.rotator,old,8000,lambda:next(times))
        self.valid(old,1500)
    def test_clock_reversal_during_work_rolls_back(self):
        old=self.activate();times=iter([1500,1499])
        with self.assertRaises(ValueError):leases.renew(self.root,self.rotator,old,8000,lambda:next(times))
        self.valid(old,1500)
    def test_fresh_connection_preserves_rotated_hash_and_expiry(self):
        old=self.activate();new=self.renew(old)
        self.valid(new,9000)
        with self.assertRaises(ValueError):self.valid(old,1900)
        with connection(self.root) as db:self.assertEqual(db.execute('SELECT count(*) FROM writer_grants').fetchone()[0],1)
    def test_substituted_original_lease_never_changes_grant(self):
        old=self.activate()
        for field,value in [('token','f'*64),('ownerDigest','f'*64),('bootDigest','f'*64),('storeId','foreign'),('policyDigest','f'*64),('generation',2),('issuedAt',1001),('expiresAt',3000),('extra',True)]:
            with self.subTest(field=field),self.assertRaises(ValueError):self.renew(dict(old,**{field:value}))
        self.valid(old,1500)
