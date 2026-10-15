"""Mocked creation only; no administrator key or network access."""
import copy
import importlib.util
from pathlib import Path
import unittest
from b2_key_request import replacement_request

spec=importlib.util.spec_from_file_location('b2_create_restricted',Path(__file__).with_name('b2-create-restricted-key.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
ADMIN={'id':'fixtureadmin','secret':'fixture-admin-not-a-real-secret','expected_account_id':'fixtureaccount'}
CONFIG={'B2_BUCKET_ID':'fixturebucket','B2_PREFIX':'backups/'}
AUTH={'accountId':'fixtureaccount','apiInfo':{'storageApi':{'apiUrl':'https://api005.backblazeb2.com',
      'allowed':{'capabilities':['writeKeys']}}},'authorizationToken':'fixture-token-not-real'}
RESULT={**replacement_request('fixtureaccount','fixturebucket'), 'applicationKeyId':'fixture-key-id',
        'applicationKey':'fixture-key-not-real','expirationTimestamp':1100000}


class RestrictedKeyCreationTests(unittest.TestCase):
    def test_exact_creation_body_and_two_calls(self):
        calls=[]
        def call(url,auth,body=None):
            calls.append((url,body));return copy.deepcopy(AUTH if body is None else RESULT)
        created=module.create_restricted(ADMIN,CONFIG,call,now=1000)
        self.assertEqual(created['id'],'fixture-key-id')
        self.assertEqual(len(calls),2)
        self.assertEqual(calls[1],('https://api005.backblazeb2.com/b2api/v4/b2_create_key',
                                  replacement_request('fixtureaccount','fixturebucket')))

    def test_wrong_account_scope_or_destination_never_creates(self):
        for which in ['account','authority','destination','token']:
            auth=copy.deepcopy(AUTH)
            if which=='account':auth['accountId']='otheraccount'
            if which=='authority':auth['apiInfo']['storageApi']['allowed']['capabilities']=[]
            if which=='destination':auth['apiInfo']['storageApi']['apiUrl']='https://other.test'
            if which=='token':auth['authorizationToken']='unsafe\nvalue'
            calls=[]
            def call(*args):calls.append(args);return auth
            with self.assertRaises(module.Held):module.create_restricted(ADMIN,CONFIG,call,now=1000)
            self.assertEqual(len(calls),1)

    def test_created_key_rejects_each_wrong_restriction(self):
        for field,value in [('accountId','otheraccount'),('bucketIds',None),('namePrefix',''),
                            ('keyName','other'),('capabilities',['writeBuckets']),
                            ('expirationTimestamp',None),('applicationKey','bad')]:
            result=copy.deepcopy(RESULT);result[field]=value
            with self.assertRaises(module.Held):
                module.validate_created(result,replacement_request('fixtureaccount','fixturebucket'),1000)

    def test_ambiguous_creation_failure_never_retries(self):
        calls=[]
        def call(url,auth,body=None):
            calls.append(url)
            if body is not None:raise module.Held('uncertain-create')
            return copy.deepcopy(AUTH)
        with self.assertRaises(module.Held):module.create_restricted(ADMIN,CONFIG,call,now=1000)
        self.assertEqual(len(calls),2)

    def test_bad_administrator_input_never_connects(self):
        for admin in [None,{}, {**ADMIN,'secret':'bad'},{**ADMIN,'extra':'unexpected'}]:
            calls=[]
            def call(*args):calls.append(args)
            with self.assertRaises(module.Held):module.create_restricted(admin,CONFIG,call,now=1000)
            self.assertEqual(calls,[])
