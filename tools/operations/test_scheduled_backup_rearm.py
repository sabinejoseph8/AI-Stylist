import hashlib
import json
from pathlib import Path
import plistlib
import sqlite3
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from b2_automatic_budget import prepare
from backup_runtime import prepare_public, write_exclusive
import scheduled_backup_rearm as m


class ScheduledRearmTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name).resolve()
        source = self.base / 'source/tools/operations'
        source.mkdir(parents=True)
        (source / 'backup_runtime.py').write_text('# synthetic public runtime')
        self.root = self.base / 'runtime'
        prepare_public(self.base / 'source', self.root, m.SOURCE)
        self.private = self.root / 'tools/operations/.private'
        prepare(self.private / 'automatic-budget.sqlite', now=1000, observed_at=1000,
                storage_upper_bound=0, download_upper_bound=0, class_b_upper_bound=0,
                class_c_upper_bound=0, source_headroom=2_000_000_000, expires_at=100000,
                sole_use_account=True, approved_policy=True)
        self.hold = self.private / 'automatic-operator-hold.json'
        self.old = b'{"state":"held","reason":"repair-start-unconfirmed"}'
        write_exclusive(self.hold, self.old)
        self.approval = dict(approved=True, scope=m.SCOPE, maximum_new_attempts=1,
            method='regular-scheduled-check', resume_only_after_verified_success=True,
            stop_on_failure=True, source_commit=m.SOURCE, approved_at=1000,
            hold_sha256=hashlib.sha256(self.old).hexdigest(),
            financial_baseline=m.financial(self.private), native_runs=3)
        for name, value in [('descriptor', None), ('native_status', 3), ('local_ready', None)]:
            mock = patch.object(m, name, return_value=value)
            setattr(self, name, mock.start())
            self.addCleanup(mock.stop)

    def approve(self):
        write_exclusive(self.private / m.APPROVAL, json.dumps(self.approval).encode())

    def test_missing_approval_never_changes_hold_or_budget(self):
        before = m.financial(self.private)
        with self.assertRaises(FileNotFoundError):
            m.arm(self.root, now=1001)
        self.assertEqual(self.hold.read_bytes(), self.old)
        self.assertEqual(m.financial(self.private), before)
        self.local_ready.assert_not_called()

    def test_approved_arm_archives_hold_without_starting_or_spending(self):
        self.approve()
        before = (self.private / 'automatic-budget.sqlite').read_bytes()
        with patch.object(m.subprocess, 'run', side_effect=AssertionError('no process start')):
            result = m.arm(self.root, now=1001)
        self.assertEqual(result['state'], 'awaiting-regular-scheduled-check')
        self.assertFalse(result['process_started_by_operator'])
        self.assertFalse(result['backup_success_verified'])
        self.assertFalse(self.hold.exists())
        self.assertEqual((self.private / 'automatic-operator-holds/hold-before-scheduled-rearm-20261018.json').read_bytes(), self.old)
        self.assertEqual((self.private / 'automatic-budget.sqlite').read_bytes(), before)
        self.assertEqual((self.private / m.MARKER).stat().st_mode & 0o077, 0)

    def test_consumed_authorization_cannot_be_repeated(self):
        self.approve()
        m.arm(self.root, now=1001)
        self.local_ready.reset_mock()
        with self.assertRaisesRegex(m.RearmHeld, 'already-consumed'):
            m.arm(self.root, now=1002)
        self.local_ready.assert_not_called()

    def test_unsettled_native_job_retains_unused_authorization(self):
        self.approve()
        self.native_status.side_effect = m.RearmHeld('native-job-not-settled')
        with self.assertRaisesRegex(m.RearmHeld, 'not-settled'):
            m.arm(self.root, now=1001)
        self.assertEqual(self.hold.read_bytes(), self.old)
        self.assertFalse((self.private / m.MARKER).exists())
        self.local_ready.assert_not_called()

    def test_financial_change_during_local_preflight_refuses_before_consumption(self):
        self.approve()
        def changed():
            with sqlite3.connect(self.private / 'automatic-budget.sqlite') as db:
                db.execute('UPDATE policy SET last_run=1001 WHERE id=1')
        self.local_ready.side_effect = changed
        with self.assertRaisesRegex(m.RearmHeld, 'state-changed'):
            m.arm(self.root, now=1001)
        self.assertTrue(self.hold.exists())
        self.assertFalse((self.private / m.MARKER).exists())

    def test_crash_after_marker_keeps_old_hold_and_consumed_authority(self):
        self.approve()
        with patch.object(m.os, 'rename', side_effect=OSError('synthetic interruption')):
            with self.assertRaises(OSError):
                m.arm(self.root, now=1001)
        self.assertEqual(self.hold.read_bytes(), self.old)
        self.assertTrue((self.private / m.MARKER).exists())
        with self.assertRaisesRegex(m.RearmHeld, 'already-consumed'):
            m.arm(self.root, now=1002)

    def test_crash_after_archiving_restores_hold_without_refunding_authority(self):
        self.approve()
        real_flush = m.flush
        def interrupted(path):
            if path.name == 'automatic-operator-holds':
                raise OSError('synthetic fsync failure')
            real_flush(path)
        with patch.object(m, 'flush', side_effect=interrupted):
            with self.assertRaises(OSError):
                m.arm(self.root, now=1001)
        self.assertEqual(json.loads(self.hold.read_text())['reason'], 'scheduled-rearm-unconfirmed')
        self.assertTrue((self.private / m.MARKER).exists())
        self.assertEqual(m.financial(self.private)['count'], 0)

    def test_wrong_scope_and_expired_approval_hold_without_local_work(self):
        self.approval['scope'] = 'customer-photos'
        self.approve()
        with self.assertRaisesRegex(m.RearmHeld, 'fresh-approval'):
            m.arm(self.root, now=1001)
        self.assertTrue(self.hold.exists())
        self.local_ready.assert_not_called()
        self.approval['scope'] = m.SCOPE
        (self.private / m.APPROVAL).write_text(json.dumps(self.approval))
        with self.assertRaisesRegex(m.RearmHeld, 'fresh-approval'):
            m.arm(self.root, now=8200)
        self.assertFalse((self.private / m.MARKER).exists())

    def test_boolean_attempt_limit_is_not_an_integer_allowance(self):
        self.approval['maximum_new_attempts'] = True
        self.approve()
        with self.assertRaisesRegex(m.RearmHeld, 'fresh-approval'):
            m.arm(self.root, now=1001)
        self.local_ready.assert_not_called()

    def test_missing_local_daemon_retains_hold_and_unused_authority(self):
        self.approve()
        self.local_ready.side_effect = m.RearmHeld('local-docker-not-ready')
        with self.assertRaisesRegex(m.RearmHeld, 'not-ready'):
            m.arm(self.root, now=1001)
        self.assertEqual(self.hold.read_bytes(), self.old)
        self.assertFalse((self.private / m.MARKER).exists())

    def test_unprotected_approval_refused(self):
        self.approve()
        (self.private / m.APPROVAL).chmod(0o644)
        with self.assertRaises(Exception):
            m.arm(self.root, now=1001)
        self.assertTrue(self.hold.exists())
        self.assertFalse((self.private / m.MARKER).exists())


class NativeReadTests(unittest.TestCase):
    def test_native_parser_requires_terminated_job_with_verified_exit(self):
        valid = '\tstate = not running\n\truns = 3\n\tlast exit code = 1\n'
        with patch.object(m.subprocess, 'run', return_value=SimpleNamespace(returncode=0, stdout=valid)):
            self.assertEqual(m.native_status(), 3)
        for text in [valid.replace('not running', 'spawn scheduled'), valid + '\tpid = 123\n',
                     valid.replace('exit code = 1', 'exit code = 0'), valid.replace('runs = 3', 'runs = unknown')]:
            with patch.object(m.subprocess, 'run', return_value=SimpleNamespace(returncode=0, stdout=text)):
                with self.assertRaises(m.RearmHeld):
                    m.native_status()

    def test_descriptor_read_requires_existing_regular_check_and_repaired_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            home = Path(tmp).resolve()
            target = home / 'Library/LaunchAgents/com.ai-stylist.backups.plist'
            target.parent.mkdir(parents=True)
            root = home / 'runtime'
            executable = home / 'python'
            executable.write_text('# fixture, never executed'); executable.chmod(0o700)
            d = dict(Label='com.ai-stylist.backups', Disabled=False, KeepAlive=False,
                StartInterval=900, WorkingDirectory=str(root), EnvironmentVariables={'PATH': m.JOB_PATH},
                ProgramArguments=[str(executable), str(root / 'tools/operations/automatic_empty_job.py'), '--run-approved-empty-database-job'])
            target.write_bytes(plistlib.dumps(d)); target.chmod(0o600)
            with patch.object(m.Path, 'home', return_value=home):
                m.descriptor(root)
                d['StartInterval'] = 1
                target.write_bytes(plistlib.dumps(d))
                with self.assertRaisesRegex(m.RearmHeld, 'descriptor-held'):
                    m.descriptor(root)


if __name__ == '__main__':
    unittest.main()
