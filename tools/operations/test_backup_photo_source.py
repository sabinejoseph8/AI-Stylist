"""Synthetic photo-source tests; never reads private credentials or network."""
import hashlib
import unittest
from email.message import Message
from unittest.mock import patch
import backup_photo_source as m

PAYLOAD=b'synthetic garment bytes'
ROW={'id':'00000000-0000-0000-0000-000000000001','user_id':'00000000-0000-0000-0000-000000000002',
     'storage_key':'00000000-0000-0000-0000-000000000002/item.webp','content_type':'image/webp',
     'checksum':hashlib.sha256(PAYLOAD).hexdigest(),'state':'ready'}
KEY='sb_secret_fixture_only_not_real_1234'

class PhotoSourceTests(unittest.TestCase):
    def test_complete_matching_set_only(self):
        calls=[]
        def fetch(key,row,limit):calls.append((row['storage_key'],limit));return PAYLOAD
        self.assertEqual(m.collect_photos([ROW],KEY,fetch),{ROW['storage_key']:PAYLOAD})
        self.assertEqual(len(calls),1)
        self.assertEqual(m.collect_photos([],KEY,fetch),{})

    def test_entire_manifest_validated_before_fetch(self):
        for change in [{'state':'staged'},{'state':'deleting'},{'checksum':None},
                       {'storage_key':'other/item.webp'},{'storage_key':ROW['user_id']+'/../item.webp'},
                       {'storage_key':ROW['user_id']+'/%2e.webp'},{'content_type':'image/svg+xml'},{'content_type':[]}]:
            calls=[]
            with self.assertRaises(m.PhotoHeld):m.collect_photos([ROW,{**ROW,**change}],KEY,lambda *a:calls.append(a))
            self.assertEqual(calls,[])

    def test_duplicate_id_or_path_refused_before_fetch(self):
        for second in [ROW,{**ROW,'id':'00000000-0000-0000-0000-000000000003'}]:
            calls=[]
            with self.assertRaises(m.PhotoHeld):m.collect_photos([ROW,second],KEY,lambda *a:calls.append(a))
            self.assertEqual(calls,[])

    def test_mismatch_missing_or_oversize_never_returns_partial_set(self):
        for data in [b'changed',b'',None,PAYLOAD*2]:
            with self.assertRaises(m.PhotoHeld):m.collect_photos([ROW],KEY,lambda *a:data,total_limit=len(PAYLOAD))

    def test_network_get_is_fixed_header_only_bounded_and_no_redirect(self):
        calls=[]
        class Response:
            status=200
            headers=Message()
            headers['Content-Type']='image/webp';headers['Content-Length']=str(len(PAYLOAD))
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self,n):calls.append(n);return PAYLOAD
        class Opener:
            def open(self,req,timeout):
                self.req=req
                self.timeout=timeout
                return Response()
        op=Opener()
        with patch.object(m.urllib.request,'build_opener',return_value=op):
            self.assertEqual(m.fetch_photo(KEY,ROW,100),PAYLOAD)
        self.assertEqual(op.req.full_url,m.BASE+ROW['storage_key'])
        self.assertEqual(op.req.method,'GET');self.assertEqual(op.req.get_header('Apikey'),KEY)
        self.assertIsNone(op.req.get_header('Authorization'));self.assertEqual(op.timeout,10)
        self.assertEqual(calls,[101])
        with self.assertRaises(m.PhotoHeld):m.NoRedirect().redirect_request(None,None,307,'',{},'https://other.test')

    def test_request_failure_not_retried(self):
        calls=[]
        def fetch(*a):calls.append(a);raise m.PhotoHeld('fixture')
        with self.assertRaises(m.PhotoHeld):m.collect_photos([ROW],KEY,fetch)
        self.assertEqual(len(calls),1)
