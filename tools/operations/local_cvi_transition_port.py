"""Disabled original gate IPC. Trusted setup only; no listener or key lookup."""
import json,os,sys,subprocess
from pathlib import Path
from copy import deepcopy
from local_cvi_transition_gate import transition
os.umask(0o077)
def receive():
    line=sys.stdin.readline(1048577)
    if not line or len(line)>1048576:raise ValueError()
    return json.loads(line)
def send(value):print(json.dumps(value),flush=True)
try:
    x=receive()
    if set(x)!={'root','scope','intent','context','now','node','verifier'}:raise ValueError()
    context=deepcopy(x['context']);at=x['now'];evidence=None
    def source(marker,prepared):
        if evidence is None:raise ValueError()
        return deepcopy(evidence)
    def verify(marker,plan,prepared,pack,now):
        binding=dict(marker=marker,prepared=prepared,plan=plan,**deepcopy(context))
        checked=subprocess.run([x['node'],x['verifier']],input=json.dumps(dict(binding=binding,pack=pack,now=now)),text=True,capture_output=True,timeout=3)
        if checked.returncode:raise ValueError()
        return json.loads(checked.stdout)
    with transition(x['root'],x['scope'],x['intent'],source,verify,lambda:at) as gate:
        send(dict(stage='ready',marker=gate.describe(),prepared=gate.prepare_finish()))
        while True:
            r=receive()
            if set(r)!={'command','now','value'}:raise ValueError()
            at=r['now']
            if r['command']=='inspect':send(dict(stage='inspected',result=gate.inspect(r['value'])))
            elif r['command']=='finish':evidence=deepcopy(r['value']);result=gate.finish();break
            else:raise ValueError()
    # Release the original lock before acknowledging success.
    send(dict(stage='finished',result=result))
except Exception:
    send(dict(stage='held'));sys.exit(2)
