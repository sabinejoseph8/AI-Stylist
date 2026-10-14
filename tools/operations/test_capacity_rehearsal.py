"""Invalid invocation must terminate before local Docker or any database access."""
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]


class CapacityInvocationTests(unittest.TestCase):
    def python(self, *args):
        return subprocess.run([sys.executable, str(Path(__file__).with_name('rehearse-capacity.py')), *args], capture_output=True, timeout=5)

    def node(self, *args):
        return subprocess.run(['node', str(ROOT / 'apps/foundation/scripts/check-failure-capacity-db.ts'), *args], capture_output=True, timeout=5)

    def test_explicit_opt_in_required(self):
        self.assertEqual(self.python().returncode, 2)

    def test_no_remote_target_argument(self):
        self.assertEqual(self.python('--run-local-synthetic', '--database-url', 'postgresql://example.invalid').returncode, 2)

    def test_no_existing_container_argument(self):
        self.assertEqual(self.python('--run-local-synthetic', '--container', 'production').returncode, 2)

    def test_no_credential_argument(self):
        self.assertEqual(self.python('--run-local-synthetic', '--password', 'synthetic').returncode, 2)

    def test_help_starts_nothing(self):
        self.assertEqual(self.python('--help').returncode, 0)

    def test_driver_rejects_foreign_container(self):
        self.assertNotEqual(self.node('production', 'before-restart').returncode, 0)

    def test_driver_rejects_missing_phase(self):
        self.assertNotEqual(self.node('stylist-capacity-' + 'a' * 12).returncode, 0)

    def test_driver_rejects_unknown_phase(self):
        self.assertNotEqual(self.node('stylist-capacity-' + 'a' * 12, 'deploy').returncode, 0)


if __name__ == '__main__':
    unittest.main()
