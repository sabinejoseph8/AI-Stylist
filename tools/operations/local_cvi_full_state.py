"""Complete logical SQLite export for disposable PostgreSQL rehearsal only."""
def full_state(db):
    queries={
        'history':'SELECT payload,head,policy,observed FROM history WHERE id=1',
        'projections':'SELECT token,owner,epoch,head,at,expires,state FROM projections ORDER BY token',
        'receipts':'SELECT id,challenge,principal,record,state,observed FROM committed_receipts ORDER BY id',
        'gate':'SELECT store_id,policy,generation,state,observed FROM writer_gate WHERE id=1',
        'grants':'SELECT generation,owner,boot,token_hash,issued,expires,state FROM writer_grants ORDER BY generation',
        'releases':'SELECT receipt_id,generation,owner,record_hash,state FROM writer_releases ORDER BY receipt_id'}
    return dict(version=1,**{name:[list(row) for row in db.execute(query).fetchall()] for name,query in queries.items()})
