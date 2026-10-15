from pathlib import Path
import sqlite3
import tempfile
import unittest
import b2_automatic_budget as m


class AutomaticBudgetTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name).resolve()/'policy.sqlite'
        self.args=dict(now=1000,observed_at=1000,storage_upper_bound=100,
                       download_upper_bound=200,class_b_upper_bound=100,class_c_upper_bound=100,
                       source_headroom=m.MAX_SOURCE_TOTAL,expires_at=1000+m.MAX_PLAN_AGE,
                       sole_use_account=True,approved_policy=True)

    def prepare(self,**kwargs):m.prepare(self.path,**{**self.args,**kwargs})

    def row(self):
        with sqlite3.connect(self.path) as db:
            return db.execute('SELECT stored,downloaded,class_b,class_c,source_bytes,last_run,active FROM policy').fetchone()

    def test_explicit_policy_and_sole_use_required_before_file_creation(self):
        for kwargs in [dict(approved_policy=False),dict(sole_use_account=False)]:
            with self.assertRaises(m.AutomaticHeld):self.prepare(**kwargs)
            self.assertFalse(self.path.exists())

    def test_fresh_anchor_known_headroom_and_expiry_required(self):
        for kwargs in [dict(observed_at=0),dict(observed_at=1001),dict(source_headroom=1),
                       dict(expires_at=1000),dict(expires_at=1001+m.MAX_PLAN_AGE),
                       dict(storage_upper_bound=m.MAX_STORAGE),dict(class_c_upper_bound=None)]:
            with self.assertRaises(m.AutomaticHeld):self.prepare(**kwargs)
            self.assertFalse(self.path.exists())

    def test_whole_run_reserved_before_callback_and_never_refunded(self):
        self.prepare()
        def operation():
            self.assertEqual(self.row()[:5],(100+m.MAX_ENVELOPE,200+m.MAX_ENVELOPE,104,104,m.SOURCE_PER_RUN))
            return {'fixture':True}
        self.assertEqual(m.run_reserved(self.path,now=1000,operation=operation),{'fixture':True})
        self.assertIsNone(self.row()[-1])
        with self.assertRaises(m.AutomaticHeld):
            m.run_reserved(self.path,now=1000+m.MIN_INTERVAL,operation=lambda:(_ for _ in ()).throw(OSError('private')))
        self.assertEqual(self.row()[0],100+2*m.MAX_ENVELOPE)

    def test_no_midnight_counter_reset_or_retry(self):
        self.prepare();m.run_reserved(self.path,now=1000,operation=lambda:None)
        with self.assertRaises(m.AutomaticHeld):m.run_reserved(self.path,now=1001,operation=lambda:self.fail('called'))
        m.run_reserved(self.path,now=86400,operation=lambda:None)
        self.assertEqual(self.row()[2:4],(108,108))

    def test_unresolved_crash_blocks_future_run(self):
        self.prepare()
        with self.assertRaises(KeyboardInterrupt):
            m.run_reserved(self.path,now=1000,operation=lambda:(_ for _ in ()).throw(KeyboardInterrupt()))
        self.assertIsNotNone(self.row()[-1])
        with self.assertRaises(m.AutomaticHeld):m.run_reserved(self.path,now=90000,operation=lambda:self.fail('called'))

    def test_expired_clock_reversal_and_limits_hold_before_callback(self):
        self.prepare()
        for now in [999,1000+m.MAX_PLAN_AGE]:
            with self.assertRaises(m.AutomaticHeld):m.run_reserved(self.path,now=now,operation=lambda:self.fail('called'))
        for field,limit in [('stored',m.MAX_STORAGE),('downloaded',m.MAX_DOWNLOAD),
                            ('class_b',m.MAX_REQUESTS),('class_c',m.MAX_REQUESTS),('source_bytes',m.MAX_SOURCE_TOTAL)]:
            before=self.row()
            with sqlite3.connect(self.path) as db:db.execute('UPDATE policy SET '+field+'=?',(limit,))
            with self.assertRaises(m.AutomaticHeld):m.run_reserved(self.path,now=1000,operation=lambda:self.fail('called'))
            with sqlite3.connect(self.path) as db:
                db.execute('UPDATE policy SET stored=?,downloaded=?,class_b=?,class_c=?,source_bytes=?,last_run=?,active=?',before)

    def test_existing_policy_never_overwritten(self):
        self.prepare();before=self.path.read_bytes()
        with self.assertRaises(FileExistsError):self.prepare()
        self.assertEqual(self.path.read_bytes(),before)

    def test_missing_or_shared_state_never_creates_new_ledger(self):
        with self.assertRaises(m.AutomaticHeld):m.run_reserved(self.path,now=1000,operation=lambda:self.fail('called'))
        self.assertFalse(self.path.exists())
        self.prepare();self.path.chmod(0o644)
        with self.assertRaises(Exception):m.run_reserved(self.path,now=1000,operation=lambda:self.fail('called'))

    def test_missing_attempt_history_keeps_run_unresolved(self):
        self.prepare()
        def operation():
            with sqlite3.connect(self.path) as db:db.execute('DELETE FROM attempts')
        with self.assertRaises(m.AutomaticHeld):m.run_reserved(self.path,now=1000,operation=operation)
        self.assertIsNotNone(self.row()[-1])
