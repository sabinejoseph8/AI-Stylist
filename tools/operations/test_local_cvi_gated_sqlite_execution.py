"""Disabled driver entry checks. Actual commit integration is exercised by Node."""
import json
import subprocess
import sys
import unittest
from pathlib import Path


class GatedSqliteEntryTests(unittest.TestCase):
    def test_rejects_extra_driver_config_modes_or_relative_roots_before_native_work(self):
        base = dict(root='/private/tmp/not-a-stylist-store', plan={'kind': 'activate'},
                    command={}, principal='fixture_rotator')
        for patch in [dict(config={}), dict(mode='observe'), dict(crash='after-commit'),
                      dict(root='relative'), dict(plan={'kind': 'apply'})]:
            with self.subTest(patch=patch):
                result = subprocess.run(
                    [sys.executable, str(Path(__file__).with_name('local_cvi_gated_sqlite_execution.py'))],
                    input=json.dumps({**base, **patch}), text=True, capture_output=True, timeout=5)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(json.loads(result.stdout), {'stage': 'held'})
                self.assertEqual(result.stderr, '')


if __name__ == '__main__':
    unittest.main()
