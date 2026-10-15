"""Made-up bytes only. No filesystem archives, keys, account or network access."""
import unittest
from recovery_objects import manifest, restore_objects


class ObjectRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.objects = {'kept': b'synthetic-image-a', 'deleted': b'synthetic-image-b'}
        self.key = b'fixture-key-not-a-production-secret'
        self.body, self.signature = manifest(self.objects, 'database-fixture', 100, self.key)

    def restore(self, **changes):
        args = dict(objects=self.objects, body=self.body, signature=self.signature,
                    key=self.key, database_digest='database-fixture', now=200,
                    deleted=frozenset({'deleted'}))
        args.update(changes)
        return restore_objects(**args)

    def test_deleted_object_is_not_restored(self):
        self.assertEqual(self.restore(), {'kept': b'synthetic-image-a'})
        self.assertEqual(len(self.objects), 2)  # Protected backup remains separate.

    def test_wrong_key(self):
        with self.assertRaisesRegex(ValueError, 'manifest-authentication'):
            self.restore(key=b'wrong')

    def test_modified_manifest(self):
        with self.assertRaisesRegex(ValueError, 'manifest-authentication'):
            self.restore(body=self.body + b' ')

    def test_missing_object(self):
        with self.assertRaisesRegex(ValueError, 'object-set-mismatch'):
            self.restore(objects={'kept': self.objects['kept']})

    def test_corrupt_object(self):
        with self.assertRaisesRegex(ValueError, 'object-integrity'):
            self.restore(objects={**self.objects, 'kept': b'corrupt'})

    def test_other_database_point(self):
        with self.assertRaisesRegex(ValueError, 'database-mismatch'):
            self.restore(database_digest='other-point')

    def test_unknown_deletions(self):
        with self.assertRaisesRegex(ValueError, 'deletion-evidence-unavailable'):
            self.restore(deleted=None)

    def test_retention_boundary(self):
        self.assertTrue(self.restore(now=100 + 7 * 86400 - 1))
        with self.assertRaisesRegex(ValueError, 'recovery-point-expired'):
            self.restore(now=100 + 7 * 86400)

    def test_backward_clock(self):
        with self.assertRaisesRegex(ValueError, 'recovery-point-expired'):
            self.restore(now=99)
