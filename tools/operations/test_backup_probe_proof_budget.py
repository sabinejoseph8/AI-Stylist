import unittest,tempfile,sqlite3,os
from pathlib import Path
from b2_automatic_budget import prepare,SOURCE_PER_RUN,MAX_SOURCE_TOTAL
from backup_probe_proof_budget import reserve_source,ProofHeld
class ProofBudgetTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name).resolve();os.chmod(self.root,0o700);self.path=self.root/'budget.sqlite'
  prepare(self.path,now=100,observed_at=100,storage_upper_bound=0,download_upper_bound=0,class_b_upper_bound=0,class_c_upper_bound=0,source_headroom=MAX_SOURCE_TOTAL,expires_at=200,sole_use_account=True,approved_policy=True)
 def tearDown(self):self.tmp.cleanup()
 def row(self):
  with sqlite3.connect(self.path) as db:return db.execute('select * from policy').fetchone()
 def test_only_source_counter_changes(self):
  before=self.row();self.assertEqual(reserve_source(self.path,now=101,approved=True),SOURCE_PER_RUN);after=self.row()
  self.assertEqual(after[:8],before[:8]);self.assertEqual(after[9:],before[9:]);self.assertEqual(after[8],before[8]+SOURCE_PER_RUN)
 def test_replay_stays_consumed(self):
  reserve_source(self.path,now=101,approved=True)
  with self.assertRaises(ProofHeld):reserve_source(self.path,now=102,approved=True)
  self.assertEqual(self.row()[8],SOURCE_PER_RUN)
 def test_no_approval_no_changes(self):
  before=self.row()
  with self.assertRaises(ProofHeld):reserve_source(self.path,now=101)
  self.assertEqual(self.row(),before)
 def test_expiry_and_active_hold(self):
  with self.assertRaises(ProofHeld):reserve_source(self.path,now=201,approved=True)
  with sqlite3.connect(self.path) as db:db.execute('update policy set active=1')
  with self.assertRaises(ProofHeld):reserve_source(self.path,now=101,approved=True)
 def test_no_cap_bypass(self):
  with sqlite3.connect(self.path) as db:db.execute('update policy set source_bytes=?',(MAX_SOURCE_TOTAL,))
  with self.assertRaises(ProofHeld):reserve_source(self.path,now=101,approved=True)

 def test_repaired_purpose_preserves_first_read_and_all_other_counters(self):
  from backup_probe_proof_budget import REPAIRED_PURPOSE
  reserve_source(self.path,now=101,approved=True);before=self.row()
  reserve_source(self.path,now=102,approved=True,purpose=REPAIRED_PURPOSE);after=self.row()
  self.assertEqual(after[:8],before[:8]);self.assertEqual(after[9:],before[9:]);self.assertEqual(after[8],before[8]+SOURCE_PER_RUN)
  with sqlite3.connect(self.path) as db:self.assertEqual(db.execute('select count(*) from schema_proof_reads').fetchone()[0],2)
  with self.assertRaises(ProofHeld):reserve_source(self.path,now=103,approved=True,purpose=REPAIRED_PURPOSE)
 def test_unknown_purpose_cannot_mint_source_budget(self):
  before=self.row()
  with self.assertRaises(ProofHeld):reserve_source(self.path,now=101,approved=True,purpose='new-unapproved-purpose')
  self.assertEqual(self.row(),before)
