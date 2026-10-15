"""Explicit read-only B2 credential preflight, at most two HTTP requests.

No uploads/downloads, deletion, retries, redirects, secret output or backup job.
One private receipt reserves the bounded inspection even if it fails.
"""
import argparse
import base64
import json
import os
import re
import socket
import time
import urllib.error
import urllib.request
from pathlib import Path

PRIVATE = Path(__file__).resolve().parent / '.private'
AUTH_URL = 'https://api.backblazeb2.com/b2api/v4/b2_authorize_account'
MAX_RESPONSE = 128_000


class Held(RuntimeError):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise Held('redirect-refused')


def request_json(url, authorization, body=None):
    headers = {'Authorization': authorization}
    if body is not None:
        body = json.dumps(body).encode()
        headers['Content-Type'] = 'application/json'
    request = urllib.request.Request(url, data=body, headers=headers)
    try:
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        with opener.open(request, timeout=10) as response:
            if response.status != 200:
                raise Held('provider-refused')
            data = response.read(MAX_RESPONSE + 1)
            if len(data) > MAX_RESPONSE:
                raise Held('response-too-large')
            return json.loads(data)
    except (urllib.error.URLError, TimeoutError, socket.timeout, json.JSONDecodeError, OSError):
        raise Held('provider-unavailable-or-refused') from None


def validate_authorization(data, config, now):
    try:
        storage = data['apiInfo']['storageApi']
        allowed = storage['allowed']
        if allowed['buckets'] != [{'id': config['B2_BUCKET_ID'], 'name': config['B2_BUCKET_NAME']}]:
            raise Held('bucket-scope-mismatch')
        if allowed['namePrefix'] != 'backups/':
            raise Held('prefix-scope-mismatch')
        capabilities = set(allowed['capabilities'])
        required = {'listFiles', 'readFiles', 'writeFiles', 'deleteFiles'}
        # Bucket-scoped file helpers may be present; administrative scopes refused.
        safe = required | {'shareFiles', 'listBuckets', 'readBuckets', 'readBucketEncryption',
                           'readBucketRetentions', 'readFileRetentions', 'writeFileRetentions',
                           'readFileLegalHolds', 'writeFileLegalHolds'}
        if not required <= capabilities or not capabilities <= safe:
            raise Held('capability-scope-mismatch')
        if not re.fullmatch(r'https://api[0-9]{3}\.backblazeb2\.com', storage['apiUrl']):
            raise Held('api-destination-mismatch')
        expiry = data['applicationKeyExpirationTimestamp']
        if type(expiry) is not int or not now * 1000 < expiry <= (now + 31 * 86400) * 1000:
            raise Held('key-expiry-mismatch')
        token = data['authorizationToken']
        if not isinstance(token, str) or not 16 <= len(token) <= 8192 or '\r' in token or '\n' in token:
            raise Held('authorization-invalid')
        return storage['apiUrl'], token
    except (KeyError, TypeError, ValueError):
        raise Held('authorization-invalid') from None


def inspect(config, call=request_json, now=None):
    now = int(time.time()) if now is None else now
    authorization = base64.b64encode((config['B2_KEY_ID'] + ':' + config['B2_APPLICATION_KEY']).encode()).decode()
    data = call(AUTH_URL, 'Basic ' + authorization)
    api, token = validate_authorization(data, config, now)
    result = call(api + '/b2api/v4/b2_list_file_versions', token,
                  {'bucketId': config['B2_BUCKET_ID'], 'prefix': 'backups/', 'maxFileCount': 100})
    if not isinstance(result, dict) or result.get('files') != [] or result.get('nextFileName') is not None or result.get('nextFileId') is not None:
        raise Held('backup-prefix-not-empty-or-inventory-incomplete')
    return {'scope_verified': True, 'backup_prefix_empty': True, 'requests': 2,
            'uploads': 0, 'downloads': 0, 'billing_guarantee': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inspect-approved-account', action='store_true', required=True)
    parser.parse_args()
    receipt = PRIVATE / 'b2-preflight-held.json'
    try:
        if PRIVATE.stat().st_mode & 0o077:
            raise Held('private-directory-permissions')
        path = PRIVATE / 'b2.env'
        if path.stat().st_mode & 0o077:
            raise Held('private-file-permissions')
        config = {}
        for line in path.read_text().splitlines():
            key, value = line.split('=', 1)
            if key in config: raise Held('duplicate-setting')
            config[key] = value
        if config['B2_PREFIX'] != 'backups/' or not all(config.values()):
            raise Held('configuration-invalid')
        fd = os.open(receipt, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as out:
            json.dump({'reserved_requests': 2, 'outcome': 'held', 'created_at': int(time.time())}, out)
        result = inspect(config)
        receipt.write_text(json.dumps({'reserved_requests': 2, 'outcome': 'inspected', 'result': result}))
        print(json.dumps(result))
    except (Held, OSError, ValueError, KeyError) as error:
        category = str(error) if isinstance(error, Held) else 'configuration-or-receipt-unavailable'
        print(json.dumps({'result': 'held', 'category': category, 'retry': False}))
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
