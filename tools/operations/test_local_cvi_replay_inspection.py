"""Read-only durable replay-boundary evidence; no provider or live files."""
import hashlib
import json
import tempfile
import unittest
from pathlib import Path
import local_cvi_replay as replay
import local_cvi_witness as witness

class ReplayInspectionTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name)/'replay';self.root.mkdir(mode=0o700)
        self.binding='a'*64;self.store=replay.prepare(self.root,self.binding,10000,1000,2)
    def request(self,now=1000):return dict(storeId=self.store,bindingDigest=self.binding,challenge='b'*64,now=now)
    def inspect(self,now=1000,ref=None):return replay.inspect_boundary(self.root,self.request(now),witness=ref)
    def reserve(self,ref=None):return replay.operate(self.root,dict(storeId=self.store,bindingDigest=self.binding,requestDigest='c'*64,now=1000),'reserve',witness=ref)
    def rows(self):return json.loads((self.root/'ledger.json').read_text())['records']
    def test_idle_evidence_grants_no_permissions(self):
        r=self.inspect();self.assertEqual(r['status'],'replay-idle');self.assertEqual(r['recordCount'],0);self.assertTrue(all(v is False for v in r['permissions'].values()))
    def test_pending_is_retained_after_reopening_state(self):
        self.reserve();before=self.rows();r=self.inspect();self.assertEqual(r['status'],'replay-pending');self.assertEqual(r['pendingCount'],1);self.assertEqual(self.rows(),before)
    def test_spent_records_and_capacity_are_not_refunded(self):
        row=self.reserve();replay.operate(self.root,row,'consume');r=self.inspect(1500);self.assertEqual(r['spentCount'],1);self.assertEqual(len(self.rows()),1)
        second=replay.operate(self.root,dict(storeId=self.store,bindingDigest=self.binding,requestDigest='d'*64,now=1500),'reserve');replay.operate(self.root,second,'consume');self.assertEqual(self.inspect(1500)['status'],'replay-exhausted')
    def test_clock_progress_is_durable_but_expiry_and_records_are_unchanged(self):
        before=self.rows();self.inspect(1500)
        with self.assertRaises(ValueError):self.inspect(1499)
        self.assertEqual(self.rows(),before);self.assertEqual(json.loads((self.root/'ledger.json').read_text())['expires'],10000)
    def test_wrong_scope_nonce_or_shape_is_refused(self):
        for change in [dict(storeId='foreign'),dict(bindingDigest='f'*64),dict(challenge='bad'),dict(now=True),dict(extra=True)]:
            with self.subTest(change=change),self.assertRaises(ValueError):replay.inspect_boundary(self.root,{**self.request(),**change})
    def test_pending_write_marker_is_not_repaired(self):
        (self.root/'pending').write_text('unknown')
        with self.assertRaises(ValueError):self.inspect()
        self.assertTrue((self.root/'pending').exists())
    def test_witness_pins_read_and_observed_clock_updates(self):
        w=Path(self.temp.name)/'witness';w.mkdir(mode=0o700);ref=witness.prepare(w,self.root,self.store,'replay');self.inspect(1500,ref)
        self.assertEqual(witness.load(ref)['head'],hashlib.sha256((self.root/'ledger.json').read_bytes()).hexdigest())
    def test_complete_journal_rollback_is_refused_with_current_witness(self):
        w=Path(self.temp.name)/'witness';w.mkdir(mode=0o700);ref=witness.prepare(w,self.root,self.store,'replay');old={n:(self.root/n).read_bytes() for n in ['ledger.json','checkpoint.json']};self.reserve(ref)
        for n,b in old.items():(self.root/n).write_bytes(b)
        with self.assertRaises(ValueError):self.inspect(ref=ref)

    def test_negative_boundary_colocated_coordinated_restore_can_look_idle(self):
        w=Path(self.temp.name)/'witness';w.mkdir(mode=0o700);ref=witness.prepare(w,self.root,self.store,'replay')
        old={n:(self.root/n).read_bytes() for n in ['ledger.json','checkpoint.json']}
        witness_files={p:p.read_bytes() for p in w.iterdir() if p.is_file()}
        self.reserve(ref)
        for n,b in old.items():(self.root/n).write_bytes(b)
        for p,b in witness_files.items():p.write_bytes(b)
        result=self.inspect(ref=ref)
        self.assertEqual(result['status'],'replay-idle')
        self.assertTrue(all(v is False for v in result['permissions'].values()))

    def test_negative_boundary_idle_snapshot_does_not_lock_out_a_later_writer(self):
        result=self.inspect();self.reserve()
        self.assertEqual(result['status'],'replay-idle')
        self.assertEqual(self.inspect()['status'],'replay-pending')
        self.assertTrue(all(v is False for v in result['permissions'].values()))
