import unittest
from b2_key_request import replacement_request


class ReplacementKeyTests(unittest.TestCase):
    def test_file_access_never_adds_bucket_or_key_administration(self):
        data = replacement_request('fixtureaccount', 'fixturebucket')
        self.assertEqual(set(data['capabilities']),
                         {'listFiles','readFiles','writeFiles','deleteFiles','readBucketEncryption'})
        self.assertEqual(data['bucketIds'], ['fixturebucket'])
        self.assertEqual(data['namePrefix'], 'backups/')
        self.assertEqual(data['validDurationInSeconds'], 2592000)
        self.assertNotIn('writeKeys', data['capabilities'])
        self.assertNotIn('writeBuckets', data['capabilities'])

    def test_invalid_account_or_bucket_never_builds_a_request(self):
        for value in [None, '', '../other', 'x'*65]:
            with self.assertRaises(ValueError): replacement_request(value, 'fixturebucket')
            with self.assertRaises(ValueError): replacement_request('fixtureaccount', value)
