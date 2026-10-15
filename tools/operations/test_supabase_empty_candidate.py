"""Synthetic export bytes and fake processes only, no hosted data or key."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest

spec=importlib.util.spec_from_file_location('empty_candidate',Path(__file__).with_name('supabase-empty-source-candidate.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
CONFIG={'project_ref':'abcdefghijklmnopqrst','host':'aws-1-us-west-2.pooler.supabase.com','port':5432,
 'database':'postgres','user':'postgres.abcdefghijklmnopqrst','sslmode':'verify-full','mode':'session','read_only':True}
GOOD={'inventory_compatible':True,'account_count':0,'asset_count':0,'object_count':0}

class CandidateTests(unittest.TestCase):
    def test_two_exports_and_empty_source_checks_before_encryption(self):
        calls=[]
        def inspect(*a):calls.append('inspect');return GOOD
        def export(c,p,kind):calls.append(kind);return b'PGDMPfixture' if kind=='database' else b'-- roles fixture'
        def encrypt(data):calls.append('encrypt');return b'ASB1'+b'x'*40
        self.assertEqual(m.prepare(CONFIG,'fixture','a'*40,inspect=inspect,export=export,encrypt=encrypt,now=1000),b'ASB1'+b'x'*40)
        self.assertEqual(calls,['inspect','roles','database','inspect','encrypt'])
    def test_nonempty_or_newly_nonempty_source_refused(self):
        for index in [0,1]:
            state=[0]
            def inspect(*a):
                state[0]+=1
                return {**GOOD,'account_count':1} if state[0]==index+1 else GOOD
            with self.assertRaises(m.CandidateHeld):
                m.prepare(CONFIG,'fixture','a'*40,inspect=inspect,
                    export=lambda c,p,k:b'PGDMPfixture' if k=='database' else b'-- fixture',
                    encrypt=lambda data:self.fail('Must not encrypt'),now=1000)
    def test_export_arguments_keep_password_out_and_cleanup_runs(self):
        calls=[]
        def capture(args,data,**kwargs):
            calls.append((args,data,kwargs));return b'PGDMPfixture'
        def run(args,**kwargs):calls.append((args,));return SimpleNamespace(returncode=0,stdout=b'')
        self.assertEqual(m.read_export(CONFIG,'fixture-password','database',run=run,capture_client=capture),b'PGDMPfixture')
        self.assertNotIn('fixture-password',' '.join(calls[0][0]));self.assertEqual(calls[0][1],b'fixture-password\n')
        self.assertIn('PGSSLMODE=verify-full',calls[0][0]);self.assertIn('default_transaction_read_only=on',' '.join(calls[0][0]))
        self.assertEqual([x[0][1] for x in calls],['run','rm','ps'])
    def test_failed_export_still_cleans_up(self):
        calls=[]
        def capture(*a,**k):raise m.ClientHeld('fixture')
        def run(args,**kwargs):calls.append(args[1]);return SimpleNamespace(returncode=0,stdout=b'')
        with self.assertRaises(m.ClientHeld):m.read_export(CONFIG,'fixture','roles',run=run,capture_client=capture)
        self.assertEqual(calls,['rm','ps'])
    def test_role_passwords_not_exported(self):
        args=m.client_arguments(CONFIG,'fixture','roles')
        self.assertIn('--no-role-passwords',args[-1]);self.assertNotIn('--file',args[-1])
        with self.assertRaises(m.CandidateHeld):m.client_arguments(CONFIG,'fixture','other')
