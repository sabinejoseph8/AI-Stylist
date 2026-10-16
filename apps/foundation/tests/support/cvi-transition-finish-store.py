"""Actual disposable gate and signed finish verifier. No native re-execution.

The setup context is captured before yielding ready; later frames contain only
one proof packet, never replacement pins, scopes, actors or native plans.
"""
import json,os,sys,subprocess
from pathlib import Path
from copy import deepcopy
sys.path.insert(0,str(Path(__file__).resolve().parents[4]/'tools/operations'))
from local_cvi_transition_gate import transition
os.umask(0o077)
try:
    line=sys.stdin.readline(1048577)
    if len(line)>1048576:raise ValueError()
    x=json.loads(line);context=deepcopy(x['context']);now=x['now'];evidence=None
    node=x['node'];verifier=x['verifier'];mode=x.get('testMode')
    def source(marker,prepared):
        if evidence is None:raise ValueError()
        return deepcopy(evidence)
    def verify(marker,plan,prepared,pack,at):
        binding=dict(marker=marker,prepared=prepared,plan=plan,**deepcopy(context))
        checked=subprocess.run([node,verifier],input=json.dumps(dict(binding=binding,pack=pack,now=at)),text=True,capture_output=True,timeout=3)
        if checked.returncode:raise ValueError()
        return json.loads(checked.stdout)
    result=None
    with transition(x['root'],x['scope'],x['intent'],source,verify,lambda:now) as gate:
        prepared=gate.prepare_finish()
        print(json.dumps(dict(stage='ready',marker=gate.describe(),prepared=prepared)),flush=True)
        line=sys.stdin.readline(1048577)
        if len(line)>1048576:raise ValueError()
        request=json.loads(line)
        if set(request)!={'command','pack'} or request['command']!='finish':raise ValueError()
        evidence=deepcopy(request['pack']);result=gate.finish()
    # The original OS lock is released BEFORE any successful acknowledgment.
    if mode=='lose-reply':os._exit(73)
    print(json.dumps(dict(stage='finished',result=result)),flush=True)
except Exception:
    print('{"stage":"held"}',flush=True);sys.exit(2)
