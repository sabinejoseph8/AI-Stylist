"""Synthetic drill helpers only, not a production backup format or restore endpoint."""
import hashlib
import hmac
import json


def manifest(objects, database_digest, captured_at, key):
    body = json.dumps({'database': database_digest, 'captured_at': captured_at,
                       'objects': {name: hashlib.sha256(data).hexdigest()
                                   for name, data in objects.items()}}, sort_keys=True).encode()
    return body, hmac.digest(key, body, 'sha256')


def restore_objects(objects, body, signature, key, database_digest, now, deleted):
    # No partial output when current deletion evidence or any component is absent.
    if deleted is None or not isinstance(deleted, frozenset):
        raise ValueError('deletion-evidence-unavailable')
    if not hmac.compare_digest(signature, hmac.digest(key, body, 'sha256')):
        raise ValueError('manifest-authentication')
    metadata = json.loads(body)
    age = now - metadata['captured_at']
    if age < 0 or age >= 7 * 86400:
        raise ValueError('recovery-point-expired')
    if metadata['database'] != database_digest:
        raise ValueError('database-mismatch')
    if set(objects) != set(metadata['objects']):
        raise ValueError('object-set-mismatch')
    for name, expected in metadata['objects'].items():
        if hashlib.sha256(objects[name]).hexdigest() != expected:
            raise ValueError('object-integrity')
    return {name: bytes(data) for name, data in objects.items() if name not in deleted}
