import unittest
from copy import deepcopy
from types import SimpleNamespace
from local_cvi_database_adapter import DatabaseHeld,DatabaseTransactionAdapter


class AdapterTests(unittest.TestCase):
    def setUp(self):
        self.p=dict(operationId='a'*32,kind='apply',previous={'head':'a'},target={'head':'b'},recordHash=None,expiresAt=8000)
        self.calls=[];self.now=1000;self.identity=dict(principal='fixture_writer',transactionId='40')
        self.tx=SimpleNamespace(identity=lambda:deepcopy(self.identity),execute_admitted=self.apply,
            commit=lambda:self.calls.append('commit'),rollback=lambda:self.calls.append('rollback'),close=lambda:self.calls.append('close'))
        self.db=SimpleNamespace(begin=lambda:self.tx)
        self.authority=SimpleNamespace(admit=self.admit,confirm=lambda *a:True)
    def admit(self,b):
        self.calls.append('admit');return dict(binding=deepcopy(b),claimHash='c'*64)
    def apply(self,op,claim):
        self.calls.append('apply');return dict(status='applied',operationId=op,transactionId='40',target=deepcopy(self.p['target']))
    def adapter(self):return DatabaseTransactionAdapter('fixture_writer','apply',self.db,self.authority,lambda:self.now)
    def refused(self,adapter=None,p=None):
        a=adapter or self.adapter()
        with self.assertRaises(DatabaseHeld):a.execute(p or self.p)
        self.assertTrue(a.held)
        with self.assertRaises(DatabaseHeld):a.execute(self.p)
    def test_success_requires_commit(self):
        self.assertEqual(self.adapter().execute(self.p)['target'],self.p['target'])
        self.assertEqual(self.calls,['admit','apply','commit','close'])
    def test_missing_database(self):
        self.db=None
        with self.assertRaises(DatabaseHeld):self.adapter()
    def test_missing_authority(self):
        self.authority=None
        with self.assertRaises(DatabaseHeld):self.adapter()
    def test_missing_confirmation(self):
        self.authority.confirm=None
        with self.assertRaises(DatabaseHeld):self.adapter()
    def test_wrong_role(self):self.p['kind']='activate';self.refused();self.assertEqual(self.calls,[])
    def test_unknown_field(self):self.p['raw']=True;self.refused();self.assertEqual(self.calls,[])
    def test_wrong_connection_principal(self):self.identity['principal']='fixture_rotator';self.refused();self.assertNotIn('admit',self.calls)
    def test_invalid_transaction(self):self.identity['transactionId']='0';self.refused()
    def test_missing_method(self):self.tx.commit=None;self.refused();self.assertNotIn('admit',self.calls)
    def test_unavailable_authority(self):
        self.authority.admit=lambda b:(_ for _ in ()).throw(ValueError())
        self.refused();self.assertEqual(self.calls,['rollback','close'])
    def test_substituted_binding(self):
        self.authority.admit=lambda b:dict(binding={},claimHash='c'*64)
        self.refused();self.assertNotIn('apply',self.calls)
    def test_no_claim(self):self.authority.admit=lambda b:dict(binding=b,claimHash='');self.refused()
    def test_authorizer_mutation_cannot_change_intent(self):
        def admit(b):b['intent']['target']={};return self.admit(b)
        self.authority.admit=admit;self.refused();self.assertEqual(self.p['target'],{'head':'b'})
    def test_transaction_changes(self):
        def admit(b):self.identity['transactionId']='41';return self.admit(b)
        self.authority.admit=admit;self.refused();self.assertNotIn('apply',self.calls)
    def test_bad_result(self):self.tx.execute_admitted=lambda *a:{};self.refused();self.assertNotIn('commit',self.calls)
    def test_wrong_target_result(self):self.tx.execute_admitted=lambda *a:dict(status='applied',operationId=self.p['operationId'],transactionId='40',target={});self.refused()
    def test_unconfirmed_commit(self):self.authority.confirm=lambda *a:False;self.refused();self.assertNotIn('commit',self.calls)
    def test_truthy_confirmation_is_insufficient(self):self.authority.confirm=lambda *a:1;self.refused()
    def test_expired_confirmation(self):
        def confirm(*a):self.now=8000;return True
        self.authority.confirm=confirm;self.refused();self.assertNotIn('commit',self.calls)
    def test_unknown_commit(self):
        def commit():self.calls.append('unknown-commit');raise ValueError()
        self.tx.commit=commit;self.refused();self.assertEqual(self.calls.count('unknown-commit'),1)
    def test_expired_commit_response_stays_held(self):
        def commit():self.calls.append('commit');self.now=8000
        self.tx.commit=commit;self.refused();self.assertNotIn('rollback',self.calls)
    def test_no_replay_after_success(self):
        a=self.adapter();a.execute(self.p);self.refused(a);self.assertEqual(self.calls.count('commit'),1)
    def test_backward_clock(self):
        a=self.adapter();a.time();self.now=999;self.refused(a)
    def test_close_failure_refuses_success_after_commit(self):
        self.tx.close=lambda:(_ for _ in ()).throw(ValueError())
        self.refused();self.assertEqual(self.calls.count('commit'),1)
    def test_json_boolean_substitution_refused(self):
        self.p['target']={'count':1}
        self.tx.execute_admitted=lambda *a:dict(status='applied',operationId=self.p['operationId'],transactionId='40',target={'count':True})
        self.refused();self.assertNotIn('commit',self.calls)
    def test_reentrant_execution_cannot_open_another_transaction(self):
        a=self.adapter()
        def admit(b):
            with self.assertRaises(DatabaseHeld):a.execute(self.p)
            return self.admit(b)
        self.authority.admit=admit
        a=self.adapter();self.assertEqual(a.execute(self.p)['status'],'applied')
        self.assertEqual(self.calls.count('commit'),1)
    def test_late_close_cannot_release_an_expired_result(self):
        def close():self.now=8000
        self.tx.close=close;self.refused();self.assertEqual(self.calls.count('commit'),1)
    def test_port_capture(self):
        a=self.adapter();self.authority.admit=None;self.db.begin=None;self.assertEqual(a.execute(self.p)['status'],'applied')

if __name__=='__main__':unittest.main()
