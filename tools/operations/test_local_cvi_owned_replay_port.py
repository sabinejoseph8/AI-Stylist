"""Fixed IPC entry checks. Signed mutation and restore integration run in Node."""
import json,subprocess,sys,unittest
from pathlib import Path
class OwnedReplayEntryTests(unittest.TestCase):
    def test_rejects_alternate_modes_and_injected_execution_settings(self):
        setup=dict(nativeRoot='/private/tmp/not-native',replayRoot='/private/tmp/not-replay',replayStoreId='11111111-1111-4111-8111-111111111111',physicalBindingDigest='a'*64,applicationBindingDigest='b'*64,applicationExpiresAt=10000,witness=dict(root='/private/tmp/not-witness',witnessId='22222222-2222-4222-8222-222222222222',journalId='11111111-1111-4111-8111-111111111111',kind='replay'),authority={},readerPrincipal='c'*64,ownerDigest='d'*64)
        base=dict(mode='inspect',setup=setup,request=dict(storeId=setup['replayStoreId'],bindingDigest='a'*64,challenge='e'*64,now=1000),node='unused-node')
        for patch in [dict(mode='raw'),dict(crashAt='pending'),dict(times=[1000]),dict(verifier='alternate'),dict(script='alternate'),dict(setup={**setup,'witness':None}),dict(setup={**setup,'verifier':'alternate'}),dict(setup={**setup,'witness':{**setup['witness'],'journalId':'other'}})]:
            with self.subTest(patch=patch):
                r=subprocess.run([sys.executable,str(Path(__file__).with_name('local_cvi_owned_replay_port.py'))],input=json.dumps({**base,**patch})+'\n',text=True,capture_output=True,timeout=5)
                self.assertEqual(r.returncode,2);self.assertEqual(json.loads(r.stdout),{'stage':'held'});self.assertEqual(r.stderr,'')
    def test_refuses_oversized_or_unterminated_input(self):
        for raw in ['x'*1048577+'\n','{}']:
            r=subprocess.run([sys.executable,str(Path(__file__).with_name('local_cvi_owned_replay_port.py'))],input=raw,text=True,capture_output=True,timeout=5)
            self.assertEqual(r.returncode,2);self.assertEqual(json.loads(r.stdout),{'stage':'held'})
if __name__=='__main__':unittest.main()
