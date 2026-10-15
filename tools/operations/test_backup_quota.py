"""Private temporary ledgers, fake operations only. No cloud requests."""
import concurrent.futures
import tempfile
import unittest
from pathlib import Path
from backup_quota import prepare_ledger, run_guarded, QuotaHeld, STORAGE_LIMIT, CLASS_A_LIMIT, CLASS_B_LIMIT


class BackupQuotaTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'private.sqlite'
        self.calls = []

    def baseline(self, **changes):
        args = dict(period_start=100, period_end=10000, observed_at=200,
                    stored_bytes=0, class_a=0, class_b=0)
        args.update(changes)
        prepare_ledger(self.path, **args)

    def request(self, **changes):
        args = dict(now=201, upload_bytes=10, class_a=1, class_b=0,
                    operation=lambda: self.calls.append('called'))
        args.update(changes)
        return run_guarded(self.path, **args)

    def test_missing_baseline_never_calls_operation(self):
        with self.assertRaises(QuotaHeld): self.request()
        self.assertEqual(self.calls, [])
        self.assertFalse(self.path.exists())

    def test_room_for_exact_reservation_then_block(self):
        self.baseline(stored_bytes=STORAGE_LIMIT-10)
        self.request()
        with self.assertRaisesRegex(QuotaHeld, 'storage-limit'): self.request()
        self.assertEqual(self.calls, ['called'])

    def test_failed_remote_operation_keeps_reservation(self):
        self.baseline(stored_bytes=STORAGE_LIMIT-10)
        def fail(): raise RuntimeError('fixture transport failure')
        with self.assertRaises(RuntimeError): self.request(operation=fail)
        with self.assertRaisesRegex(QuotaHeld, 'storage-limit'): self.request()
        self.assertEqual(self.calls, [])

    def test_competing_writers_cannot_both_use_last_capacity(self):
        self.baseline(stored_bytes=STORAGE_LIMIT-10)
        def attempt(_):
            try:
                self.request()
                return 'allowed'
            except QuotaHeld: return 'held'
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            self.assertCountEqual(list(pool.map(attempt, range(2))), ['allowed','held'])
        self.assertEqual(self.calls, ['called'])

    def test_existing_ledger_cannot_be_reinitialized(self):
        self.baseline(stored_bytes=STORAGE_LIMIT)
        with self.assertRaises(FileExistsError): self.baseline()
        with self.assertRaises(QuotaHeld): self.request()

    def test_both_operation_classes_are_bounded(self):
        self.baseline(class_a=CLASS_A_LIMIT-1, class_b=CLASS_B_LIMIT-1)
        self.request(class_b=1)
        for changes in [dict(upload_bytes=0),dict(upload_bytes=0,class_a=0,class_b=1)]:
            with self.assertRaisesRegex(QuotaHeld, 'request-limit'): self.request(**changes)
        self.assertEqual(self.calls, ['called'])

    def test_stale_backward_and_new_period_refuse_before_operation(self):
        self.baseline()
        for now in [199,501,10000]:
            with self.assertRaises(QuotaHeld): self.request(now=now)
        self.assertEqual(self.calls, [])

    def test_bad_request_cannot_decrease_usage(self):
        self.baseline()
        for changes in [dict(upload_bytes=-10),dict(class_a=True),dict(class_a=0),dict(upload_bytes=0,class_a=0,class_b=0)]:
            with self.assertRaises(QuotaHeld): self.request(**changes)
        self.assertEqual(self.calls, [])

    def test_corrupted_ledger_refuses(self):
        self.path.write_bytes(b'corrupted fixture')
        with self.assertRaisesRegex(QuotaHeld, 'ledger-unavailable'): self.request()
        self.assertEqual(self.calls, [])

    def test_private_permissions_and_overhead_accounting(self):
        self.baseline(stored_bytes=STORAGE_LIMIT-10)
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o600)
        with self.assertRaisesRegex(QuotaHeld, 'storage-limit'): self.request(upload_bytes=11)
        self.assertEqual(self.calls, [])
