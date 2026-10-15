"""Synthetic in-memory candidate packaging only."""
import io
import json
import hashlib
import zipfile
import unittest
import backup_bundle as m

PHOTO=b'synthetic garment'
ROW={'id':'00000000-0000-0000-0000-000000000001','user_id':'00000000-0000-0000-0000-000000000002',
     'storage_key':'00000000-0000-0000-0000-000000000002/item.webp','content_type':'image/webp',
     'checksum':hashlib.sha256(PHOTO).hexdigest(),'state':'ready'}
DB=b'PGDMPsynthetic-only'
ROLES=b'-- synthetic roles only'

class BundleTests(unittest.TestCase):
    def build(self,rows=None,photos=None):
        return m.build_candidate(DB,ROLES,[ROW] if rows is None else rows,
            {ROW['storage_key']:PHOTO} if photos is None else photos,source_commit='a'*40,captured_at=1000)

    def mutate(self,data,change):
        with zipfile.ZipFile(io.BytesIO(data)) as z:files={n:z.read(n) for n in z.namelist()}
        change(files)
        output=io.BytesIO()
        with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_STORED) as z:
            for n,d in files.items():z.writestr(n,d)
        return output.getvalue()

    def test_round_trip_is_candidate_not_customer_restore(self):
        data=self.build();result=m.read_candidate(data,now=1001)
        self.assertEqual(result['database'],DB);self.assertEqual(result['roles'],ROLES)
        self.assertEqual(result['photos'],{ROW['storage_key']:PHOTO})
        self.assertFalse(result['production_restore_authorized'])
        self.assertEqual(self.build(),data)
        self.assertEqual(m.read_candidate(self.build([],{}),now=1001)['photos'],{})

    def test_missing_extra_changed_or_legacy_photos_hold_whole_candidate(self):
        for rows,photos in [([ROW],{}),([],{ROW['storage_key']:PHOTO}),([ROW],{ROW['storage_key']:b'changed'}),
                            ([{**ROW,'checksum':None}],{ROW['storage_key']:PHOTO}),([ROW,ROW],{ROW['storage_key']:PHOTO})]:
            with self.assertRaises(m.BundleHeld):self.build(rows,photos)

    def test_truncated_corrupt_or_missing_member_refused(self):
        data=self.build()
        for value in [data[:-10],b'not a zip',self.mutate(data,lambda f:f.pop('roles.sql')),
                      self.mutate(data,lambda f:f.update({'database.dump':b'changed'}))]:
            with self.assertRaises(m.BundleHeld):m.read_candidate(value,now=1001)

    def test_future_and_seven_day_expiry_refused(self):
        data=self.build()
        for now in [999,1000+7*86400,True,-1]:
            with self.assertRaises(m.BundleHeld):m.read_candidate(data,now=now)

    def test_extra_path_even_with_digest_cannot_be_extracted(self):
        def change(files):
            files['../outside']=b'bad'
            metadata=json.loads(files['manifest.json'])
            metadata['members']['../outside']={'bytes':3,'sha256':hashlib.sha256(b'bad').hexdigest()}
            files['manifest.json']=json.dumps(metadata).encode()
        with self.assertRaises(m.BundleHeld):m.read_candidate(self.mutate(self.build(),change),now=1001)

    def test_compressed_and_duplicate_members_refused(self):
        data=self.build()
        with zipfile.ZipFile(io.BytesIO(data)) as z:files={n:z.read(n) for n in z.namelist()}
        output=io.BytesIO()
        with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as z:
            for n,d in files.items():z.writestr(n,d)
        with self.assertRaises(m.BundleHeld):m.read_candidate(output.getvalue(),now=1001)
