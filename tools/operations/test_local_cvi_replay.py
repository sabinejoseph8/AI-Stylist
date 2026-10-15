"""Disposable file-store tests. No account, network or permanent ledger."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import local_cvi_replay as replay

class CviReplayTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)
        self.binding='a'*64;self.store=replay.prepare(self.root,self.binding,10000,1000,3)
    def request(self,n=1,now=1000):return dict(storeId=self.store,bindingDigest=self.binding,requestDigest=hashlib.sha256(str(n).encode()).hexdigest(),now=now)
    def reserve(self,n=1,now=1000):return replay.operate(self.root,self.request(n,now),'reserve')
    def test_spent_receipt_is_one_use(self):
        r=self.reserve();self.assertEqual(replay.operate(self.root,r,'consume')['status'],'spent')
        for mode,arg in [('consume',r),('reserve',self.request())]:
            with self.assertRaises(ValueError):replay.operate(self.root,arg,mode)
    def test_unresolved_never_refunds(self):
        self.reserve()
        with self.assertRaises(ValueError):self.reserve(2)
    def test_limit_survives_reads_and_clock_progress(self):
        for n in range(1,4):replay.operate(self.root,self.reserve(n,1000+n),'consume')
        with self.assertRaises(ValueError):self.reserve(4,2000)
    def test_binding_and_store_substitution(self):
        for k,v in [('bindingDigest','b'*64),('storeId','00000000-0000-4000-8000-000000000000')]:
            with self.subTest(k=k),self.assertRaises(ValueError):replay.operate(self.root,{**self.request(),k:v},'reserve')
    def test_receipt_and_request_substitution(self):
        r=self.reserve()
        for k,v in [('receipt','fixture-receipt-'+'0'*32),('requestDigest','c'*64),('bindingDigest','b'*64),('status','spent')]:
            with self.subTest(k=k),self.assertRaises(ValueError):replay.operate(self.root,{**r,k:v},'consume')
    def test_invalid_clock_and_expiry(self):
        for now in [999,10000,-1,True,float('nan')]:
            with self.subTest(now=now),self.assertRaises(ValueError):replay.operate(self.root,self.request(now=now),'reserve')
    def test_clock_cannot_roll_back_after_consumption(self):
        r=self.reserve(now=2000);replay.operate(self.root,r,'consume')
        with self.assertRaises(ValueError):self.reserve(2,1999)
    def test_missing_or_extra_metadata(self):
        for r in [{}, {**self.request(),'secret':'synthetic'}, {**self.request(),'requestDigest':'bad'}]:
            with self.assertRaises(ValueError):replay.operate(self.root,r,'reserve')
    def test_uncertain_file_write_keeps_pending(self):
        with patch('local_recovery_abuse.os.replace',side_effect=OSError('fixture-disk-error')):
            with self.assertRaises(ValueError):self.reserve()
        self.assertTrue((self.root/'pending').exists())
        with self.assertRaises(ValueError):self.reserve(2)
    def test_missing_checkpoint_cannot_be_repaired(self):
        (self.root/'checkpoint.json').unlink()
        with self.assertRaises(ValueError):self.reserve()
        self.assertFalse((self.root/'checkpoint.json').exists())
    def test_one_sided_rollback_is_refused(self):
        data=(self.root/'ledger.json').read_bytes();r=self.reserve();replay.operate(self.root,r,'consume');(self.root/'ledger.json').write_bytes(data)
        with self.assertRaises(ValueError):self.reserve(2)
    def test_symlink_state_refused(self):
        p=self.root/'ledger.json';p.rename(self.root/'saved');p.symlink_to(self.root/'saved')
        with self.assertRaises(ValueError):self.reserve()
    def test_invalid_state_even_with_recomputed_checksum(self):
        data=json.loads((self.root/'ledger.json').read_bytes());data['records']=[{'requestDigest':'a'*64}]
        payload=replay.encoded(data);(self.root/'ledger.json').write_bytes(payload);(self.root/'checkpoint.json').write_bytes(replay.encoded({'sha256':hashlib.sha256(payload).hexdigest()}))
        with self.assertRaises(ValueError):self.reserve()
    def test_prepare_rejects_invalid_policy(self):
        for limit in [0,65,True]:
            with tempfile.TemporaryDirectory() as d,self.assertRaises(ValueError):replay.prepare(Path(d),self.binding,10000,1000,limit)
    def test_receipts_do_not_store_content_or_credentials(self):
        r=self.reserve();replay.operate(self.root,r,'consume');s=json.loads((self.root/'ledger.json').read_text())
        self.assertEqual(set(s['records'][0]),{'requestDigest','receipt','status','at','spentAt'})

if __name__=='__main__':unittest.main()
