"""Synthetic metadata guards, not a production independent authority test."""
import hashlib
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from local_cvi_transaction import connection
import local_cvi_receipt_witness as witness
from local_recovery_abuse import encoded

class ReceiptWitnessTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);base=Path(self.temp.name)
        self.root=base/'db';self.w=base/'witness';self.root.mkdir(mode=0o700);self.w.mkdir(mode=0o700)
        path=self.root/'history.sqlite'
        with sqlite3.connect(path) as db:
            db.executescript('CREATE TABLE history(id INTEGER PRIMARY KEY,payload TEXT,head TEXT,policy TEXT,observed INTEGER);CREATE TABLE projections(token TEXT PRIMARY KEY,owner TEXT,epoch INTEGER,head TEXT,at INTEGER,expires INTEGER,state TEXT);CREATE TABLE committed_receipts(id TEXT PRIMARY KEY,challenge TEXT,principal TEXT,record TEXT,state TEXT,observed INTEGER);')
            db.execute('INSERT INTO history VALUES(1,?,?,?,1000)',(json.dumps(dict(storeId='a'*8+'-'+'b'*4+'-'+'c'*4+'-'+'d'*4+'-'+'e'*12,epoch=0)),'a'*64,'b'*64))
            db.execute("INSERT INTO projections VALUES(?,?,?,?,?,?,?)",('c'*64,'d'*64,0,'a'*64,1000,2000,'issued'))
            db.execute('INSERT INTO committed_receipts VALUES(?,?,?,?,?,?)',('e'*64,'f'*64,'d'*64,'{}','pending',1000))
        path.chmod(0o600);self.ref=witness.bootstrap(self.w,self.root)
    def snapshot(self):return [(self.w/n).read_bytes() for n in ('ledger.json','checkpoint.json')]
    def restore(self,data):
        for n,b in zip(('ledger.json','checkpoint.json'),data):(self.w/n).write_bytes(b)
    def modify(self,sql,args=()):
        with witness.protected_connection(self.root,self.ref) as db:db.execute(sql,args);db.commit()
    def check(self,ref=None):
        with witness.protected_connection(self.root,self.ref if ref is None else ref):pass
    def test_claim_advances_witness_with_same_domain_epoch(self):
        self.modify("UPDATE committed_receipts SET state='claimed'")
        s=witness.load(self.ref);self.assertEqual(s['revision'],1);self.assertEqual(s['epochFloor'],0);self.check()
    def test_noop_commit_does_not_advance_witness(self):
        before=self.snapshot()
        with witness.protected_connection(self.root,self.ref) as db:db.commit()
        self.assertEqual(before,self.snapshot())
    def test_receipt_state_cannot_regress(self):
        self.modify("UPDATE committed_receipts SET state='claimed'")
        with self.assertRaises(ValueError):self.modify("UPDATE committed_receipts SET state='pending'")
        self.check()
    def test_receipt_cannot_be_removed(self):
        with self.assertRaises(ValueError):self.modify('DELETE FROM committed_receipts')
        self.check()
    def test_receipt_payload_cannot_be_changed(self):
        with self.assertRaises(ValueError):self.modify("UPDATE committed_receipts SET record='changed'")
    def test_receipt_clock_cannot_regress(self):
        with self.assertRaises(ValueError):self.modify('UPDATE committed_receipts SET observed=999')
    def test_used_projection_cannot_be_reissued(self):
        self.modify("UPDATE projections SET state='used'")
        with self.assertRaises(ValueError):self.modify("UPDATE projections SET state='issued'")
    def test_projection_cannot_be_deleted(self):
        with self.assertRaises(ValueError):self.modify('DELETE FROM projections')
    def test_projection_identity_cannot_be_changed(self):
        with self.assertRaises(ValueError):self.modify("UPDATE projections SET owner='other'")
    def test_epoch_floor_cannot_decrease(self):
        state=dict(storeId=self.ref['storeId'],epoch=1);self.modify('UPDATE history SET payload=?,head=?',(json.dumps(state),'f'*64))
        with self.assertRaises(ValueError):self.modify('UPDATE history SET payload=?',(json.dumps(dict(state,epoch=0)),))
        self.assertEqual(witness.load(self.ref)['epochFloor'],1)
    def test_same_epoch_head_cannot_fork(self):
        with self.assertRaises(ValueError):self.modify("UPDATE history SET head=?",('f'*64,))
    def test_observed_clock_cannot_regress(self):
        with self.assertRaises(ValueError):self.modify('UPDATE history SET observed=999')
    def test_stale_witness_refuses_current_database(self):
        before=self.snapshot();self.modify("UPDATE committed_receipts SET state='claimed'");self.restore(before)
        with self.assertRaises(ValueError):self.check()
    def test_unprotected_claim_rollback_is_detected(self):
        self.modify("UPDATE committed_receipts SET state='claimed'")
        with connection(self.root) as db:db.execute("UPDATE committed_receipts SET state='pending'");db.commit()
        with self.assertRaises(ValueError):self.check()
    def test_missing_witness_never_reseeds(self):
        (self.w/'ledger.json').unlink()
        with self.assertRaises(ValueError):self.check()
        self.assertFalse((self.w/'ledger.json').exists())
    def test_wrong_identity_refused(self):
        for field in ('witnessId','storeId','policyDigest'):
            with self.subTest(field=field),self.assertRaises(ValueError):self.check({**self.ref,field:'foreign'})
    def test_missing_reference_refused(self):
        with self.assertRaises(ValueError):
            with witness.protected_connection(self.root,None):pass
    def test_existing_witness_cannot_be_rebased(self):
        with self.assertRaises(ValueError):witness.bootstrap(self.w,self.root)
    def test_same_directory_refused(self):
        with self.assertRaises(ValueError):witness.bootstrap(self.root,self.root)
    def test_incomplete_witness_refused(self):
        (self.w/'pending').write_text('interrupted');(self.w/'pending').chmod(0o600)
        with self.assertRaises(ValueError):self.check()
    def test_symlink_witness_refused(self):
        (self.w/'ledger.json').rename(self.w/'saved');(self.w/'ledger.json').symlink_to(self.w/'saved')
        with self.assertRaises(ValueError):self.check()
    def test_witness_write_failure_rolls_back_database_and_holds(self):
        with patch('local_recovery_abuse.os.replace',side_effect=OSError('synthetic-disk')):
            with self.assertRaises(ValueError):self.modify("UPDATE committed_receipts SET state='claimed'")
        with connection(self.root) as db:self.assertEqual(db.execute('SELECT state FROM committed_receipts').fetchone()[0],'pending')
        with self.assertRaises(ValueError):self.check()
    def test_invalid_counter_even_with_checksum_refused(self):
        s=witness.load(self.ref);s['revision']=True;data=encoded(s);self.restore([data,encoded(dict(sha256=hashlib.sha256(data).hexdigest()))])
        with self.assertRaises(ValueError):self.check()
    def test_revision_overflow_refused(self):
        s=witness.load(self.ref);s['revision']=2**53-1;data=encoded(s);self.restore([data,encoded(dict(sha256=hashlib.sha256(data).hexdigest()))])
        with self.assertRaises(ValueError):self.modify("UPDATE committed_receipts SET state='claimed'")
