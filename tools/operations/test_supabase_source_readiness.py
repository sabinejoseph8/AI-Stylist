"""Aggregate source-readiness tests; no real database or credential."""
import importlib.util
from pathlib import Path
import json
from types import SimpleNamespace
import unittest

spec=importlib.util.spec_from_file_location('source_readiness',Path(__file__).with_name('supabase-backup-source-readiness.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
CONFIG={'project_ref':'abcdefghijklmnopqrst','host':'aws-1-us-west-2.pooler.supabase.com','port':5432,
 'database':'postgres','user':'postgres.abcdefghijklmnopqrst','sslmode':'verify-full','mode':'session','read_only':True}
GOOD={**{k:0 for k in m.COUNTS},'database_bytes':10000,'read_only':True,'private_photo_bucket':True}

class SourceReadinessTests(unittest.TestCase):
    def run_fake(self,data):
        self.calls=[]
        def run(args,**kwargs):
            self.calls.append((args,kwargs))
            return SimpleNamespace(returncode=0,stdout=json.dumps(data).encode() if args[1]=='run' else b'',stderr=b'')
        return run

    def test_read_only_aggregate_inventory_and_secret_free_arguments(self):
        result=m.inspect(CONFIG,'fixture-password',self.run_fake(GOOD))
        self.assertTrue(result['inventory_compatible']);self.assertFalse(result['complete_backup_verified'])
        self.assertEqual(self.calls[0][0][-1],m.QUERY)
        self.assertNotIn('fixture-password',' '.join(self.calls[0][0]))
        self.assertIn('BEGIN READ ONLY',m.QUERY);self.assertTrue(m.QUERY.endswith('ROLLBACK;'))
        self.assertEqual(len(self.calls),3)

    def test_incomplete_sets_are_reported_incompatible_not_omitted(self):
        for field in ['transitional_assets','missing_checksums','unmatched_objects','missing_objects','other_bucket_objects']:
            self.assertFalse(m.inspect(CONFIG,'fixture-password',self.run_fake({**GOOD,field:1}))['inventory_compatible'])

    def test_malformed_counts_or_private_state_refused(self):
        for change in [{'database_bytes':True},{'account_count':-1},{'read_only':False},{'private_photo_bucket':False},{'object_count':None}]:
            with self.assertRaises(m.db.Held):m.inspect(CONFIG,'fixture-password',self.run_fake({**GOOD,**change}))
