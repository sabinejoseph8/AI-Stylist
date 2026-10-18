"""Synthetic PNG/package composition. No permanent keys or provider requests."""
import hashlib
import importlib.util
from pathlib import Path
import unittest
import tempfile
from unittest.mock import Mock, patch
from local_recovery_package import round_trip, node_runtime
from backup_bundle import BundleHeld
from recovery_objects import manifest, restore_objects

spec=importlib.util.spec_from_file_location('local_rehearsal',Path(__file__).with_name('rehearse-backup.py'))
drill=importlib.util.module_from_spec(spec);spec.loader.exec_module(drill)

class LocalCustomerPhotoTests(unittest.TestCase):
    def setUp(self):
        self.photo=drill.synthetic_png(50)
        self.row=dict(id=drill.ASSET,user_id=drill.OWNER,storage_key=drill.OWNER+'/fixture.png',
                      content_type='image/png',checksum=hashlib.sha256(self.photo).hexdigest(),state='ready')
        self.photos={self.row['storage_key']:self.photo}

    def test_real_encrypted_package_composition(self):
        result,checks=round_trip(b'PGDMPsynthetic',b'-- synthetic roles',[self.row],self.photos)
        self.assertEqual(checks,8)
        self.assertEqual(result['photos'],self.photos)
        self.assertFalse(result['production_restore_authorized'])
        self.assertTrue(self.photo.startswith(b'\x89PNG\r\n\x1a\n'))

    def test_real_encrypted_package_without_desktop_cache(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch('local_recovery_package.NODE',Path(tmp).resolve()/'absent-desktop-runtime'):
                result,checks=round_trip(b'PGDMPsynthetic',b'-- synthetic roles',[self.row],self.photos)
        self.assertEqual(checks,8)
        self.assertEqual(result['photos'],self.photos)
        self.assertFalse(result['production_restore_authorized'])

    def test_missing_photo_holds_before_encryption(self):
        with patch('local_recovery_package.subprocess.run') as child:
            with self.assertRaises(BundleHeld):round_trip(b'PGDMPsynthetic',b'roles',[self.row],{})
            child.assert_not_called()

    def test_interrupted_encryption_returns_no_candidate(self):
        with patch('local_recovery_package.subprocess.run',side_effect=TimeoutError):
            with self.assertRaises(TimeoutError):round_trip(b'PGDMPsynthetic',b'roles',[self.row],self.photos)

    def test_no_partial_photo_set_after_later_photo_corruption(self):
        photos={'first':self.photo,'last':drill.synthetic_png(80)}
        body,signature=manifest(photos,'database',100,b'fixture')
        with self.assertRaisesRegex(ValueError,'object-integrity'):
            restore_objects({**photos,'last':b'bad'},body,signature,b'fixture','database',101,frozenset())
        self.assertEqual(photos['first'],self.photo)

    def test_unknown_deletion_evidence_never_releases_photos(self):
        body,signature=manifest(self.photos,'database',100,b'fixture')
        with self.assertRaisesRegex(ValueError,'deletion-evidence-unavailable'):
            restore_objects(self.photos,body,signature,b'fixture','database',101,None)

    def test_deleted_account_photo_excluded_from_recovered_set(self):
        photos={**self.photos,drill.DELETED_OWNER+'/account.png':drill.synthetic_png(90)}
        body,signature=manifest(photos,'database',100,b'fixture')
        restored=restore_objects(photos,body,signature,b'fixture','database',101,
                                 frozenset({drill.DELETED_OWNER+'/account.png'}))
        self.assertEqual(restored,self.photos)

class LocalRuntimeTests(unittest.TestCase):
    def test_existing_bundled_runtime_is_preferred(self):
        with tempfile.TemporaryDirectory() as tmp:
            binary=Path(tmp).resolve()/'node';binary.write_text('# fixture');binary.chmod(0o700)
            locate=Mock(side_effect=AssertionError('no fallback needed'))
            self.assertEqual(node_runtime(bundled=binary,which=locate),binary)
            locate.assert_not_called()

    def test_ci_node_is_used_when_desktop_runtime_is_absent(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp).resolve();binary=root/'node';binary.write_text('# fixture');binary.chmod(0o700)
            locate=Mock(return_value=str(binary))
            self.assertEqual(node_runtime(bundled=root/'missing-desktop-runtime',which=locate),binary)
            locate.assert_called_once_with('node')

    def test_missing_relative_and_nonexecutable_fallbacks_are_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp).resolve();binary=root/'node';binary.write_text('# fixture');binary.chmod(0o600)
            for installed in (None,'node',str(root/'missing'),str(binary)):
                with self.assertRaisesRegex(ValueError,'local-package-node-unavailable'):
                    node_runtime(bundled=root/'missing-desktop-runtime',which=lambda _name:installed)


if __name__=='__main__':unittest.main()
