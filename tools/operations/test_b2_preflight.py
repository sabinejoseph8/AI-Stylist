"""No real credential, network or private file access."""
import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('b2_preflight', Path(__file__).with_name('b2-preflight.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
CONFIG = {'B2_KEY_ID':'fixture-id','B2_APPLICATION_KEY':'fixture-secret',
          'B2_BUCKET_ID':'fixture-bucket','B2_BUCKET_NAME':'fixture-name'}
AUTH = {'apiInfo':{'storageApi':{'allowed':{'buckets':[{'id':'fixture-bucket','name':'fixture-name'}],
        'namePrefix':'backups/','capabilities':['listFiles','readFiles','writeFiles','deleteFiles']},
        'apiUrl':'https://api005.backblazeb2.com'}},
        'applicationKeyExpirationTimestamp': 1100000,'authorizationToken':'fixture-token-not-a-credential'}


class B2PreflightTests(unittest.TestCase):
    def test_only_two_requests_and_zero_writes(self):
        calls=[]
        def call(url, auth, body=None):
            calls.append((url, body))
            return copy.deepcopy(AUTH) if body is None else {'files':[], 'nextFileName':None, 'nextFileId':None}
        result=module.inspect(CONFIG, call, now=1000)
        self.assertTrue(result['scope_verified'])
        self.assertEqual(result['uploads'],0)
        self.assertEqual(len(calls),2)
        self.assertEqual(calls[1][1],{'bucketId':'fixture-bucket','prefix':'backups/','maxFileCount':100})

    def test_bad_scopes_never_make_followup_request(self):
        for mutation in ['bucket','prefix','admin','redirect','expired','unbounded']:
            data=copy.deepcopy(AUTH)
            storage=data['apiInfo']['storageApi']
            if mutation=='bucket': storage['allowed']['buckets']=None
            if mutation=='prefix': storage['allowed']['namePrefix']=None
            if mutation=='admin': storage['allowed']['capabilities'].append('writeKeys')
            if mutation=='redirect': storage['apiUrl']='https://api005.backblazeb2.com.evil.test'
            if mutation=='expired': data['applicationKeyExpirationTimestamp']=999
            if mutation=='unbounded': data['applicationKeyExpirationTimestamp']=None
            calls=[]
            def call(*args): calls.append(args);return data
            with self.assertRaises(module.Held): module.inspect(CONFIG,call,now=1000)
            self.assertEqual(len(calls),1)

    def test_existing_files_or_pagination_do_not_trigger_more_requests(self):
        for result in [{'files':[{}]}, {'files':[], 'nextFileName':'more'}, {}, {'files':[], 'nextFileId':'more'}]:
            calls=[]
            def call(*args):
                calls.append(args)
                return copy.deepcopy(AUTH) if len(calls)==1 else result
            with self.assertRaises(module.Held): module.inspect(CONFIG,call,now=1000)
            self.assertEqual(len(calls),2)

    def test_redirect_handler_rejects_before_sending_credentials_elsewhere(self):
        with self.assertRaises(module.Held):
            module.NoRedirect().redirect_request(None,None,307,'fixture',{},'https://other.test')

    def test_provider_failure_has_no_retry(self):
        calls=[]
        def call(*args): calls.append(args);raise module.Held('fixture-failure')
        with self.assertRaises(module.Held): module.inspect(CONFIG,call,now=1000)
        self.assertEqual(len(calls),1)
