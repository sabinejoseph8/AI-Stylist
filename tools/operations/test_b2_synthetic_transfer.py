"""Fake authorization/upload/download; no real files, secrets or provider calls."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from b2_backup_quota import prepare_b2_ledger
import sqlite3

spec=importlib.util.spec_from_file_location('synthetic_transfer',Path(__file__).with_name('b2-synthetic-transfer.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
CONFIG={'B2_BUCKET_ID':'92135d40b02e32dcab1a0e10','B2_BUCKET_NAME':'AIstylist','B2_PREFIX':'backups/',
        'B2_KEY_ID':'fixture','B2_APPLICATION_KEY':'not-a-real-secret'}
VALUE=b'ASB1'+b'encrypted synthetic sample fixture only'*2
AUTH={'apiInfo':{'storageApi':{'allowed':{'buckets':[{'id':CONFIG['B2_BUCKET_ID'],'name':'AIstylist'}],
      'namePrefix':'backups/','capabilities':['listFiles','readFiles','writeFiles','deleteFiles','readBucketEncryption']},
      'apiUrl':'https://api005.backblazeb2.com'}},'applicationKeyExpirationTimestamp':1100000,'authorizationToken':'fixture-token-not-a-credential'}

class SyntheticTransferTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.ledger=Path(self.temp.name)/'quota.sqlite'
        prepare_b2_ledger(self.ledger,observed_at=1000,stored_bytes=0,downloaded_bytes=0,class_b=0,class_c=26)

    def run_trial(self,changed=False,verify=True,bad_auth=False):
        self.calls=[]
        def authorize(*args):self.calls.append('auth');return {} if bad_auth else AUTH
        def upload(*args,**kwargs):self.calls.append('upload');return {'file_id':'fixture_id','file_name':'backups/fixture.asb'}
        def read(*args):self.calls.append('read');return b'changed' if changed else VALUE
        return m.trial(CONFIG,self.ledger,now=lambda:1001,seal=lambda:VALUE,verify=lambda value:verify,
                       authorize=authorize,upload=upload,read=read)

    def test_matching_sample_never_claims_complete_backup(self):
        result=self.run_trial()
        self.assertTrue(result['synthetic_round_trip_verified']);self.assertFalse(result['complete_backup_verified'])
        self.assertFalse(result['customer_data_transferred']);self.assertEqual(self.calls,['auth','upload','read'])
        with sqlite3.connect(self.ledger) as db:
            # Fake upload skips its own reservation; auth/download still reserve.
            self.assertEqual(db.execute('select downloaded_bytes,class_b,class_c from quota').fetchone(),(len(VALUE),2,28))

    def test_changed_or_undecryptable_sample_refused_no_retry(self):
        for kwargs in [{'changed':True},{'verify':False}]:
            with self.assertRaises(m.TransferHeld):self.run_trial(**kwargs)
            self.assertEqual(self.calls,['auth','upload','read'])

    def test_bad_auth_never_uploads(self):
        with self.assertRaises(m.preflight.Held):self.run_trial(bad_auth=True)
        self.assertEqual(self.calls,['auth'])

    def test_stale_ledger_prevents_provider_calls(self):
        with self.assertRaises(RuntimeError):
            m.trial(CONFIG,self.ledger,now=lambda:1400,seal=lambda:VALUE,verify=lambda value:True,
                    authorize=lambda *args:self.fail('Must not call provider'))

    def test_destination_mismatch_prevents_crypto_and_network(self):
        with self.assertRaises(m.TransferHeld):
            m.trial({**CONFIG,'B2_BUCKET_NAME':'other'},self.ledger,now=lambda:1001,
                    seal=lambda:self.fail('Must not start'),verify=lambda value:True)

class SyntheticEntryTests(unittest.TestCase):
    def test_permanent_receipt_prevents_second_provider_attempt(self):
        from unittest.mock import patch
        from contextlib import redirect_stdout
        import io
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);root.chmod(0o700)
            for name,value in [('b2-restricted.env','\n'.join(k+'='+v for k,v in CONFIG.items())),
                               ('backup-recovery-key.json','fixture-only'),('b2-synthetic-quota.sqlite','fixture-only')]:
                p=root/name;p.write_text(value);p.chmod(0o600)
            output=io.StringIO()
            with patch.object(m,'PRIVATE',root),patch('sys.argv',['check','--run-approved-synthetic-transfer']),patch.object(m,'trial',return_value={'synthetic_round_trip_verified':True}) as trial,redirect_stdout(output):
                self.assertEqual(m.main(),0);self.assertEqual(m.main(),1);self.assertEqual(trial.call_count,1)
            receipt=root/'b2-synthetic-transfer.json'
            self.assertEqual(receipt.stat().st_mode&0o077,0)
            self.assertNotIn(CONFIG['B2_APPLICATION_KEY'],output.getvalue())

    def test_failed_trial_stays_held_and_is_not_retried(self):
        from unittest.mock import patch
        from contextlib import redirect_stdout
        import io,json
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);root.chmod(0o700)
            for name,value in [('b2-restricted.env','\n'.join(k+'='+v for k,v in CONFIG.items())),
                               ('backup-recovery-key.json','fixture-only'),('b2-synthetic-quota.sqlite','fixture-only')]:
                p=root/name;p.write_text(value);p.chmod(0o600)
            with patch.object(m,'PRIVATE',root),patch('sys.argv',['check','--run-approved-synthetic-transfer']),patch.object(m,'trial',side_effect=m.TransferHeld('private fixture detail')) as trial,redirect_stdout(io.StringIO()) as output:
                self.assertEqual(m.main(),1);self.assertEqual(m.main(),1);self.assertEqual(trial.call_count,1)
            self.assertEqual(json.loads((root/'b2-synthetic-transfer.json').read_text())['outcome'],'held')
            self.assertNotIn('private fixture detail',output.getvalue())
