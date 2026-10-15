"""Pure builder for a least-privilege replacement. Does not create a key.

Backblaze's dashboard Read and Write key includes bucket administration.
Creating this exact capability set requires a separately authorized credential
with writeKeys through the Native API. Never generate/reset a master key here.
"""
import re


def replacement_request(account_id, bucket_id):
    if not all(isinstance(v, str) and re.fullmatch(r'[a-zA-Z0-9]{8,64}', v)
               for v in (account_id, bucket_id)):
        raise ValueError('invalid-key-request')
    return {'accountId': account_id, 'keyName': 'ai-stylist-backup-files',
            'bucketIds': [bucket_id], 'namePrefix': 'backups/',
            'validDurationInSeconds': 30 * 86400,
            'capabilities': ['listFiles', 'readFiles', 'writeFiles', 'deleteFiles',
                             'readBucketEncryption']}
