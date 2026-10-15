"""B2-specific admission preparation; no live transport, baseline or schedule.

Observed free-account caps differ from R2. All requests must use this owner;
other writers are outside its protection. Failed reservations are never refunded.
"""
import os
import sqlite3
from pathlib import Path
from backup_quota import QuotaHeld, _number

STORAGE_LIMIT = 9_000_000_000
DOWNLOAD_LIMIT = 900_000_000
REQUEST_LIMIT = 2_000  # Each of observed daily Class B and C caps is 2,500.
SNAPSHOT_LIMIT = 500_000_000  # Includes encrypted archive and manifest bytes.
MAX_BASELINE_AGE = 300


def prepare_b2_ledger(path, *, observed_at, stored_bytes, downloaded_bytes, class_b, class_c):
    values = (observed_at, stored_bytes, downloaded_bytes, class_b, class_c)
    if not all(_number(v) for v in values):
        raise QuotaHeld('invalid-baseline')
    fd = os.open(Path(path), os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.close(fd)
    with sqlite3.connect(path) as db:
        db.execute('CREATE TABLE quota (id INTEGER PRIMARY KEY CHECK(id=1), '
                   'observed_at INTEGER, stored_bytes INTEGER, downloaded_bytes INTEGER, '
                   'class_b INTEGER, class_c INTEGER)')
        db.execute('INSERT INTO quota VALUES (1,?,?,?,?,?)', values)


def run_b2_guarded(path, *, now, upload_bytes=0, download_bytes=0,
                   class_b=0, class_c=0, operation):
    """Reserve worst-case bytes/requests before one bounded callback, no retry.

    Upload_bytes is the entire snapshot size, including encrypted overhead. The
    caller must separately reject unbounded streams, redirects, extra requests,
    unknown operation classes, public access and billable optional features.
    No multipart upload or Class D event service is permitted by this helper.
    """
    if not all(_number(v) for v in (now, upload_bytes, download_bytes, class_b, class_c)):
        raise QuotaHeld('invalid-request')
    if class_b + class_c == 0 or (download_bytes and class_b == 0):
        raise QuotaHeld('unaccounted-request')
    if upload_bytes > SNAPSHOT_LIMIT:
        raise QuotaHeld('restore-size-limit')
    if not Path(path).is_file():
        raise QuotaHeld('baseline-unavailable')
    try:
        with sqlite3.connect(path, timeout=5) as db:
            db.execute('BEGIN IMMEDIATE')
            rows = db.execute('SELECT observed_at,stored_bytes,downloaded_bytes,class_b,class_c '
                              'FROM quota WHERE id=1').fetchall()
            if len(rows) != 1 or not all(_number(v) for v in rows[0]):
                raise QuotaHeld('baseline-unavailable')
            observed, size, downloaded, b, c = rows[0]
            if not observed <= now <= observed + MAX_BASELINE_AGE or now // 86400 != observed // 86400:
                raise QuotaHeld('baseline-stale-or-day-changed')
            if size + upload_bytes > STORAGE_LIMIT:
                raise QuotaHeld('storage-limit')
            if downloaded + download_bytes > DOWNLOAD_LIMIT:
                raise QuotaHeld('download-limit')
            if b + class_b > REQUEST_LIMIT or c + class_c > REQUEST_LIMIT:
                raise QuotaHeld('request-limit')
            db.execute('UPDATE quota SET stored_bytes=?,downloaded_bytes=?,class_b=?,class_c=? '
                       'WHERE id=1', (size + upload_bytes, downloaded + download_bytes,
                                      b + class_b, c + class_c))
            db.commit()
    except sqlite3.Error:
        raise QuotaHeld('ledger-unavailable') from None
    return operation()
