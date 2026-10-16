"""SQLite adapter invariants. Actual signature verification is in Vitest tests."""
import json
import unittest
from unittest.mock import patch
import test_local_cvi_writer_lease as lease_tests
from local_cvi_transaction import connection
from local_cvi_receipts import canonical,digest
import local_cvi_mandatory_adapter as adapter
import local_cvi_writer_lease as leases

class MandatoryAdapterTests(unittest.TestCase):
    def setUp(self):
        lease_tests.WriterLeaseTests.setUp(self);self.config=dict(now=1000,actor={'fixture':'domain'},node='unused',verifier='unused',authorityPin={},readPrincipal='unused')
        self.args=dict(previous=0,owner=self.owner,boot='c'*64,ttl=1000,token='d'*64)
    def observe(self):
        with connection(self.root) as db:return adapter.control_metadata(db,1000)
    def plan(self,kind='activate',args=None,actor=None):return adapter.plan(self.root,self.config,actor or self.rotator,kind,self.args if args is None else args)
    def execute(self,p,rpc=None,crash=None):
        with patch.object(adapter,'verify',lambda *_:None):return adapter.execute(self.root,self.config,p,{},rpc or (lambda m:{}),crash)
    def test_preview_does_not_commit_control_changes(self):
        before=self.observe();p=self.plan();self.assertEqual(p['from'],before);self.assertEqual(p['to']['epochFloor'],1);self.assertEqual(self.observe(),before)
    def test_preview_token_is_reused_exactly_at_commit(self):
        p=self.plan();result=self.execute(p);self.assertEqual(result['token'],self.args['token']);self.assertEqual(self.observe(),p['to'])
    def test_role_cannot_be_selected_by_command(self):
        with self.assertRaises(ValueError):self.plan(actor=self.fencer)
    def test_unknown_command_refused(self):
        with self.assertRaises(ValueError):self.plan(kind='raw',args={})
    def test_extra_command_fields_refused(self):
        with self.assertRaises(ValueError):self.plan(args=dict(self.args,unsafe=True))
    def test_stale_previous_generation_refused(self):
        leases.activate(self.root,self.rotator,0,self.owner,'e'*64,1000)
        with self.assertRaises(ValueError):self.plan()
    def test_original_random_function_restored_after_preview(self):
        before=leases.secrets.token_hex;self.plan();self.assertIs(leases.secrets.token_hex,before)
    def test_backend_challenges_are_fresh_even_during_fixed_token_activation(self):
        messages=[];self.execute(self.plan(),lambda m:messages.append(m) or {})
        nonces=[m['nonce'] for m in messages if m['stage']=='authority-read'];self.assertEqual(len(nonces),3);self.assertEqual(len(set(nonces)),3);self.assertNotIn(self.args['token'],nonces)
    def test_all_required_authority_stages_are_requested(self):
        messages=[];self.execute(self.plan(),lambda m:messages.append(m) or {})
        self.assertEqual([m['stage'] for m in messages],['authority-read','authority-read','reconcile','authority-read'])
    def test_missing_authority_before_sql_changes_never_falls_back(self):
        p=self.plan()
        with self.assertRaises(ValueError):self.execute(p,lambda m:(_ for _ in ()).throw(ValueError('unavailable')))
        self.assertEqual(self.observe(),p['from'])
    def test_authority_failure_before_commit_rolls_back_changes(self):
        p=self.plan();calls=[]
        def rpc(m):
            calls.append(m)
            if len(calls)==2:raise ValueError('unavailable')
            return {}
        with self.assertRaises(ValueError):self.execute(p,rpc)
        self.assertEqual(self.observe(),p['from'])
    def test_reconcile_failure_preserves_committed_target(self):
        p=self.plan()
        def rpc(m):
            if m['stage']=='reconcile':raise ValueError('held')
            return {}
        with self.assertRaises(ValueError):self.execute(p,rpc)
        self.assertEqual(self.observe(),p['to'])
    def test_commit_failure_before_save_keeps_old_state(self):
        p=self.plan()
        with self.assertRaises(ValueError):self.execute(p,crash='before-commit')
        self.assertEqual(self.observe(),p['from'])
    def test_commit_failure_after_save_keeps_target(self):
        p=self.plan()
        with self.assertRaises(ValueError):self.execute(p,crash='after-commit')
        self.assertEqual(self.observe(),p['to'])
    def test_exact_target_rejects_boolean_generation_substitution(self):
        p=self.plan();p['to']['epochFloor']=True;body={k:v for k,v in p.items() if k!='id'};p['id']=digest(body)
        with self.assertRaises(ValueError):self.execute(p)
        self.assertEqual(self.observe(),p['from'])
    def test_exact_baseline_refuses_control_change(self):
        p=self.plan();leases.activate(self.root,self.rotator,0,self.owner,'e'*64,1000);before=self.observe()
        with self.assertRaises(ValueError):self.execute(p)
        self.assertEqual(self.observe(),before)
    def test_mutated_digest_refused_before_verifier(self):
        p=self.plan();p['id']='f'*64
        with patch.object(adapter,'verify') as verify,self.assertRaises(ValueError):adapter.execute(self.root,self.config,p,{},lambda m:{})
        verify.assert_not_called()
    def test_unexpected_top_level_fields_refused(self):
        p=self.plan();p['fallback']='raw'
        with self.assertRaises(ValueError):self.execute(p)
    def test_caller_cannot_change_operation_time(self):
        p=self.plan();p['now']=1001;p['id']=digest({k:v for k,v in p.items() if k!='id'})
        with self.assertRaises(ValueError):self.execute(p)
    def test_fence_changes_aggregate_without_lowering_generation(self):
        leases.activate(self.root,self.rotator,0,self.owner,'e'*64,1000);p=self.plan('fence',dict(generation=1),self.fencer)
        self.assertEqual(p['from']['epochFloor'],p['to']['epochFloor']);self.assertEqual(p['from']['headFloor'],p['to']['headFloor']);self.assertNotEqual(p['from']['historyDigest'],p['to']['historyDigest']);self.execute(p);self.assertEqual(self.observe(),p['to'])
    def test_domain_metadata_is_covered_by_authority_aggregate(self):
        before=self.observe()
        with connection(self.root) as db:db.execute('UPDATE history SET observed=1001');db.commit()
        self.assertNotEqual(self.observe()['historyDigest'],before['historyDigest'])
    def test_release_tombstones_are_covered_at_same_generation(self):
        before=self.observe()
        with connection(self.root) as db:db.execute('INSERT INTO writer_releases VALUES(?,?,?,?,?)',('f'*64,0,self.owner,'e'*64,'spent'));db.commit()
        after=self.observe();self.assertEqual(after['epochFloor'],before['epochFloor']);self.assertNotEqual(after['historyDigest'],before['historyDigest'])
    def test_reapplying_same_intent_cannot_recreate_grant(self):
        p=self.plan();self.execute(p)
        with self.assertRaises(ValueError):self.execute(p)
        with connection(self.root) as db:self.assertEqual(db.execute('SELECT count(*) FROM writer_grants').fetchone()[0],1)
    def test_verifier_error_does_not_touch_sql(self):
        p=self.plan()
        with patch.object(adapter,'verify',side_effect=ValueError('signature')),self.assertRaises(ValueError):adapter.execute(self.root,self.config,p,{},lambda m:{})
        self.assertEqual(self.observe(),p['from'])
