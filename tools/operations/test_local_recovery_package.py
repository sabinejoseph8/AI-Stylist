"""Synthetic PNG/package composition. No permanent keys or provider requests."""
import hashlib
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch
from local_recovery_package import round_trip
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

if __name__=='__main__':unittest.main()
