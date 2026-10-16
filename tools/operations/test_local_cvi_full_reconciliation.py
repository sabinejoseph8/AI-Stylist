import unittest
from types import SimpleNamespace
from local_cvi_database_adapter import ReconciledDatabaseAdapter,DatabaseHeld

class FullReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.p=dict(operationId='a'*32,expiresAt=3000);self.calls=[];self.now=1000
        self.result=dict(status='applied',operationId=self.p['operationId'],target={})
        self.base=SimpleNamespace(execute=self.execute)
        self.final=SimpleNamespace(finalize=self.finish)
    def execute(self,p):self.calls.append('committed');return self.result
    def finish(self,p,result):self.calls.append('finalized');return dict(status='reconciled',operationId=p['operationId'],targetDigest='b'*64)
    def adapter(self):return ReconciledDatabaseAdapter(self.base,self.final,'b'*64,lambda:self.now)
    def test_success_requires_finalization(self):self.assertEqual(self.adapter().execute(self.p)['reconciliation']['status'],'reconciled');self.assertEqual(self.calls,['committed','finalized'])
    def test_missing_finalizer(self):
        self.final=None
        with self.assertRaises(DatabaseHeld):self.adapter()
    def test_missing_base(self):
        self.base=None
        with self.assertRaises(DatabaseHeld):self.adapter()
    def test_unknown_commit_never_finalizes(self):
        self.base.execute=lambda p:(_ for _ in ()).throw(DatabaseHeld())
        with self.assertRaises(DatabaseHeld):self.adapter().execute(self.p)
        self.assertNotIn('finalized',self.calls)
    def test_unknown_reconciliation_never_reapplies(self):
        self.final.finalize=lambda *a:(_ for _ in ()).throw(DatabaseHeld())
        a=self.adapter()
        for _ in range(2):
            with self.assertRaises(DatabaseHeld):a.execute(self.p)
        self.assertEqual(self.calls,['committed'])
    def test_wrong_operation(self):
        self.final.finalize=lambda *a:dict(status='reconciled',operationId='c'*32,targetDigest='b'*64)
        with self.assertRaises(DatabaseHeld):self.adapter().execute(self.p)
    def test_wrong_target(self):
        self.final.finalize=lambda *a:dict(status='reconciled',operationId='a'*32,targetDigest='c'*64)
        with self.assertRaises(DatabaseHeld):self.adapter().execute(self.p)
    def test_unsigned_boolean_is_not_a_receipt(self):
        self.final.finalize=lambda *a:True
        with self.assertRaises(DatabaseHeld):self.adapter().execute(self.p)
    def test_expired_final_reply(self):
        def final(*a):self.now=3000;return self.finish(*a)
        self.final.finalize=final
        with self.assertRaises(DatabaseHeld):self.adapter().execute(self.p)
    def test_success_cannot_repeat(self):
        a=self.adapter();a.execute(self.p)
        with self.assertRaises(DatabaseHeld):a.execute(self.p)
        self.assertEqual(self.calls.count('committed'),1)
    def test_backward_final_clock(self):
        def final(*a):self.now=999;return self.finish(*a)
        self.final.finalize=final
        with self.assertRaises(DatabaseHeld):self.adapter().execute(self.p)
    def test_negative_initial_clock(self):
        self.now=-1
        with self.assertRaises(DatabaseHeld):self.adapter().execute(self.p)
        self.assertEqual(self.calls,[])
    def test_port_capture(self):
        a=self.adapter();self.base.execute=None;self.final.finalize=None
        self.assertEqual(a.execute(self.p)['reconciliation']['status'],'reconciled')

if __name__=='__main__':unittest.main()
