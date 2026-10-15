"""Independent witness assumption exercised with disposable separate folders."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import local_cvi_replay as replay
import local_cvi_credentials as credentials
import local_cvi_witness as witness

class CviWitnessTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.base=Path(self.temp.name)
        self.r=self.base/'replay';self.w=self.base/'replay-witness';self.c=self.base/'credentials';self.cw=self.base/'credential-witness'
        for p in (self.r,self.w,self.c,self.cw):p.mkdir(mode=0o700)
        self.store=replay.prepare(self.r,'a'*64,10000,1000,2);self.ref=witness.prepare(self.w,self.r,self.store,'replay')
        self.cs=credentials.prepare(self.c,'a'*64,10000,1000);self.lease=credentials.activate(self.c,self.cs,'a'*64,0,'b'*64,'c'*64,1000)
        self.cref=witness.prepare(self.cw,self.c,self.cs,'credentials')
    def req(self,n=1):return dict(storeId=self.store,bindingDigest='a'*64,requestDigest=hashlib.sha256(str(n).encode()).hexdigest(),now=1000)
    def op(self,mode='reserve',request=None):return replay.operate(self.r,request or self.req(),mode,witness=self.ref)
    def check(self,lease=None,now=1000):return credentials.check(self.c,{**(lease or self.lease),'now':now},witness=self.cref)
    def snap(self,p):return [(p/n).read_bytes() for n in ('ledger.json','checkpoint.json')]
    def restore(self,p,data):
        for n,b in zip(('ledger.json','checkpoint.json'),data):(p/n).write_bytes(b)
    def test_replay_pair_rollback_refused(self):
        old=self.snap(self.r);r=self.op();self.op('consume',r);self.restore(self.r,old)
        with self.assertRaises(ValueError):self.op()
    def test_authority_pair_rollback_cannot_restore_old_credential(self):
        old=self.snap(self.c);credentials.activate(self.c,self.cs,'a'*64,1,'d'*64,'e'*64,1000,witness=self.cref);self.restore(self.c,old)
        with self.assertRaises(ValueError):self.check()
    def test_partial_history_rollback_refused(self):
        first=self.op();self.op('consume',first);old=self.snap(self.r);second=self.op(request=self.req(2));self.op('consume',second);self.restore(self.r,old)
        with self.assertRaises(ValueError):self.op(request=self.req(2))
    def test_cap_preserved_after_restart_reads(self):
        for n in (1,2):r=self.op(request=self.req(n));self.op('consume',r)
        with self.assertRaises(ValueError):self.op(request=self.req(3))
    def test_missing_witness_does_not_reseed(self):
        (self.w/'ledger.json').unlink()
        with self.assertRaises(ValueError):self.op()
        self.assertFalse((self.w/'ledger.json').exists())
    def test_missing_checkpoint_refused(self):
        (self.w/'checkpoint.json').unlink()
        with self.assertRaises(ValueError):self.op()
    def test_witness_identity_substitution_refused(self):
        ref={**self.ref,'witnessId':'foreign'}
        with self.assertRaises(ValueError):replay.operate(self.r,self.req(),'reserve',witness=ref)
    def test_journal_identity_substitution_refused(self):
        ref={**self.ref,'journalId':'foreign'}
        with self.assertRaises(ValueError):replay.operate(self.r,self.req(),'reserve',witness=ref)
    def test_wrong_kind_refused(self):
        with self.assertRaises(ValueError):replay.operate(self.r,self.req(),'reserve',witness=self.cref)
    def test_stale_witness_even_with_new_journal_is_refused(self):
        old=self.snap(self.w);self.op();self.restore(self.w,old)
        with self.assertRaises(ValueError):self.op(request=self.req(2))
    def test_journal_edit_with_recomputed_checksum_refused(self):
        self.op();s=json.loads((self.r/'ledger.json').read_bytes());s['records']=[];data=replay.encoded(s)
        self.restore(self.r,[data,replay.encoded({'sha256':hashlib.sha256(data).hexdigest()})])
        with self.assertRaises(ValueError):self.op()
    def test_independent_witness_model_has_no_key_or_content(self):
        self.op();s=json.loads((self.w/'ledger.json').read_text());self.assertEqual(set(s),{'version','witnessId','journalId','kind','epoch','head'});self.assertEqual(s['epoch'],1)
    def test_clock_observation_rollback_refused(self):
        old=self.snap(self.c);self.check(now=2000);self.restore(self.c,old)
        with self.assertRaises(ValueError):self.check(now=1000)
    def test_noop_authority_check_does_not_advance_epoch(self):
        before=self.snap(self.cw);self.check();self.assertEqual(before,self.snap(self.cw))
    def test_witness_disk_failure_holds_without_journal_write(self):
        before=self.snap(self.r)
        with patch('local_recovery_abuse.os.replace',side_effect=OSError('fixture-disk')):
            with self.assertRaises(ValueError):self.op()
        self.assertEqual(before,self.snap(self.r));self.assertTrue((self.w/'pending').exists())
        with self.assertRaises(ValueError):self.op()
    def test_local_write_failure_after_witness_advance_holds(self):
        original=witness.save
        def fail_local(root,state,**kw):
            if Path(root)==self.r:raise OSError('fixture-disk')
            return original(root,state,**kw)
        with patch('local_cvi_witness.save',side_effect=fail_local):
            with self.assertRaises(ValueError):self.op()
        self.assertEqual(witness.load(self.ref)['epoch'],1)
        with self.assertRaises(ValueError):self.op()
    def test_bootstrap_cannot_rebase_existing_witness(self):
        with self.assertRaises(ValueError):witness.prepare(self.w,self.r,self.store,'replay')
    def test_symlink_witness_refused(self):
        (self.w/'ledger.json').rename(self.w/'saved');(self.w/'ledger.json').symlink_to(self.w/'saved')
        with self.assertRaises(ValueError):self.op()
    def test_shared_witness_directory_refused(self):
        self.w.chmod(0o755)
        with self.assertRaises(ValueError):self.op()
    def test_malformed_witness_checksum_refused(self):
        (self.w/'checkpoint.json').write_text('{}')
        with self.assertRaises(ValueError):self.op()
    def test_invalid_epoch_even_with_checksum_refused(self):
        s=json.loads((self.w/'ledger.json').read_text());s['epoch']=True;data=replay.encoded(s);self.restore(self.w,[data,replay.encoded({'sha256':hashlib.sha256(data).hexdigest()})])
        with self.assertRaises(ValueError):self.op()
    def test_unresolved_reservation_remains_held(self):
        self.op()
        with self.assertRaises(ValueError):self.op(request=self.req(2))
    def test_all_state_rollback_is_explicitly_not_detected(self):
        local=self.snap(self.r);external=self.snap(self.w);r=self.op();self.op('consume',r);self.restore(self.r,local);self.restore(self.w,external)
        self.assertEqual(self.op()['status'],'reserved')

if __name__=='__main__':unittest.main()
