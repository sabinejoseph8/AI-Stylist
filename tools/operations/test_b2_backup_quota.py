"""Simulated operations and private temporary ledgers only."""
import concurrent.futures
import tempfile
import unittest
from pathlib import Path
from b2_backup_quota import prepare_b2_ledger, run_b2_guarded, STORAGE_LIMIT, DOWNLOAD_LIMIT, REQUEST_LIMIT, SNAPSHOT_LIMIT
from backup_quota import QuotaHeld


class B2QuotaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'b2.sqlite'
        self.calls = []

    def baseline(self, **changes):
        args = dict(observed_at=100, stored_bytes=0, downloaded_bytes=0, class_b=0, class_c=0)
        args.update(changes)
        prepare_b2_ledger(self.path, **args)

    def request(self, **changes):
        args = dict(now=101, class_c=1, operation=lambda: self.calls.append('called'))
        args.update(changes)
        return run_b2_guarded(self.path, **args)

    def test_unknown_baseline(self):
        with self.assertRaises(QuotaHeld): self.request()
        self.assertFalse(self.path.exists())
        self.assertEqual(self.calls, [])

    def test_snapshot_restore_bound_counts_encrypted_overhead(self):
        self.baseline()
        with self.assertRaisesRegex(QuotaHeld, 'restore-size-limit'):
            self.request(upload_bytes=SNAPSHOT_LIMIT+1)
        self.assertEqual(self.calls, [])

    def test_capacity_includes_old_copies_and_uncertain_uploads(self):
        self.baseline(stored_bytes=STORAGE_LIMIT-10)
        def fail(): raise RuntimeError('simulated lost acknowledgment')
        with self.assertRaises(RuntimeError): self.request(upload_bytes=10, operation=fail)
        with self.assertRaisesRegex(QuotaHeld, 'storage-limit'): self.request(upload_bytes=1)
        self.assertEqual(self.calls, [])

    def test_competing_downloads_cannot_overdraw(self):
        self.baseline(downloaded_bytes=DOWNLOAD_LIMIT-10)
        def attempt(_):
            try:
                self.request(download_bytes=10, class_b=1)
                return 'allowed'
            except QuotaHeld: return 'held'
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            self.assertCountEqual(list(pool.map(attempt, range(2))), ['allowed','held'])
        self.assertEqual(self.calls, ['called'])

    def test_daily_request_caps_apply_independently(self):
        self.baseline(class_b=REQUEST_LIMIT, class_c=REQUEST_LIMIT)
        for changes in [dict(class_b=1,class_c=0),dict(class_b=0,class_c=1)]:
            with self.assertRaisesRegex(QuotaHeld, 'request-limit'): self.request(**changes)
        self.assertEqual(self.calls, [])

    def test_daily_boundary_does_not_reset_consumption(self):
        self.baseline(observed_at=86399)
        with self.assertRaisesRegex(QuotaHeld, 'day-changed'): self.request(now=86400)
        with self.assertRaises(FileExistsError): self.baseline(observed_at=86400)
        self.assertEqual(self.calls, [])

    def test_stale_backwards_invalid_and_unaccounted(self):
        self.baseline()
        for changes in [dict(now=401),dict(now=99),dict(upload_bytes=-1),
                        dict(class_c=True),dict(class_c=0),dict(download_bytes=1)]:
            with self.assertRaises(QuotaHeld): self.request(**changes)
        self.assertEqual(self.calls, [])

    def test_download_failure_keeps_reserved_bytes(self):
        self.baseline(downloaded_bytes=DOWNLOAD_LIMIT-10)
        def fail(): raise RuntimeError('simulated interrupted download')
        with self.assertRaises(RuntimeError):
            self.request(download_bytes=10, class_b=1, operation=fail)
        with self.assertRaisesRegex(QuotaHeld, 'download-limit'):
            self.request(download_bytes=1, class_b=1)

    def test_corrupt_ledger_never_executes(self):
        self.path.write_bytes(b'not a database')
        with self.assertRaisesRegex(QuotaHeld, 'ledger-unavailable'): self.request()
        self.assertEqual(self.calls, [])
