"""Prepared cumulative automatic-run admission policy, not approved or activated.

No scheduler, provider calls, credentials or usage collector. A new owner
decision is required before replacing per-operation fresh-usage admission.
All counters are cumulative from one fresh anchor, never reset or refunded.
"""
import os
from pathlib import Path
import sqlite3
from backup_runtime import private_directory, read_file

MAX_STORAGE = 9_000_000_000
MAX_DOWNLOAD = 900_000_000
MAX_REQUESTS = 2_000
MAX_ENVELOPE = 4*1024*1024
MAX_SOURCE_TOTAL = 2_000_000_000
SOURCE_PER_RUN = 33*1024*1024 + 8192
MIN_INTERVAL = 12*3600
MAX_PLAN_AGE = 30*86400


class AutomaticHeld(RuntimeError):
    pass


def integer(value):
    return type(value) is int and value >= 0


def prepare(path, *, now, observed_at, storage_upper_bound, download_upper_bound,
            class_b_upper_bound, class_c_upper_bound, source_headroom,
            expires_at, sole_use_account=False, approved_policy=False):
    """One exclusive policy database. Evidence must include retained reservations."""
    if approved_policy is not True or sole_use_account is not True:
        raise AutomaticHeld('automatic-policy-approval-required')
    numbers = (now, observed_at, storage_upper_bound, download_upper_bound,
               class_b_upper_bound, class_c_upper_bound, source_headroom, expires_at)
    if (not all(integer(v) for v in numbers) or not observed_at <= now <= observed_at+300 or
            now//86400 != observed_at//86400 or not now < expires_at <= now+MAX_PLAN_AGE or
            storage_upper_bound >= MAX_STORAGE or download_upper_bound >= MAX_DOWNLOAD or
            class_b_upper_bound >= MAX_REQUESTS or class_c_upper_bound >= MAX_REQUESTS or
            source_headroom < MAX_SOURCE_TOTAL):
        raise AutomaticHeld('automatic-anchor-held')
    path = Path(path)
    private_directory(path.parent)
    if path.is_symlink():
        raise AutomaticHeld('automatic-path-held')
    fd = os.open(path, os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW, 0o600)
    os.close(fd)
    with sqlite3.connect(path) as db:
        db.execute('CREATE TABLE policy (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER, '
                   'created INTEGER, expires INTEGER, stored INTEGER, downloaded INTEGER, '
                   'class_b INTEGER, class_c INTEGER, source_bytes INTEGER, last_run INTEGER, active INTEGER)')
        db.execute('CREATE TABLE attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, started INTEGER, outcome TEXT)')
        db.execute('INSERT INTO policy VALUES(1,1,?,?,?,?,?,?,0,NULL,NULL)',
                   (now, expires_at, storage_upper_bound, download_upper_bound,
                    class_b_upper_bound, class_c_upper_bound))


def run_reserved(path, *, now, operation):
    """Reserve the whole bounded run before any callback, including failed runs.

The callback must obey four-request and source/envelope bounds. This helper
does not verify its result or authorize a Healthchecks success signal.
"""
    if not integer(now):
        raise AutomaticHeld('automatic-clock-held')
    path = Path(path)
    private_directory(path.parent)
    # Existing file only. Refuse symbolic/shared/non-owner state before SQLite.
    try:
        read_file(path, private=True, limit=4*1024*1024)
        with sqlite3.connect('file:'+str(path)+'?mode=rw', uri=True, timeout=5) as db:
            db.execute('BEGIN IMMEDIATE')
            rows=db.execute('SELECT version,created,expires,stored,downloaded,class_b,class_c,source_bytes,last_run,active FROM policy WHERE id=1').fetchall()
            if len(rows)!=1:
                raise AutomaticHeld('automatic-ledger-held')
            version,created,expires,stored,downloaded,b,c,source,last,active=rows[0]
            if version!=1 or not all(integer(v) for v in (created,expires,stored,downloaded,b,c,source)):
                raise AutomaticHeld('automatic-ledger-held')
            if not created <= now < expires:
                raise AutomaticHeld('automatic-plan-expired-or-clock-held')
            if active is not None:
                raise AutomaticHeld('automatic-unresolved-attempt-held')
            if last is not None and (not integer(last) or now < last+MIN_INTERVAL):
                raise AutomaticHeld('automatic-interval-held')
            if stored+MAX_ENVELOPE > MAX_STORAGE or downloaded+MAX_ENVELOPE > MAX_DOWNLOAD:
                raise AutomaticHeld('automatic-byte-limit')
            if b+4 > MAX_REQUESTS or c+4 > MAX_REQUESTS:
                raise AutomaticHeld('automatic-request-limit')
            if source+SOURCE_PER_RUN > MAX_SOURCE_TOTAL:
                raise AutomaticHeld('automatic-source-egress-limit')
            attempt=db.execute("INSERT INTO attempts(started,outcome) VALUES(?,'unresolved')",(now,)).lastrowid
            db.execute('UPDATE policy SET stored=?,downloaded=?,class_b=?,class_c=?,source_bytes=?,last_run=?,active=? WHERE id=1',
                       (stored+MAX_ENVELOPE,downloaded+MAX_ENVELOPE,b+4,c+4,source+SOURCE_PER_RUN,now,attempt))
            db.commit()
    except (OSError, sqlite3.Error):
        raise AutomaticHeld('automatic-state-unavailable') from None
    try:
        result=operation()
    except Exception:
        _finish(path,attempt,'held')
        raise AutomaticHeld('automatic-operation-held') from None
    _finish(path,attempt,'callback-completed')
    return result


def _finish(path, attempt, outcome):
    try:
        with sqlite3.connect('file:'+str(path)+'?mode=rw',uri=True,timeout=5) as db:
            db.execute('BEGIN IMMEDIATE')
            if db.execute('SELECT active FROM policy WHERE id=1').fetchone() != (attempt,):
                raise AutomaticHeld('automatic-completion-held')
            db.execute('UPDATE attempts SET outcome=? WHERE id=? AND outcome=?',(outcome,attempt,'unresolved'))
            db.execute('UPDATE policy SET active=NULL WHERE id=1')
            db.commit()
    except sqlite3.Error:
        raise AutomaticHeld('automatic-completion-held') from None
