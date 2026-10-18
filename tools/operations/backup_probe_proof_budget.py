"""One approved schema-proof source read. No backup upload, schedule or refund.

Reserve source egress cumulatively in the existing policy before export. This
leaves B2 byte/request totals, attempts, schedule, active and expiry untouched.
"""
import sqlite3
from pathlib import Path
from backup_runtime import read_file,private_directory
from b2_automatic_budget import SOURCE_PER_RUN,MAX_SOURCE_TOTAL
PURPOSE='cvi-probe-schema-proof-20261018'
class ProofHeld(RuntimeError):pass

def reserve_source(path,*,now,approved=False):
    if approved is not True or type(now)is not int:raise ProofHeld('proof-approval-held')
    path=Path(path);private_directory(path.parent);read_file(path,private=True,limit=4*1024*1024)
    with sqlite3.connect('file:'+str(path)+'?mode=rw',uri=True,timeout=5) as db:
        db.execute('BEGIN IMMEDIATE')
        row=db.execute('select version,created,expires,source_bytes,active from policy where id=1').fetchone()
        if (not row or row[0]!=1 or any(type(v)is not int for v in row[1:4]) or
                not row[1]<=now<row[2] or row[4] is not None or row[3]<0 or row[3]+SOURCE_PER_RUN>MAX_SOURCE_TOTAL):raise ProofHeld('proof-budget-held')
        db.execute('create table if not exists schema_proof_reads(purpose text primary key,started integer not null,reserved_source_bytes integer not null)')
        if db.execute('select 1 from schema_proof_reads where purpose=?',(PURPOSE,)).fetchone():raise ProofHeld('proof-already-consumed')
        db.execute('insert into schema_proof_reads values(?,?,?)',(PURPOSE,now,SOURCE_PER_RUN))
        db.execute('update policy set source_bytes=source_bytes+? where id=1',(SOURCE_PER_RUN,))
    return SOURCE_PER_RUN
