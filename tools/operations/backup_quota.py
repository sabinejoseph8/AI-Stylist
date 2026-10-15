"""Local backup admission control. No provider transport or scheduler is activated.

The future runner must route every R2 request through this owner. Baselines must
include the whole account, pending uploads and prior billing-period usage.
This does not impose a Cloudflare billing cap or control other credentials.
"""
import os
import sqlite3
from pathlib import Path

STORAGE_LIMIT = 9_000_000_000  # Decimal bytes, margin below the approved 10 GB.
CLASS_A_LIMIT = 900_000
CLASS_B_LIMIT = 9_000_000
MAX_BASELINE_AGE = 300


class QuotaHeld(RuntimeError):
    pass


def _number(value):
    return type(value) is int and value >= 0


def prepare_ledger(path, *, period_start, period_end, observed_at,
                   stored_bytes, class_a, class_b):
    """Explicit initial baseline, never overwrites an existing ledger.

    No refresh/reset interface: ambiguous writes remain charged to local bounds
    until a separately reviewed authoritative reconciliation is implemented.
    """
    values = (period_start, period_end, observed_at, stored_bytes, class_a, class_b)
    if not all(_number(v) for v in values) or not period_start <= observed_at < period_end:
        raise QuotaHeld('invalid-baseline')
    path = Path(path)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.close(descriptor)
    with sqlite3.connect(path) as db:
        db.execute('CREATE TABLE quota (id INTEGER PRIMARY KEY CHECK(id=1), '
                   'period_start INTEGER, period_end INTEGER, observed_at INTEGER, '
                   'stored_bytes INTEGER, class_a INTEGER, class_b INTEGER)')
        db.execute('INSERT INTO quota VALUES (1,?,?,?,?,?,?)', values)


def run_guarded(path, *, now, upload_bytes, class_a, class_b, operation):
    """Persist a conservative reservation before invoking exactly one operation.

    Failed operations keep all reservations. Non-upload requests reserve zero
    bytes. Include encryption/manifest overhead in upload_bytes. A new billing
    period, stale baseline, missing ledger or oversized request holds execution.
    """
    if not all(_number(v) for v in (now, upload_bytes, class_a, class_b)):
        raise QuotaHeld('invalid-request')
    if class_a + class_b == 0 or (upload_bytes and class_a == 0):
        raise QuotaHeld('unaccounted-request')
    path = Path(path)
    if not path.is_file():
        raise QuotaHeld('baseline-unavailable')
    try:
        with sqlite3.connect(path, timeout=5) as db:
            db.execute('BEGIN IMMEDIATE')
            rows = db.execute('SELECT period_start,period_end,observed_at,stored_bytes,'
                              'class_a,class_b FROM quota WHERE id=1').fetchall()
            if len(rows) != 1 or not all(_number(v) for v in rows[0]):
                raise QuotaHeld('baseline-unavailable')
            start, end, observed, size, a, b = rows[0]
            if not start <= observed <= now < end or now - observed > MAX_BASELINE_AGE:
                raise QuotaHeld('baseline-stale-or-period-changed')
            if size + upload_bytes > STORAGE_LIMIT:
                raise QuotaHeld('storage-limit')
            if a + class_a > CLASS_A_LIMIT or b + class_b > CLASS_B_LIMIT:
                raise QuotaHeld('request-limit')
            db.execute('UPDATE quota SET stored_bytes=?,class_a=?,class_b=? WHERE id=1',
                       (size + upload_bytes, a + class_a, b + class_b))
            db.commit()
    except sqlite3.Error:
        raise QuotaHeld('ledger-unavailable') from None
    # Commit happens first. A crash here cannot refund an uncertain remote write.
    return operation()
