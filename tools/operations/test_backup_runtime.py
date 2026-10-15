import json
import os
from pathlib import Path
import tempfile
import unittest
import backup_runtime as m


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name).resolve()
        self.source = self.base/'source'
        self.ops = self.source/'tools/operations'; self.ops.mkdir(parents=True)
        (self.ops/'backup_runtime.py').write_text('# fixture')
        (self.ops/'module.cjs').write_text('// fixture')
        (self.ops/'test_ignored.py').write_text('# no test copy')
        self.destination = self.base/'runtime'
        self.private = self.ops/'.private'; self.private.mkdir(mode=0o700)
        for name in m.PRIVATE_FILES:
            m.write_exclusive(self.private/name, b'fixture-private-bytes')
        m.write_exclusive(self.private/'b2.env', b'overbroad-key-not-to-copy')

    def prepare(self):
        return m.prepare_public(self.source, self.destination, 'a'*40)

    def test_public_install_owner_only_with_no_credentials_or_schedule(self):
        result = self.prepare()
        self.assertEqual(result['public_files'], 2)
        self.assertFalse(result['credentials_transferred'])
        self.assertFalse(result['schedule_active'])
        self.assertEqual(m.verify_public(self.destination)['source_commit'], 'a'*40)
        self.assertEqual(list((self.destination/'tools/operations/.private').iterdir()), [])
        for path in self.destination.rglob('*'):
            self.assertEqual(path.stat().st_mode & 0o077, 0)

    def test_approved_private_transfer_preserves_all_originals_and_receipts(self):
        self.prepare()
        with self.assertRaises(m.RuntimeHeld):
            m.transfer_private(self.private, self.destination)
        result = m.transfer_private(self.private, self.destination, approved=True)
        target = self.destination/'tools/operations/.private'
        for name in m.PRIVATE_FILES:
            self.assertEqual((target/name).read_bytes(), (self.private/name).read_bytes())
        self.assertFalse((target/'b2.env').exists())
        self.assertTrue((self.private/'b2.env').exists())
        self.assertFalse(result['quota_baseline_refreshed'])
        self.assertFalse(result['complete_backup_verified'])
        with self.assertRaises(m.RuntimeHeld):
            m.transfer_private(self.private, self.destination, approved=True)

    def test_existing_runtime_and_changed_code_hold(self):
        self.prepare()
        with self.assertRaises(m.RuntimeHeld): self.prepare()
        (self.destination/'tools/operations/module.cjs').write_text('// changed')
        with self.assertRaises(m.RuntimeHeld): m.verify_public(self.destination)

    def test_private_symlink_permissions_or_missing_input_hold_before_copy(self):
        for problem in ('mode', 'symlink', 'missing'):
            with self.subTest(problem=problem):
                destination = self.base/problem
                m.prepare_public(self.source, destination, 'b'*40)
                p = self.private/m.PRIVATE_FILES[0]
                data = p.read_bytes()
                if problem == 'mode': p.chmod(0o644)
                elif problem == 'symlink': p.unlink(); p.symlink_to(self.private/'b2.env')
                else: p.unlink()
                with self.assertRaises((m.RuntimeHeld, OSError)):
                    m.transfer_private(self.private, destination, approved=True)
                self.assertEqual(list((destination/'tools/operations/.private').iterdir()), [])
                p.unlink(missing_ok=True); m.write_exclusive(p, data)

    def test_busy_ledger_holds_and_does_not_reset_history(self):
        self.prepare(); (self.private/'b2-synthetic-quota.sqlite-wal').write_bytes(b'fixture')
        with self.assertRaises(m.RuntimeHeld):
            m.transfer_private(self.private, self.destination, approved=True)
        self.assertTrue((self.private/'b2-synthetic-quota.sqlite').exists())

    def test_destination_and_source_symlinks_or_traversal_refused(self):
        link = self.base/'link'; link.symlink_to(self.source, target_is_directory=True)
        with self.assertRaises(m.RuntimeHeld):
            m.prepare_public(link, self.destination, 'a'*40)
        with self.assertRaises(m.RuntimeHeld): m.safe_path(self.base/'x/../y')
        with self.assertRaises(m.RuntimeHeld): m.safe_path(Path('relative'))

    def test_source_runtime_symlink_never_copies_private_bytes(self):
        p = self.ops/'module.cjs'; p.unlink(); p.symlink_to(self.private/'b2.env')
        with self.assertRaises(m.RuntimeHeld): self.prepare()
        self.assertFalse(self.destination.exists())

    def test_manifest_traversal_refused(self):
        self.prepare(); p = self.destination/'runtime-manifest.json'
        data=json.loads(p.read_text()); data['files']['../secrets.py']='a'*64
        p.write_text(json.dumps(data))
        with self.assertRaises(m.RuntimeHeld): m.verify_public(self.destination)

    def test_runtime_uses_verified_commit_without_git(self):
        self.prepare()
        self.assertEqual(m.source_commit(self.destination), 'a'*40)
        (self.destination/'tools/operations/module.cjs').write_bytes(b'changed')
        with self.assertRaises(m.RuntimeHeld): m.source_commit(self.destination)

    def test_writable_parent_refused(self):
        self.prepare(); (self.destination/'tools').chmod(0o777)
        with self.assertRaises(m.RuntimeHeld): m.verify_public(self.destination)

    def test_public_update_preserves_private_bytes_and_receipts(self):
        self.prepare(); m.transfer_private(self.private,self.destination,approved=True)
        target=self.destination/'tools/operations/.private'
        before={p.name:p.read_bytes() for p in target.iterdir()}
        (self.ops/'new_module.py').write_text('# additional public code')
        result=m.update_public(self.source,self.destination,'b'*40)
        self.assertTrue(result['private_state_preserved'])
        self.assertEqual(before,{p.name:p.read_bytes() for p in target.iterdir()})
        self.assertEqual(m.source_commit(self.destination),'b'*40)

    def test_unexpected_code_and_public_removal_hold(self):
        self.prepare(); target=self.destination/'tools/operations/extra.py'
        target.write_text('# unexpected'); target.chmod(0o600)
        with self.assertRaises(m.RuntimeHeld):m.verify_public(self.destination)
        target.unlink(); (self.ops/'module.cjs').unlink()
        with self.assertRaises(m.RuntimeHeld):m.update_public(self.source,self.destination,'b'*40)
