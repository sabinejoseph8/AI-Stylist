"""Synthetic credential-generation authority tests, never live credentials."""
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import local_cvi_credentials as c

class CviCredentialTests(unittest.TestCase):
    def setUp(self):
        self.t=tempfile.TemporaryDirectory();self.addCleanup(self.t.cleanup);self.root=Path(self.t.name);self.scope='a'*64
        self.store=c.prepare(self.root,self.scope,10000,1000);self.lease=c.activate(self.root,self.store,self.scope,0,'b'*64,'c'*64,1000)
    def check(self,lease=None,now=1000):return c.check(self.root,{**(lease or self.lease),'now':now})
    def rotate(self,**kw):
        args=dict(store_id=self.store,scope_digest=self.scope,previous=1,binding_digest='d'*64,boot_digest='e'*64,now=1000);args.update(kw);return c.activate(self.root,**args)
    def test_rotation_retires_old_credential(self):
        new=self.rotate();self.assertTrue(self.check(new)['active'])
        with self.assertRaises(ValueError):self.check()
    def test_clock_observation_survives_restart_read(self):
        self.check(now=2000)
        with self.assertRaises(ValueError):self.check(now=1999)
    def test_expiry_and_bad_clock(self):
        for now in [999,10000,True,-1]:
            with self.subTest(now=now),self.assertRaises(ValueError):self.check(now=now)
    def test_compare_and_swap_does_not_reactivate_old_generation(self):
        self.rotate()
        with self.assertRaises(ValueError):self.rotate(binding_digest='f'*64,boot_digest='0'*64)
    def test_reject_reused_binding_or_boot(self):
        for kwargs in [dict(binding_digest='b'*64),dict(boot_digest='c'*64)]:
            with self.assertRaises(ValueError):self.rotate(**kwargs)
    def test_no_expiry_extension_input(self):
        with self.assertRaises(ValueError):c.check(self.root,{**self.lease,'now':1000,'expires':20000})
    def test_substitution_refused(self):
        for key,value in [('storeId','foreign'),('scopeDigest','f'*64),('bindingDigest','f'*64),('bootDigest','f'*64),('generation',2)]:
            with self.subTest(key=key),self.assertRaises(ValueError):self.check({**self.lease,key:value})
    def test_generation_bool_refused(self):
        with self.assertRaises(ValueError):self.check({**self.lease,'generation':True})
    def test_generation_history_is_bounded(self):
        for i in range(1,16):c.activate(self.root,self.store,self.scope,i,f'{i:064x}',f'{i+100:064x}',1000)
        with self.assertRaises(ValueError):c.activate(self.root,self.store,self.scope,16,'f'*64,'e'*64,1000)
    def test_missing_history_is_not_reseeded(self):
        (self.root/'ledger.json').unlink()
        with self.assertRaises(ValueError):self.check()
        with self.assertRaises(ValueError):c.prepare(self.root,self.scope,10000,1000)
    def test_write_failure_leaves_uncertain_history_blocked(self):
        with patch('local_recovery_abuse.os.replace',side_effect=OSError('fixture')):
            with self.assertRaises(ValueError):self.rotate()
        self.assertTrue((self.root/'pending').exists())
        with self.assertRaises(ValueError):self.check()
    def test_observed_clock_write_failure_refuses_authority(self):
        with patch('local_recovery_abuse.os.replace',side_effect=OSError('fixture')):
            with self.assertRaises(ValueError):self.check(now=2000)
        with self.assertRaises(ValueError):self.check()
    def test_wrong_scope_cannot_rotate(self):
        with self.assertRaises(ValueError):self.rotate(scope_digest='f'*64)
    def test_preparation_cannot_overwrite_history(self):
        with self.assertRaises(ValueError):c.prepare(self.root,self.scope,10000,1000)
    def test_rotation_preserves_retired_records(self):
        self.rotate()
        with c.locked(self.root) as root:s=c.load(root,self.store)
        self.assertEqual([r['active'] for r in s['generations']],[False,True]);self.assertEqual(s['expires'],10000)

if __name__=='__main__':unittest.main()
