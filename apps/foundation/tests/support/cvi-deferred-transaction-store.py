"""Disposable real SQLite commit; its allocated row is NOT a PostgreSQL xid."""
import json,sys,os
from pathlib import Path
from contextlib import contextmanager
from unittest.mock import patch
os.umask(0o077)
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
import local_cvi_transaction as txs
import local_cvi_receipts as receipts
import local_cvi_mandatory_adapter as native
from local_cvi_database_adapter import DatabaseTransactionAdapter
from local_cvi_full_state import full_state
from local_cvi_receipts import canonical
x=json.loads(sys.stdin.readline());root=Path(x['root']);p=x['plan'];command=x['command'];config=x['config'];now=p['now']
def rpc(stage,**fields):
    print(json.dumps(dict(stage=stage,**fields)),flush=True)
    line=sys.stdin.readline()
    if not line:raise ValueError()
    return json.loads(line)
class Transaction:
    def __init__(self):
        self.cm=txs.connection(root);self.db=self.cm.__enter__();self.closed=False;self.lease=None
        try:
            if canonical(native.control_metadata(self.db,now))!=canonical(p['from']):
                raise ValueError()
            self.db.execute('CREATE TABLE IF NOT EXISTS gate_transaction_markers (id INTEGER PRIMARY KEY AUTOINCREMENT, operation_id TEXT UNIQUE NOT NULL, claim_hash TEXT, consumed INTEGER NOT NULL DEFAULT 0)')
            row=self.db.execute('INSERT INTO gate_transaction_markers(operation_id) VALUES(?)',(command['operationId'],))
            self.identity_value=dict(principal=x['principal'],transactionId=str(row.lastrowid))
        except Exception:
            self.cm.__exit__(*sys.exc_info());raise
    def identity(self):return dict(self.identity_value)
    def execute_admitted(self,op,claim):
        if op!=command['operationId']:raise ValueError()
        db=self.db;count=0
        @contextmanager
        def same_connection(_):
            class Provisional:
                def execute(self,*args):return db.execute(*args)
                def commit(self):
                    nonlocal count
                    count+=1
                    if count!=1 or canonical(native.control_metadata(db,now))!=canonical(p['to']):raise ValueError()
            yield Provisional()
        with patch.object(txs,'connection',same_connection),patch.object(receipts,'connection',same_connection):
            self.lease=native.mutation(root,config,p['actor'],p['kind'],p['args'])
        if count!=1:raise ValueError()
        db.execute('UPDATE gate_transaction_markers SET claim_hash=?,consumed=1 WHERE id=?',(claim,int(self.identity_value['transactionId'])))
        return dict(status='applied',operationId=op,transactionId=self.identity_value['transactionId'],target=command['target'])
    def commit(self):
        if x.get('crash')=='before-commit':raise ValueError()
        self.db.commit()
        if x.get('crash')=='after-commit':raise ValueError()
    def rollback(self):self.db.rollback()
    def close(self):
        if self.closed:return
        self.cm.__exit__(None,None,None);self.closed=True
        if x.get('crash')=='after-close':raise ValueError()
class Database:
    transaction=None
    def begin(self):self.transaction=Transaction();return self.transaction
class Authority:
    def admit(self,b):return rpc('admit',binding=b)
    def confirm(self,b,claim):return rpc('confirm',binding=b,claimHash=claim)
try:
    if x.get('mode')=='observe':
        with txs.connection(root) as db:
            row=db.execute('SELECT id,operation_id,claim_hash,consumed FROM gate_transaction_markers WHERE operation_id=?',(command['operationId'],)).fetchone()
            if not row or row[3]!=1:raise ValueError()
            result=dict(snapshot=full_state(db),projection=command['target'],operationId=row[1],transactionId=str(row[0]),claimHash=row[2],consumed=True,protected=True)
    else:
        database=Database();adapter=DatabaseTransactionAdapter(x['principal'],p['kind'],database,Authority(),lambda:now)
        result=dict(transaction=adapter.execute(command),lease=database.transaction.lease)
    print(json.dumps(dict(stage='result',result=result)),flush=True)
except Exception:
    print('{"stage":"held"}',flush=True);sys.exit(2)
