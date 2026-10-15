"""Fixed fake process outcomes only, no Docker/network or real credentials."""
import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
import tempfile
from types import SimpleNamespace

spec=importlib.util.spec_from_file_location('supabase_backup_preflight',Path(__file__).with_name('supabase-backup-preflight.py'))
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
CONFIG={'project_ref':'abcdefghijklmnopqrst','host':'aws-1-us-west-2.pooler.supabase.com','port':5432,
        'database':'postgres','user':'postgres.abcdefghijklmnopqrst','sslmode':'verify-full','mode':'session','read_only':True}
GOOD={'database_ok':True,'read_only':True,'server_major':17}


class DatabasePreflightTests(unittest.TestCase):
    def fake(self,outcome=None,dirty=False):
        calls=[]
        def run(args,**kwargs):
            calls.append((args,kwargs))
            if args[1]=='run':
                if isinstance(outcome,Exception):raise outcome
                return outcome or SimpleNamespace(returncode=0,stdout=json.dumps(GOOD).encode(),stderr=b'')
            if args[1]=='ps':return SimpleNamespace(returncode=0,stdout=b'leftover' if dirty else b'')
            return SimpleNamespace(returncode=0,stdout=b'')
        return run,calls

    def test_password_only_in_stdin_and_connection_is_read_only_tls(self):
        run,calls=self.fake()
        result=module.inspect(CONFIG,'fixture-password',run)
        self.assertTrue(result['container_removed'])
        self.assertTrue(result['client_tls_verify_full'])
        self.assertIn('BEGIN READ ONLY',module.QUERY)
        self.assertNotIn('pg_stat_ssl',module.QUERY)
        args,kwargs=calls[0]
        self.assertNotIn('fixture-password',' '.join(args))
        self.assertEqual(kwargs['input'],b'fixture-password\n')
        self.assertIn('PGSSLMODE=verify-full',args)
        self.assertIn('PGSSLROOTCERT=/run/supabase-ca.crt',args)
        self.assertEqual(args.count('--mount'),1)
        self.assertTrue(args[args.index('--mount')+1].endswith(',dst=/run/supabase-ca.crt,readonly'))
        self.assertIn('none',args)
        self.assertIn('--read-only',args)
        self.assertTrue(any('default_transaction_read_only=on' in a for a in args))
        self.assertEqual(len(calls),3)

    def test_placeholder_and_newlines_never_launch_a_client(self):
        for password in ['', 'PASTE_DATABASE_PASSWORD_HERE','unsafe\npassword','unsafe\rpassword']:
            run,calls=self.fake()
            with self.assertRaises(module.Held):module.inspect(CONFIG,password,run)
            self.assertEqual(calls,[])

    def test_unsafe_host_tls_user_or_role_never_launches(self):
        for changes in [{'host':'other.test'},{'sslmode':'require'},{'user':'other'},
                        {'port':6543},{'mode':'transaction'},{'read_only':False}]:
            run,calls=self.fake()
            with self.assertRaises(module.Held):module.inspect({**CONFIG,**changes},'fixture-password',run)
            self.assertEqual(calls,[])

    def test_timeout_still_removes_container_and_does_not_retry(self):
        run,calls=self.fake(subprocess.TimeoutExpired('fixture',30))
        with self.assertRaisesRegex(module.Held,'timeout'):module.inspect(CONFIG,'fixture-password',run)
        self.assertEqual([a[0][1] for a in calls],['run','rm','ps'])

    def test_dirty_cleanup_cannot_report_readiness(self):
        run,calls=self.fake(dirty=True)
        with self.assertRaisesRegex(module.Held,'cleanup-held'):module.inspect(CONFIG,'fixture-password',run)

    def test_wrong_database_or_transaction_blocks(self):
        for field in ['database_ok','read_only']:
            data={**GOOD,field:False}
            run,calls=self.fake(SimpleNamespace(returncode=0,stdout=json.dumps(data).encode(),stderr=b''))
            with self.assertRaises(module.Held):module.inspect(CONFIG,'fixture-password',run)

    def test_raw_client_errors_never_escape(self):
        outcome=SimpleNamespace(returncode=1,stdout=b'',stderr=b'password authentication failed; private detail fixture')
        run,calls=self.fake(outcome)
        with self.assertRaisesRegex(module.Held,'^database-authentication-refused$'):
            module.inspect(CONFIG,'fixture-password',run)

    def test_invalid_or_public_certificate_refused(self):
        with tempfile.TemporaryDirectory() as root:
            p=Path(root)/'ca.crt'
            p.write_text('not a certificate')
            p.chmod(0o600)
            with self.assertRaisesRegex(module.Held,'certificate-invalid'):module.validate_certificate(p)
            p.chmod(0o644)
            with self.assertRaisesRegex(module.Held,'certificate-not-ready'):module.validate_certificate(p)
            link=Path(root)/'link.crt'
            link.symlink_to(p)
            with self.assertRaisesRegex(module.Held,'certificate-not-ready'):module.validate_certificate(link)
