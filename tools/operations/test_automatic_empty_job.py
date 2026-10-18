import json
from pathlib import Path
import tempfile
import unittest
import plistlib
from unittest.mock import patch
from b2_automatic_budget import prepare
from backup_runtime import write_exclusive,prepare_public
import automatic_empty_job as m


class EmptyJobTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.private=Path(self.tmp.name).resolve()
        prepare(self.private/'automatic-budget.sqlite',now=1000,observed_at=1000,storage_upper_bound=0,
                download_upper_bound=0,class_b_upper_bound=0,class_c_upper_bound=0,
                source_headroom=2_000_000_000,expires_at=100000,sole_use_account=True,approved_policy=True)
        self.activation={'approved':True,'scope':m.SCOPE,'restore_scope_accepted':True,
                         'key_custody_confirmed':True,'expires_at':100000}
        self.proof={'local_customer_schema_drill_passed':True,'checks':21,'local_container_removed':True,'hosted_restore':False,'schema_fingerprint':'a'*64}

    def ready(self):
        write_exclusive(self.private/'automatic-activation.json',json.dumps(self.activation).encode())
        write_exclusive(self.private/'automatic-restore-proof.json',json.dumps(self.proof).encode())

    def test_missing_activation_is_inactive_with_no_new_files(self):
        before=set(self.private.iterdir())
        self.assertEqual(m.status(self.private,1000)['state'],'inactive')
        self.assertEqual(set(self.private.iterdir()),before)

    def test_exact_limited_scope_and_local_proof_required(self):
        self.ready();self.assertEqual(m.status(self.private,1000)['state'],'due')
        self.activation['scope']='complete-customer'
        m.replace_json(self.private/'automatic-activation.json',self.activation)
        with self.assertRaises(m.JobHeld):m.status(self.private,1000)

    def test_expired_or_operator_hold_refuses_work(self):
        self.ready()
        with self.assertRaises(m.JobHeld):m.status(self.private,100000)
        write_exclusive(self.private/'automatic-operator-hold.json',b'{}')
        with self.assertRaises(m.JobHeld):m.status(self.private,1000)

    def test_waiting_starts_no_source_or_transport(self):
        import sqlite3
        self.ready()
        with sqlite3.connect(self.private/'automatic-budget.sqlite') as db:
            db.execute('UPDATE policy SET last_run=1000')
        self.assertEqual(m.run_job(self.private,Path('/unused'),now=lambda:1001)['state'],'waiting')

    def test_shared_activation_or_false_restore_proof_refused(self):
        self.ready();(self.private/'automatic-activation.json').chmod(0o644)
        with self.assertRaises(Exception):m.status(self.private,1000)
        (self.private/'automatic-activation.json').chmod(0o600)
        self.proof['local_container_removed']=False
        m.replace_json(self.private/'automatic-restore-proof.json',self.proof)
        with self.assertRaises(m.JobHeld):m.status(self.private,1000)

    def test_receipt_replacement_remains_owner_only(self):
        p=self.private/'receipt.json';write_exclusive(p,b'{}')
        m.replace_json(p,{'outcome':'uploaded-unverified'})
        self.assertEqual(json.loads(p.read_text())['outcome'],'uploaded-unverified')
        self.assertEqual(p.stat().st_mode&0o077,0)

    def test_launch_descriptor_is_disabled_and_contains_no_credentials(self):
        value=plistlib.loads(m.launch_agent(Path('/fixture/runtime'),python='/usr/bin/python3'))
        self.assertTrue(value['Disabled']);self.assertFalse(value['KeepAlive'])
        self.assertEqual(value['StartInterval'],900)
        self.assertEqual(value['Umask'],63)
        self.assertNotIn('HEALTHCHECKS_PING_URL',str(value))

    def test_mac_descriptor_includes_the_installed_docker_cli_directory(self):
        value=plistlib.loads(m.launch_agent(Path('/fixture/runtime'),python='/usr/bin/python3'))
        entries=value['EnvironmentVariables']['PATH'].split(':')
        self.assertIn('/Applications/Docker.app/Contents/Resources/bin',entries)
        self.assertNotIn('',entries)
        self.assertTrue(all(Path(entry).is_absolute() for entry in entries))

    def test_local_dependency_check_accepts_only_present_executables_without_running_them(self):
        docker=self.private/'docker';node=self.private/'node'
        for path in (docker,node):path.write_text('# fixture only');path.chmod(0o700)
        locate=lambda command:str(docker) if command=='docker' else None
        self.assertTrue(m.local_dependencies(which=locate,node=node))
        for value in (None,'docker',str(self.private/'missing')):
            with self.assertRaisesRegex(m.JobHeld,'job-local-docker-unavailable'):
                m.local_dependencies(which=lambda _command:value,node=node)
        docker.chmod(0o600)
        with self.assertRaisesRegex(m.JobHeld,'job-local-docker-unavailable'):
            m.local_dependencies(which=locate,node=node)
        docker.chmod(0o700);node.chmod(0o600)
        with self.assertRaisesRegex(m.JobHeld,'job-local-node-unavailable'):
            m.local_dependencies(which=locate,node=node)

    def test_missing_local_dependency_stops_before_credentials_budget_monitor_or_capture(self):
        source=self.private/'source';ops=source/'tools/operations';ops.mkdir(parents=True)
        (ops/'backup_runtime.py').write_text('# public fixture')
        root=self.private/'runtime';prepare_public(source,root,'a'*40);self.ready()
        before=m.policy_state(self.private);files=set(self.private.iterdir())
        with patch.object(m,'local_dependencies',side_effect=m.JobHeld('job-local-docker-unavailable')),\
             patch.object(m,'run_once') as run,patch.object(m.snapshot,'capture_current') as capture,\
             patch.object(m.backup_monitor,'report') as report:
            with self.assertRaisesRegex(m.JobHeld,'job-local-docker-unavailable'):
                m.run_job(self.private,root,now=lambda:1000)
        self.assertEqual(m.policy_state(self.private),before)
        self.assertEqual(set(self.private.iterdir()),files)
        run.assert_not_called();capture.assert_not_called();report.assert_not_called()

    def test_existing_operator_hold_stops_before_even_the_new_local_preflight(self):
        self.ready();write_exclusive(self.private/'automatic-operator-hold.json',b'{}')
        before=m.policy_state(self.private)
        with patch.object(m,'local_dependencies') as check,patch.object(m,'run_once') as run:
            with self.assertRaises(m.JobHeld):m.run_job(self.private,Path('/unused'),now=lambda:1000)
        check.assert_not_called();run.assert_not_called()
        self.assertEqual(m.policy_state(self.private),before)
        self.assertEqual((self.private/'automatic-operator-hold.json').read_bytes(),b'{}')

    def test_fixture_job_preserves_uploaded_locator_and_marks_limited_scope(self):
        source=self.private/'source';ops=source/'tools/operations';ops.mkdir(parents=True)
        (ops/'backup_runtime.py').write_text('# public fixture')
        root=self.private/'runtime';prepare_public(source,root,'a'*40)
        # Private policy stays in the fixture private root; no provider is used.
        self.ready()
        inputs={'supabase-connection.json':b'{}','supabase-password.txt':b'fixture',
                'backup-recovery-key.json':b'{}','b2-restricted.env':b'B2_KEY_ID=fixture\nB2_APPLICATION_KEY=fixture\n',
                'healthchecks.env':b'HEALTHCHECKS_PING_URL=https://hc-ping.com/00000000-0000-0000-0000-000000000000\n'}
        for name,data in inputs.items():write_exclusive(self.private/name,data)
        value=b'ASB1'+bytes(64);events=[]
        def transfer(config,data,ledger,now,verify,budget_guard,uploaded):
            budget_guard(None,now=1000,class_b=1,class_c=1,operation=lambda:None)
            budget_guard(None,now=1000,class_b=2,class_c=2,upload_bytes=len(data),operation=lambda:None)
            result={'file_id':'fixture','file_name':'backups/fixture.asb','encrypted_bytes':len(data),'candidate_round_trip_verified':True}
            uploaded(result)
            budget_guard(None,now=1000,class_b=1,class_c=1,download_bytes=len(data),operation=lambda:None)
            return result
        with patch.object(m,'local_dependencies',return_value=True),patch.object(m.snapshot.legacy.db,'validate_certificate'),patch.object(m.snapshot,'capture_current',return_value=value),\
             patch.object(m.snapshot,'verify',return_value=True),patch.object(m.transport,'transfer',side_effect=transfer),\
             patch.object(m.snapshot.legacy.source,'inspect',return_value={'inventory_compatible':True,'account_count':0,'asset_count':0,'object_count':0}),\
             patch.object(m.backup_monitor,'report',side_effect=lambda url,status,**kw:events.append(status)):
            result=m.run_job(self.private,root,now=lambda:1000)
        self.assertEqual(result['state'],'completed')
        self.assertFalse(result['complete_customer_backup_verified'])
        receipt=json.loads((self.private/'automatic-runs/1.json').read_text())
        self.assertEqual(receipt['transfer']['file_id'],'fixture')
        self.assertEqual(events,['start','success'])
