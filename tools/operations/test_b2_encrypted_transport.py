"""Prepared upload tests use fake provider callbacks and temporary quota ledgers."""
from pathlib import Path
import tempfile
import unittest
import sqlite3
import hashlib
from urllib.parse import unquote
from b2_backup_quota import prepare_b2_ledger
import b2_encrypted_transport as m

BUCKET='a'*24
TOKEN='fixture_token_not_a_credential'
API='https://api005.backblazeb2.com'
URL='https://pod-000-1007-13.backblaze.com/b2api/v4/b2_upload_file/fixture/fixture'
ENVELOPE=b'ASB1'+b'synthetic_encrypted_fixture_only_'*2

class TransferTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.ledger=Path(self.tmp.name)/'quota.sqlite'
        prepare_b2_ledger(self.ledger,observed_at=1000,stored_bytes=0,downloaded_bytes=0,class_b=0,class_c=0)

    def call(self,calls,fail=False,bad=False):
        def call(url,token,body,headers):
            calls.append((url,token,body,headers))
            if len(calls)==1:return {'bucketId':BUCKET,'uploadUrl':URL,'authorizationToken':TOKEN}
            if fail:raise m.TransferHeld('fixture')
            return {'bucketId':BUCKET,'fileName':unquote(headers['X-Bz-File-Name']),
                    'action':'upload','contentLength':len(body),'contentSha1':'wrong' if bad else hashlib.sha1(body).hexdigest(),
                    'contentType':'application/octet-stream','serverSideEncryption':{'algorithm':'AES256','mode':'SSE-B2'},'fileId':'fixture_file_id'}
        return call

    def test_upload_reserved_before_provider_and_never_claims_restore(self):
        calls=[];fake=self.call(calls)
        def call(*args):
            with sqlite3.connect(self.ledger) as db:
                self.assertEqual(db.execute('select stored_bytes,class_b,class_c from quota').fetchone(),(len(ENVELOPE),2,2))
            return fake(*args)
        result=m.upload_envelope(API,TOKEN,BUCKET,ENVELOPE,self.ledger,now=1001,call=call)
        self.assertTrue(result['uploaded']);self.assertFalse(result['restore_verified']);self.assertEqual(len(calls),2)
        self.assertTrue(result['file_name'].startswith('backups/'))
        self.assertEqual(calls[1][3]['X-Bz-Server-Side-Encryption'],'AES256')

    def test_failure_and_wrong_ack_keep_reservations_without_retry(self):
        for flag in ['fail','bad']:
            calls=[]
            with self.assertRaises(m.TransferHeld):
                m.upload_envelope(API,TOKEN,BUCKET,ENVELOPE,self.ledger,now=1001,call=self.call(calls,**{flag:True}))
            self.assertEqual(len(calls),2)
        with sqlite3.connect(self.ledger) as db:self.assertEqual(db.execute('select stored_bytes from quota').fetchone()[0],2*len(ENVELOPE))

    def test_plaintext_bad_api_and_stale_ledger_make_no_requests(self):
        for api,data,now in [(API,b'plaintext',1001),('https://other.test',ENVELOPE,1001),(API,ENVELOPE,1400)]:
            calls=[]
            with self.assertRaises(Exception):m.upload_envelope(api,TOKEN,BUCKET,data,self.ledger,now=now,call=self.call(calls))
            self.assertEqual(calls,[])

    def test_external_redirect_or_malformed_upload_url_refused(self):
        for url in ['http://pod-000-1.backblaze.com/b2api/v4/b2_upload_file/x','https://pod-000-1.backblaze.com.evil.test/b2api/v4/b2_upload_file/x',URL+'?secret=x','https://user@pod-000-1.backblaze.com/b2api/v4/b2_upload_file/x',URL.replace('b2_upload_file','b2_delete_file_version')]:
            with self.assertRaises(m.TransferHeld):m.validate_upload_url(url)
        with self.assertRaises(m.TransferHeld):m.NoRedirect().redirect_request(None,None,307,'',{},'https://other.test')

    def test_wrong_bucket_url_response_never_uploads(self):
        calls=[]
        def call(*args):calls.append(args);return {'bucketId':'other','uploadUrl':URL,'authorizationToken':TOKEN}
        with self.assertRaises(m.TransferHeld):m.upload_envelope(API,TOKEN,BUCKET,ENVELOPE,self.ledger,now=1001,call=call)
        self.assertEqual(len(calls),1)
