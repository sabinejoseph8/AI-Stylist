"""Approved one-time restricted key creation. Administrator input via private stdin.

At most one authorization and one create call. No retries, key reset/revocation,
backup data access or administrator credential persistence. Ambiguous failures
retain a private held receipt and never repeat creation automatically.
"""
import argparse
import base64
import importlib.util
import json
import os
import re
import sys
import time
from pathlib import Path
from b2_key_request import replacement_request

spec = importlib.util.spec_from_file_location('b2_preflight', Path(__file__).with_name('b2-preflight.py'))
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)
Held = preflight.Held
PRIVATE = Path(__file__).resolve().parent / '.private'


def _credential(value, minimum):
    return isinstance(value, str) and re.fullmatch(r'[A-Za-z0-9_+/=-]{%d,256}' % minimum, value)


def validate_created(result, expected, now):
    try:
        for field in ['accountId','keyName','bucketIds','namePrefix']:
            if result[field] != expected[field]:
                raise Held('created-key-scope-mismatch')
        if (not isinstance(result['capabilities'], list) or
                set(result['capabilities']) != set(expected['capabilities']) or
                len(result['capabilities']) != len(expected['capabilities'])):
            raise Held('created-key-capabilities-mismatch')
        expiry = result['expirationTimestamp']
        if type(expiry) is not int or not now * 1000 < expiry <= (now + 31 * 86400) * 1000:
            raise Held('created-key-expiry-mismatch')
        if not _credential(result['applicationKeyId'],8) or not _credential(result['applicationKey'],16):
            raise Held('created-key-invalid')
        return {'id':result['applicationKeyId'],'secret':result['applicationKey'], 'expiry':expiry}
    except (KeyError, TypeError, ValueError):
        raise Held('created-key-invalid') from None


def create_restricted(administrator, config, call=preflight.request_json, now=None):
    now = int(time.time()) if now is None else now
    if (not isinstance(administrator, dict) or
            set(administrator) != {'id','secret','expected_account_id'} or
            not _credential(administrator['id'],8) or not _credential(administrator['secret'],16)):
        raise Held('administrator-input-invalid')
    expected = replacement_request(administrator['expected_account_id'],config['B2_BUCKET_ID'])
    if config['B2_PREFIX'] != 'backups/': raise Held('configuration-invalid')
    basic = base64.b64encode((administrator['id']+':'+administrator['secret']).encode()).decode()
    auth = call(preflight.AUTH_URL,'Basic '+basic)
    try:
        if auth['accountId'] != expected['accountId']: raise Held('administrator-account-mismatch')
        api = auth['apiInfo']['storageApi']
        if 'writeKeys' not in api['allowed']['capabilities']: raise Held('administrator-authority-missing')
        if not re.fullmatch(r'https://api[0-9]{3}\.backblazeb2\.com',api['apiUrl']):
            raise Held('administrator-destination-invalid')
        token=auth['authorizationToken']
        if not isinstance(token,str) or not 16<=len(token)<=8192 or '\r' in token or '\n' in token:
            raise Held('administrator-token-invalid')
        result=call(api['apiUrl']+'/b2api/v4/b2_create_key',token,expected)
        return validate_created(result,expected,now)
    except (KeyError, TypeError, ValueError):
        raise Held('administrator-response-invalid') from None


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--create-approved-restricted-key',action='store_true',required=True)
    parser.parse_args()
    administrator=None
    created=None
    try:
        if PRIVATE.stat().st_mode & 0o077: raise Held('private-directory-permissions')
        original=PRIVATE/'b2.env'
        if original.stat().st_mode & 0o077: raise Held('private-file-permissions')
        config=dict(line.split('=',1) for line in original.read_text().splitlines())
        destination=PRIVATE/'b2-restricted.env'
        if destination.exists(): raise Held('replacement-already-stored')
        # Permanent attempt guard, before reading administrator input or any call.
        fd=os.open(PRIVATE/'b2-key-creation-held.json',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as out:
            json.dump({'reserved_requests':2,'outcome':'held','created_at':int(time.time())},out)
        print('Ready for administrator JSON on private stdin; input is not echoed.',flush=True)
        if sys.stdin.isatty(): raise Held('private-pipe-required')
        raw=sys.stdin.buffer.read(4097)
        if len(raw)>4096: raise Held('administrator-input-too-large')
        administrator=json.loads(raw)
        raw=None
        created=create_restricted(administrator,config)
        administrator=None
        fd=os.open(destination,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as out:
            out.write('B2_KEY_ID='+created['id']+'\nB2_APPLICATION_KEY='+created['secret']+'\n'
                      'B2_BUCKET_ID='+config['B2_BUCKET_ID']+'\nB2_BUCKET_NAME='+config['B2_BUCKET_NAME']+
                      '\nB2_PREFIX=backups/\n')
            out.flush()
            os.fsync(out.fileno())
        created=None
        # Atomic completion receipt. Existing held receipt remains historical evidence.
        fd=os.open(PRIVATE/'b2-key-creation-completed.json',os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as out:
            json.dump({'result':'restricted-key-stored','max_requests':2,'administrator_saved':False},out)
        print(json.dumps({'result':'restricted-key-stored','administrator_saved':False,
                          'uploads':0,'downloads':0,'retry':False}))
        return 0
    except (Held,OSError,ValueError,KeyError,TypeError) as error:
        category=str(error) if isinstance(error,Held) else 'private-input-or-storage-failure'
        print(json.dumps({'result':'held','category':category,'retry':False}))
        return 1
    finally:
        administrator=None
        created=None


if __name__=='__main__':
    raise SystemExit(main())
