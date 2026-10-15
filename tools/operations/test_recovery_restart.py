"""Fresh child processes and disposable files only; never live backup state."""
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest
import b2_automatic_budget as budget
import local_recovery_evidence as m

EVIDENCE=dict(version=1,deleted_keys=['fixture-owner/deleted.png'],deleted_accounts=['fixture-account'],
              ledger=dict(reservation=dict(id='synthetic-reservation',state='held')))

class EvidenceRestartTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='stylist-recovery-evidence-')
        self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)

    def test_fresh_process_recovers_deletions_and_same_held_reservation(self):
        self.assertEqual(m.restart_round_trip(self.root,EVIDENCE),EVIDENCE)
        self.assertEqual(m.child(self.root,'read').returncode,0)

    def test_missing_store_does_not_create_empty_evidence(self):
        self.assertEqual(m.child(self.root,'read').returncode,2)
        self.assertEqual(list(self.root.iterdir()),[])

    def test_crash_between_data_and_checkpoint_holds_after_restart(self):
        self.assertEqual(m.child(self.root,'write',evidence=EVIDENCE,crash=True).returncode,71)
        self.assertEqual(m.child(self.root,'read').returncode,2)
        self.assertTrue((self.root/'evidence.pending').exists())

    def test_corruption_truncation_or_missing_checkpoint_holds(self):
        for action in ['corrupt','truncate','missing']:
            with self.subTest(action=action),tempfile.TemporaryDirectory() as tmp:
                root=Path(tmp);m.restart_round_trip(root,EVIDENCE)
                if action=='missing':(root/'checkpoint.json').unlink()
                else:(root/'evidence.json').write_bytes(b'{}' if action=='corrupt' else b'{')
                self.assertEqual(m.child(root,'read').returncode,2)

    def test_old_evidence_with_new_checkpoint_is_rejected(self):
        m.restart_round_trip(self.root,EVIDENCE)
        old={**EVIDENCE,'deleted_keys':[]}
        (self.root/'evidence.json').write_text(json.dumps(old))
        self.assertEqual(m.child(self.root,'read').returncode,2)

    def test_shared_or_symlink_evidence_is_rejected(self):
        m.restart_round_trip(self.root,EVIDENCE)
        file=self.root/'evidence.json';file.chmod(0o644)
        self.assertEqual(m.child(self.root,'read').returncode,2)
        file.chmod(0o600);file.rename(self.root/'original');file.symlink_to(self.root/'original')
        self.assertEqual(m.child(self.root,'read').returncode,2)

    def test_existing_state_cannot_be_reinitialized(self):
        m.restart_round_trip(self.root,EVIDENCE)
        before=(self.root/'evidence.json').read_bytes()
        with self.assertRaises(ValueError):m.write_fixture(self.root,EVIDENCE)
        self.assertEqual((self.root/'evidence.json').read_bytes(),before)

class SpendingRestartTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name).resolve()/'budget.sqlite'
        budget.prepare(self.path,now=1000,observed_at=1000,storage_upper_bound=100,download_upper_bound=200,
                       class_b_upper_bound=100,class_c_upper_bound=100,source_headroom=budget.MAX_SOURCE_TOTAL,
                       expires_at=1000+budget.MAX_PLAN_AGE,sole_use_account=True,approved_policy=True)

    def child(self,now,crash=False):
        code="""
import json,os,sys
from pathlib import Path
import b2_automatic_budget as b
try:
 b.run_reserved(Path(sys.argv[1]),now=int(sys.argv[2]),operation=(lambda:os._exit(71)) if sys.argv[3]=='crash' else (lambda:None))
 print('{"completed":true}')
except b.AutomaticHeld: print('{"held":true}');sys.exit(2)
"""
        return subprocess.run([sys.executable,'-c',code,str(self.path),str(now),'crash' if crash else 'run'],
                                cwd=Path(__file__).parent,capture_output=True,timeout=10)

    def row(self):
        with sqlite3.connect(self.path) as db:
            return db.execute('select stored,downloaded,class_b,class_c,source_bytes,last_run,active from policy').fetchone()

    def test_real_process_crash_preserves_reserved_totals_and_blocks_restart(self):
        self.assertEqual(self.child(1000,True).returncode,71)
        before=self.row();self.assertIsNotNone(before[-1])
        self.assertEqual(before[:4],(100+budget.MAX_ENVELOPE,200+budget.MAX_ENVELOPE,104,104))
        self.assertEqual(self.child(90000).returncode,2)
        self.assertEqual(self.row(),before)

    def test_completed_attempt_interval_and_totals_survive_restart(self):
        self.assertEqual(self.child(1000).returncode,0)
        before=self.row();self.assertEqual(self.child(1001).returncode,2)
        self.assertEqual(self.row(),before)
        self.assertEqual(self.child(1000+budget.MIN_INTERVAL).returncode,0)
        self.assertEqual(self.row()[2:4],(108,108))

    def test_missing_ledger_after_restart_is_not_recreated(self):
        self.path.unlink()
        self.assertEqual(self.child(90000).returncode,2)
        self.assertFalse(self.path.exists())

    def test_damaged_ledger_after_restart_is_not_reset(self):
        self.path.write_bytes(b'broken fixture')
        self.assertEqual(self.child(90000).returncode,2)
        self.assertEqual(self.path.read_bytes(),b'broken fixture')
