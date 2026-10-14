"""No Docker/provider access in these integrity boundary unit tests."""
import hashlib
import importlib.util
from pathlib import Path
import unittest
import subprocess
import sys

spec = importlib.util.spec_from_file_location('rehearsal', Path(__file__).with_name('rehearse-backup.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ArchiveIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.archive = b'PGDMPsynthetic-fixture-only'
        self.digest = hashlib.sha256(self.archive).hexdigest()

    def test_matching_archive(self):
        self.assertTrue(module.verify_archive(self.archive, self.digest))

    def test_truncated(self):
        self.assertFalse(module.verify_archive(self.archive[:-1], self.digest))

    def test_mutated(self):
        self.assertFalse(module.verify_archive(self.archive + b'x', self.digest))

    def test_wrong_digest(self):
        self.assertFalse(module.verify_archive(self.archive, '0' * 64))

    def test_bad_magic_even_matching_hash(self):
        data = b'not-an-archive'
        self.assertFalse(module.verify_archive(data, hashlib.sha256(data).hexdigest()))

    def test_empty(self):
        self.assertFalse(module.verify_archive(b'', self.digest))

    def test_wrong_types(self):
        self.assertFalse(module.verify_archive('PGDMPtext', self.digest))
        self.assertFalse(module.verify_archive(self.archive, None))

    def test_oversized(self):
        self.assertFalse(module.verify_archive(b'PGDMP' + b'x' * (32 * 1024 * 1024), self.digest))


class InvocationBoundaryTests(unittest.TestCase):
    def call(self, *args):
        return subprocess.run([sys.executable, str(Path(__file__).with_name('rehearse-backup.py')), *args], capture_output=True, timeout=5)

    def test_requires_explicit_opt_in(self):
        self.assertEqual(self.call().returncode, 2)

    def test_rejects_connection_string(self):
        self.assertEqual(self.call('--run-local-synthetic', '--database-url', 'postgresql://example.invalid').returncode, 2)

    def test_rejects_restore_destination(self):
        self.assertEqual(self.call('--run-local-synthetic', '--target', 'production').returncode, 2)

    def test_rejects_backup_file(self):
        self.assertEqual(self.call('--run-local-synthetic', '--backup-path', '/tmp/other.dump').returncode, 2)

    def test_help_starts_nothing(self):
        self.assertEqual(self.call('--help').returncode, 0)


if __name__ == '__main__':
    unittest.main()
