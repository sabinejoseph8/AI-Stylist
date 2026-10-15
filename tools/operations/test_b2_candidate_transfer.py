import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch
import b2_candidate_transfer as m
from b2_backup_quota import prepare_b2_ledger


class CandidateTransferTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.ledger=Path(self.tmp.name)/'quota.sqlite'
        prepare_b2_ledger(self.ledger,observed_at=1000,stored_bytes=0,downloaded_bytes=0,class_b=0,class_c=0)
        self.config={'B2_BUCKET_ID':'92135d40b02e32dcab1a0e10','B2_BUCKET_NAME':'AIstylist',
                     'B2_PREFIX':'backups/','B2_KEY_ID':'fixture','B2_APPLICATION_KEY':'fixture'}
        self.value=b'ASB1'+b'fixture'*1000

    def run_transfer(self,**kwargs):
        with patch.object(m.preflight,'validate_authorization',return_value=('https://api005.backblazeb2.com','fixture-token')):
            return m.transfer(self.config,self.value,self.ledger,now=lambda:1001,
                authorize=lambda *args:{},upload=lambda *args,**kw:{'file_id':'fixture','uploaded':True},
                **{'verify':lambda _:True,'read':lambda *args:self.value,**kwargs})

    def test_round_trip_never_claims_complete_or_fresh_source(self):
        result=self.run_transfer()
        self.assertTrue(result['candidate_round_trip_verified'])
        self.assertFalse(result['complete_backup_verified'])
        self.assertFalse(result['fresh_source_snapshot_verified'])
        self.assertFalse(result['schedule_active'])

    def test_bad_local_candidate_never_authorizes(self):
        with self.assertRaises(m.TransferHeld):
            self.run_transfer(verify=lambda _:False,read=lambda *_:self.fail('read'))

    def test_corrupt_readback_held(self):
        with self.assertRaises(m.TransferHeld): self.run_transfer(read=lambda *_:b'wrong')

    def test_changed_decryption_verification_held(self):
        results=iter([True,False])
        with self.assertRaises(m.TransferHeld):self.run_transfer(verify=lambda _:next(results))

    def test_wrong_destination_or_oversized_input_before_network(self):
        self.config['B2_BUCKET_NAME']='other'
        with self.assertRaises(m.TransferHeld):self.run_transfer()
        self.config['B2_BUCKET_NAME']='AIstylist';self.value=b'ASB1'+bytes(m.MAX_CANDIDATE)
        with self.assertRaises(m.TransferHeld):self.run_transfer()

    def test_stale_ledger_held_before_authorization(self):
        with patch.object(m.preflight,'validate_authorization',side_effect=AssertionError('network')):
            with self.assertRaises(Exception):
                m.transfer(self.config,self.value,self.ledger,now=lambda:1401,verify=lambda _:True,
                           authorize=lambda *_:self.fail('request'))

    def test_download_destination_size_and_redirect_fail_closed(self):
        for url,size in [('https://other.test',100),('http://api005.backblazeb2.com',100),
                         ('https://api005.backblazeb2.com',m.MAX_CANDIDATE+1)]:
            with self.assertRaises(m.TransferHeld):m.download(url,'fixture','fixture',size)
        with self.assertRaises(m.TransferHeld):
            m.NoRedirect().redirect_request(None,None,302,'',{},'https://other.test')

    def test_upload_locator_recorded_before_a_failed_readback(self):
        saved=[]
        def read(*args):
            self.assertEqual(saved[0]['file_id'],'fixture')
            raise OSError('fixture failure')
        with self.assertRaises(OSError):self.run_transfer(read=read,uploaded=lambda result:saved.append(result))
        self.assertEqual(len(saved),1)
