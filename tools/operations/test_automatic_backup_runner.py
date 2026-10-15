from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import hashlib
from urllib.parse import unquote
import b2_candidate_transfer as transport
from b2_encrypted_transport import upload_envelope
from b2_automatic_budget import prepare
import automatic_backup_runner as m


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name).resolve()/'policy.sqlite'
        prepare(self.path,now=1000,observed_at=1000,storage_upper_bound=0,download_upper_bound=0,
                class_b_upper_bound=0,class_c_upper_bound=0,source_headroom=2_000_000_000,
                expires_at=100000,sole_use_account=True,approved_policy=True)
        self.gates={k:True for k in m.GATES};self.events=[];self.value=b'ASB1'+b'fixture'*20

    def transfer(self,value,guard):
        guard(None,now=1001,class_b=1,class_c=1,operation=lambda:None)
        guard(None,now=1002,upload_bytes=len(value),class_b=2,class_c=2,operation=lambda:None)
        guard(None,now=1003,download_bytes=len(value),class_b=1,class_c=1,operation=lambda:None)
        return {'candidate_round_trip_verified':True,'encrypted_bytes':len(value)}

    def run_job(self,**kwargs):
        return m.run_once(self.path,**dict(dict(now=lambda:1000,expires=100000,gates=self.gates,
            capture=lambda:self.value,verify=lambda _:True,transfer=self.transfer,reconcile=lambda:True,
            monitor=lambda status,proof:self.events.append((status,proof))),**kwargs))

    def test_success_follows_full_plan_and_reconciliation(self):
        self.assertTrue(self.run_job()['recovery_point_verified'])
        self.assertEqual(self.events,[('start',False),('success',True)])

    def test_missing_real_acceptance_gates_starts_nothing(self):
        self.gates['restore_accepted_for_scope']=False
        with self.assertRaises(m.RunnerHeld):self.run_job(capture=lambda:self.fail('source called'))
        self.assertEqual(self.events,[])

    def test_bad_source_or_reconciliation_never_signals_success(self):
        with self.assertRaises(m.RunnerHeld):self.run_job(reconcile=lambda:False)
        self.assertEqual(self.events,[('start',False),('failure',False)])

    def test_failed_start_or_transfer_retains_reservation(self):
        with self.assertRaises(m.RunnerHeld):self.run_job(transfer=lambda *_:(_ for _ in ()).throw(OSError('private')))
        self.events=[]
        with self.assertRaises(m.RunnerHeld):self.run_job(capture=lambda:self.fail('retry'))
        self.assertEqual(self.events,[('failure',False)])

    def test_allowance_has_no_extra_request_or_refund(self):
        a=m.RequestAllowance(started=1000,expires=2000)
        with self.assertRaises(m.RunnerHeld):a.guard(None,now=1001,class_b=1,class_c=1,operation=lambda:(_ for _ in ()).throw(OSError('private')))
        with self.assertRaises(m.RunnerHeld):a.guard(None,now=1002,class_b=1,class_c=1,operation=lambda:self.fail('retry'))

    def test_wrong_phase_size_ledger_deadline_and_incomplete_hold(self):
        for kwargs in [dict(ledger='pretend-fresh-provider-ledger',now=1000),dict(ledger=None,now=1240),dict(ledger=None,now=999)]:
            a=m.RequestAllowance(started=1000,expires=2000)
            with self.assertRaises(m.RunnerHeld):a.guard(**kwargs,class_b=1,class_c=1,operation=lambda:self.fail('request'))
        a=m.RequestAllowance(started=1000,expires=2000)
        with self.assertRaises(m.RunnerHeld):a.complete()
        a.guard(None,now=1000,class_b=1,class_c=1,operation=lambda:None)
        with self.assertRaises(m.RunnerHeld):a.guard(None,now=1001,upload_bytes=m.MAX_ENVELOPE+1,class_b=2,class_c=2,operation=lambda:self.fail('request'))

    def test_incomplete_transfer_never_reports_success(self):
        with self.assertRaises(m.RunnerHeld):self.run_job(transfer=lambda *_:{'candidate_round_trip_verified':True,'encrypted_bytes':len(self.value)})
        self.assertNotIn(('success',True),self.events)

    def test_monitor_success_failure_does_not_retry_backup(self):
        def monitor(status,proof):
            self.events.append((status,proof))
            if status=='success':raise OSError('private URL')
        with self.assertRaises(m.RunnerHeld):self.run_job(monitor=monitor)
        with self.assertRaises(m.RunnerHeld):self.run_job(capture=lambda:self.fail('retry'))

    def test_real_transport_composes_four_calls_without_a_fake_usage_baseline(self):
        calls=[]
        config={'B2_BUCKET_ID':'92135d40b02e32dcab1a0e10','B2_BUCKET_NAME':'AIstylist',
                'B2_PREFIX':'backups/','B2_KEY_ID':'fixture','B2_APPLICATION_KEY':'fixture'}
        token='fixture_token_not_a_credential'
        def post(url,authorization,data,headers):
            if url.endswith('b2_get_upload_url'):
                calls.append('upload-url')
                return {'bucketId':config['B2_BUCKET_ID'],'authorizationToken':token,
                        'uploadUrl':'https://pod-000-1007-13.backblaze.com/b2api/v4/b2_upload_file/fixture/fixture'}
            calls.append('upload')
            return {'bucketId':config['B2_BUCKET_ID'],'fileName':unquote(headers['X-Bz-File-Name']),
                    'action':'upload','contentLength':len(data),'contentSha1':hashlib.sha1(data).hexdigest(),
                    'contentType':'application/octet-stream','serverSideEncryption':{'mode':'SSE-B2','algorithm':'AES256'},'fileId':'fixture'}
        def send(value,guard):
            return transport.transfer(config,value,None,now=lambda:1001,verify=lambda _:True,
                authorize=lambda *_:calls.append('authorize') or {},
                upload=lambda *args,**kwargs:upload_envelope(*args,call=post,**kwargs),
                read=lambda *_:calls.append('download') or value,budget_guard=guard)
        with patch.object(transport.preflight,'validate_authorization',return_value=('https://api005.backblazeb2.com',token)):
            self.assertTrue(self.run_job(transfer=send)['recovery_point_verified'])
        self.assertEqual(calls,['authorize','upload-url','upload','download'])
