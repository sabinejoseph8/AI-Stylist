"""Local role preparation unit tests only; no actual private input."""
import importlib.util
from pathlib import Path
import unittest

spec=importlib.util.spec_from_file_location('candidate_drill',Path(__file__).with_name('rehearse-private-candidate.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class CandidateDrillTests(unittest.TestCase):
    def test_only_bootstrap_postgres_role_creation_and_alteration_filtered(self):
        data=b'CREATE ROLE postgres;\nALTER ROLE postgres WITH NOSUPERUSER;\nCREATE ROLE authenticated;\nALTER ROLE authenticated WITH NOLOGIN;\nGRANT authenticated TO postgres;\n'
        value=m.local_roles(data)
        self.assertNotIn(b'CREATE ROLE postgres;',value);self.assertNotIn(b'ALTER ROLE postgres ',value)
        self.assertIn(b'CREATE ROLE authenticated;',value);self.assertIn(b'GRANT authenticated TO postgres;',value)
    def test_oversized_roles_refused(self):
        with self.assertRaises(m.DrillHeld):m.local_roles(b'x'*(1024*1024+1))

    def test_explicit_grantor_adaptation_is_only_in_local_copy(self):
        original=b'GRANT authenticated TO authenticator WITH INHERIT TRUE GRANTED BY supabase_admin;\n'
        value=m.local_roles(original)
        self.assertIn(b'WITH INHERIT TRUE;',value)
        self.assertNotIn(b'GRANTED BY',value)
        self.assertIn(b'GRANTED BY supabase_admin',original)

    def test_project_private_schema_dependencies_are_included(self):
        self.assertTrue({'stylist_private','stylist_notes_trial_private','stylist_notebook_private'}<=set(m.SCHEMAS))
