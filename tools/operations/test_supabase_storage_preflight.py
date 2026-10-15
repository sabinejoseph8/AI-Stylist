"""Simulated responses only, no real key, network or private files."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
from types import SimpleNamespace
import io
import tempfile
import json
from contextlib import redirect_stdout

spec=importlib.util.spec_from_file_location('storage_preflight',Path(__file__).with_name('supabase-storage-preflight.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
GOOD={'id':'stylist-wardrobe','name':'stylist-wardrobe','public':False,'file_size_limit':10485760,
      'allowed_mime_types':['image/jpeg','image/png','image/webp']}
KEY='sb_secret_fixture_only_not_real_1234'

class StoragePreflightTests(unittest.TestCase):
    def test_only_exact_private_bucket_accepted(self):
        calls=[]
        def call(key):calls.append(key);return GOOD.copy()
        self.assertEqual(m.inspect(KEY,call)['object_downloads'],0)
        self.assertEqual(len(calls),1)
        for change in [{'public':True},{'id':'other'},{'file_size_limit':True},
                       {'file_size_limit':None},{'allowed_mime_types':['image/svg+xml']},{'allowed_mime_types':[{}]}]:
            with self.assertRaises(m.Held):m.inspect(KEY,lambda k:{**GOOD,**change})

    def test_key_only_sent_in_header_to_fixed_destination(self):
        class Response:
            status=200
            def __enter__(self):return self
            def __exit__(self,*args):pass
            def read(self,n):return json.dumps(GOOD).encode()
        seen=[]
        class Opener:
            def open(self,req,timeout):seen.append((req,timeout));return Response()
        with patch.object(m.urllib.request,'build_opener',return_value=Opener()):m.request_bucket(KEY)
        req,timeout=seen[0]
        self.assertEqual(req.full_url,m.URL);self.assertEqual(req.method,'GET')
        self.assertEqual(req.get_header('Apikey'),KEY);self.assertIsNone(req.get_header('Authorization'))
        self.assertNotIn(KEY,req.full_url);self.assertIsNone(req.data);self.assertEqual(timeout,10)

    def test_bad_keys_and_redirects_refused(self):
        for key in ['',KEY+'\n','sb_publishable_fixture','Bearer '+KEY]:
            with self.assertRaises(m.Held):m.request_bucket(key)
        with self.assertRaises(m.Held):m.NoRedirect().redirect_request(None,None,307,'',{},'https://other.test')

    def test_receipt_blocks_second_execution_and_key_stays_private(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);root.chmod(0o700)
            p=root/'supabase-storage-key.txt';p.write_text(KEY+'\n');p.chmod(0o600)
            output=io.StringIO()
            with patch.object(m,'PRIVATE',root),patch('sys.argv',['check','--inspect-approved-storage']),patch.object(m,'inspect',return_value={'private_bucket_verified':True}) as check,redirect_stdout(output):
                self.assertEqual(m.main(),0);self.assertEqual(m.main(),1)
                self.assertEqual(check.call_count,1)
            self.assertNotIn(KEY,output.getvalue())
            self.assertEqual((root/'supabase-storage-preflight.json').stat().st_mode&0o077,0)

    def test_provider_failure_no_retry_or_raw_error(self):
        calls=[]
        def call(key):calls.append(key);raise m.Held('fixture')
        with self.assertRaises(m.Held):m.inspect(KEY,call)
        self.assertEqual(len(calls),1)
