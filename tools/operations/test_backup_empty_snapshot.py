import unittest
from backup_bundle import build_candidate
import backup_empty_snapshot as m


SQL=b''.join(b'COPY '+schema.encode()+b'.'+table.encode()+b' (id) FROM stdin;\n\\.\n'
             for schema,table in sorted(m.TABLES))


class EmptySnapshotTests(unittest.TestCase):
    def test_exact_empty_copy_tables_accepted(self):self.assertTrue(m.require_empty_sql(SQL))

    def test_rows_missing_duplicate_or_extra_tables_refused(self):
        for value in [SQL.replace(b'FROM stdin;\n',b'FROM stdin;\nfixture\n',1),SQL+SQL,
                      SQL.replace(b'auth.users',b'public.users'),SQL+ b'INSERT INTO auth.users VALUES(1);',
                      SQL.replace(b'COPY auth.users',b'COPY auth.people'),b'',bytes(256*1024+1)]:
            with self.assertRaises(m.EmptySnapshotHeld):m.require_empty_sql(value)

    def test_fresh_authenticated_empty_package_requires_archive_inspection(self):
        plain=build_candidate(b'PGDMPfixture',b'fixture roles',[],{},source_commit='a'*40,captured_at=1000)
        inspected=[]
        self.assertTrue(m.verify(b'ASB1'+bytes(36),None,now=1001,decrypt=lambda *_:plain,
                                 inspect=lambda data:inspected.append(data) or True))
        self.assertEqual(inspected,[b'PGDMPfixture'])
        with self.assertRaises(m.EmptySnapshotHeld):
            m.verify(b'ASB1'+bytes(36),None,now=1300,decrypt=lambda *_:plain,inspect=lambda _:self.fail('stale'))

    def test_plaintext_oversize_or_incomplete_archive_proof_refused(self):
        for value in [b'plaintext',b'ASB1'+bytes(m.MAX_ENVELOPE)]:
            with self.assertRaises(m.EmptySnapshotHeld):m.verify(value,None,decrypt=lambda *_:self.fail('crypto'))
        plain=build_candidate(b'PGDMPfixture',b'roles',[],{},source_commit='a'*40,captured_at=1000)
        self.assertFalse(m.verify(b'ASB1'+bytes(36),None,now=1001,decrypt=lambda *_:plain,inspect=lambda _:False))

    def test_capture_uses_bounded_export_and_encryption(self):
        calls=[]
        def prepare(config,password,commit,export,encrypt):
            self.assertEqual((config,password,commit),({},'fixture','a'*40))
            export(config,password,'database')
            return b'ASB1'+bytes(36)
        def export(config,password,kind,capture_client):
            calls.append(kind)
        self.assertTrue(m.capture_current({},'fixture','a'*40,None,prepare=prepare,export=export).startswith(b'ASB1'))
        self.assertEqual(calls,['database'])
