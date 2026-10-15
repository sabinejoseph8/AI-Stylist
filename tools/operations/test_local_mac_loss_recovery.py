"""Synthetic keys/evidence only. No provider, permanent runtime or host changes."""
import hashlib
import hmac
import json
from pathlib import Path
import tempfile
import subprocess
import sys
import unittest
import local_mac_loss_recovery as m

class MacLossRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.key=b'a'*32;self.authority_key=b'b'*32
        self.archive=b'PGDMPsynthetic-remote-copy'
        self.value=dict(version=1,project='synthetic-project',sequence=7,as_of=120,
                        backup_at=100,backup_sha256=hashlib.sha256(self.archive).hexdigest(),
                        deleted_keys=['owner/deleted.png'],deleted_accounts=['deleted-owner'],
                        reservations={'unchanged-id':'held','uncertain-id':'reserved'})
        self.body,self.signature=m.sign_fixture(self.value,self.authority_key)
        self.checkpoint=dict(project='synthetic-project',sequence=7,as_of=120,sha256=hashlib.sha256(self.body).hexdigest())
        self.calls=[]
        def step(name):
            def call(archive,evidence):
                self.assertEqual(archive,self.archive);self.assertEqual(evidence,self.value)
                self.calls.append(name);return True
            return call
        self.args=dict(archive=self.archive,archive_signature=hmac.digest(self.key,self.archive,'sha256'),
                       archive_key=self.key,evidence=[(self.body,self.signature)],checkpoint=self.checkpoint,
                       evidence_key=self.authority_key,project='synthetic-project',backup_at=100,now=130,
                       expires_at=100+7*86400,steps={name:step(name) for name in m.STEPS})

    def held(self,**changes):
        with self.assertRaisesRegex(m.RecoveryHeld,'local-mac-loss-recovery-held'):
            m.rehearse(**{**self.args,**changes})
        self.assertEqual(self.calls,[])

    def test_complete_fixture_orders_checks_without_customer_release(self):
        result=m.rehearse(**self.args)
        self.assertEqual(self.calls,list(m.STEPS));self.assertTrue(result['local_plan_ready'])
        self.assertFalse(result['customer_access_enabled']);self.assertFalse(result['hosted_restore_verified'])

    def test_missing_or_wrong_recovery_key(self):
        for key in [None,b'wrong',b'z'*32]:self.held(archive_key=key)

    def test_missing_or_wrong_authority_key(self):
        for key in [None,b'wrong',b'z'*32]:self.held(evidence_key=key)

    def test_missing_or_damaged_archive(self):
        for archive in [None,b'',self.archive[:-1],self.archive+b'x']:self.held(archive=archive)

    def test_expired_future_or_extended_retention_backup(self):
        for changes in [dict(now=99),dict(now=100+7*86400),dict(expires_at=100+7*86400+1),dict(now=True)]:self.held(**changes)

    def test_missing_or_unsigned_independent_evidence(self):
        self.held(evidence=[]);self.held(evidence=[(self.body,b'bad')]);self.held(checkpoint=None)

    def test_valid_signature_cannot_authorize_older_evidence(self):
        old={**self.value,'sequence':6,'as_of':110,'deleted_keys':[],'reservations':{}}
        self.held(evidence=[m.sign_fixture(old,self.authority_key)])

    def test_equal_sequence_with_conflicting_content_is_held(self):
        conflict={**self.value,'deleted_accounts':[]}
        self.held(evidence=[(self.body,self.signature),m.sign_fixture(conflict,self.authority_key)])

    def test_wrong_project_or_checkpoint_sequence(self):
        self.held(project='another-project')
        self.held(checkpoint={**self.checkpoint,'sequence':8})

    def test_evidence_predating_backup_or_from_future_is_held(self):
        for as_of in [99,131]:
            value={**self.value,'as_of':as_of};body,sig=m.sign_fixture(value,self.authority_key)
            checkpoint={**self.checkpoint,'as_of':as_of,'sha256':hashlib.sha256(body).hexdigest()}
            self.held(evidence=[(body,sig)],checkpoint=checkpoint)

    def test_invalid_financial_state_cannot_release_or_refund(self):
        for state in ['available','refunded',None]:
            value={**self.value,'reservations':{'unchanged-id':state}};body,sig=m.sign_fixture(value,self.authority_key)
            self.held(evidence=[(body,sig)],checkpoint={**self.checkpoint,'sha256':hashlib.sha256(body).hexdigest()})

    def test_each_failed_stage_prevents_all_later_stages(self):
        for failed in m.STEPS:
            self.calls=[];steps=dict(self.args['steps'])
            def failure(*_):self.calls.append(failed);raise OSError('synthetic fault')
            steps[failed]=failure
            with self.assertRaises(m.RecoveryHeld):m.rehearse(**{**self.args,'steps':steps})
            self.assertEqual(self.calls,list(m.STEPS[:m.STEPS.index(failed)+1]))

    def test_recovery_check_returning_unknown_does_not_advance(self):
        steps=dict(self.args['steps']);steps[m.STEPS[0]]=lambda *_:None
        self.held(steps=steps)

    def test_no_release_or_extra_operation_can_be_supplied(self):
        self.held(steps={**self.args['steps'],'enable_customers':lambda *_:self.fail('release')})

    def replacement_process(self,root):
        code="""
import json,sys
from pathlib import Path
import local_mac_loss_recovery as m
root=Path(sys.argv[1]);remote=root/'simulated-backup-store';authority=root/'simulated-evidence-authority';manager=root/'simulated-password-manager'
try:
 result=m.rehearse(archive=(remote/'archive').read_bytes(),archive_signature=(remote/'signature').read_bytes(),
   archive_key=(manager/'archive-key').read_bytes(),evidence=[((authority/'evidence').read_bytes(),(authority/'signature').read_bytes())],
   evidence_key=(manager/'authority-key').read_bytes(),checkpoint=json.loads((authority/'checkpoint').read_text()),
   project='synthetic-project',backup_at=100,now=130,expires_at=100+7*86400,
   steps={name:lambda *_:True for name in m.STEPS})
 print(json.dumps(result))
except Exception: print('{"held":true,"customer_access_enabled":false}');sys.exit(2)
"""
        return subprocess.run([sys.executable,'-c',code,str(root)],cwd=Path(__file__).parent,
                              capture_output=True,text=True,timeout=10)

    def kit(self,root):
        root=Path(root)
        stores={name:root/name for name in ['simulated-backup-store','simulated-evidence-authority','simulated-password-manager']}
        for store in stores.values():store.mkdir(mode=0o700)
        files={'simulated-backup-store':{'archive':self.archive,'signature':self.args['archive_signature']},
               'simulated-evidence-authority':{'evidence':self.body,'signature':self.signature,'checkpoint':json.dumps(self.checkpoint).encode()},
               'simulated-password-manager':{'archive-key':self.key,'authority-key':self.authority_key}}
        for name,values in files.items():
            for filename,value in values.items():
                file=stores[name]/filename;file.touch(mode=0o600);file.write_bytes(value)
        return stores

    def test_simulated_lost_mac_fresh_process_uses_separate_fixture_copies(self):
        with tempfile.TemporaryDirectory() as root:
            root=Path(root);lost=root/'lost-mac';lost.mkdir();(lost/'old-evidence').write_text('obsolete')
            self.kit(root)
            (lost/'old-evidence').unlink();lost.rmdir()
            result=self.replacement_process(root)
            self.assertEqual(result.returncode,0)
            self.assertFalse(lost.exists());self.assertTrue(json.loads(result.stdout)['local_plan_ready'])
            self.assertFalse(json.loads(result.stdout)['customer_access_enabled'])

    def test_missing_external_copy_blocks_replacement_process(self):
        for store,filename in [('simulated-backup-store','archive'),('simulated-evidence-authority','evidence'),
                              ('simulated-evidence-authority','checkpoint'),('simulated-password-manager','archive-key')]:
            with self.subTest(store=store,filename=filename),tempfile.TemporaryDirectory() as root:
                stores=self.kit(root);(stores[store]/filename).unlink()
                result=self.replacement_process(root)
                self.assertEqual(result.returncode,2)
                self.assertFalse(json.loads(result.stdout)['customer_access_enabled'])

    def test_validly_authenticated_other_backup_cannot_use_this_evidence(self):
        archive=b'PGDMPanother-authenticated-backup'
        self.held(archive=archive,archive_signature=hmac.digest(self.key,archive,'sha256'))

    def test_mismatched_capture_time_is_held(self):
        self.held(backup_at=101)
