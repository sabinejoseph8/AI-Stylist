"""Disabled fixed witnessed replay IPC. No environment, provider or alternate driver."""
import json,os,sys
from pathlib import Path
from local_cvi_replay import inspect_boundary
from local_cvi_owner_replay import operate
from local_recovery_abuse import integer
os.umask(0o077)
def receive():
    line=sys.stdin.readline(1048577)
    if not line or len(line.encode())>1048576 or not line.endswith('\n'):raise ValueError()
    return json.loads(line)
def send(value):print(json.dumps(value),flush=True)
try:
    x=receive();mode=x.get('mode')
    required={'mode','setup','request','node'}|({'lease','minimumRevision'} if mode in ('reserve','consume') else set())
    if set(x)!=required or mode not in ('inspect','reserve','consume'):raise ValueError()
    s=x['setup'];r=x['request']
    if set(s)!={'nativeRoot','replayRoot','replayStoreId','physicalBindingDigest','applicationBindingDigest','applicationExpiresAt','witness','authority','readerPrincipal','ownerDigest'}:raise ValueError()
    w=s['witness']
    if not isinstance(w,dict) or set(w)!={'root','witnessId','journalId','kind'} or w['kind']!='replay' or w['journalId']!=s['replayStoreId']:raise ValueError()
    if r.get('storeId')!=s['replayStoreId'] or r.get('bindingDigest')!=s['physicalBindingDigest']:raise ValueError()
    last=r['now'];frames=0
    def rpc(message):
        global frames
        frames+=1
        if frames>64:raise ValueError()
        send(message);return receive()
    def clock():
        global last
        value=rpc(dict(stage='clock'))
        if set(value)!={'now'} or not integer(value['now']) or not last<=value['now']<s['applicationExpiresAt']:raise ValueError()
        last=value['now'];return last
    if mode=='inspect':
        clock();value=inspect_boundary(Path(s['replayRoot']),r,witness=w);clock()
    else:
        config=dict(nativeRoot=s['nativeRoot'],lease=x['lease'],ownerDigest=s['ownerDigest'],authorityPin=s['authority'],readerPrincipal=s['readerPrincipal'],minimumRevision=x['minimumRevision'],replayStoreId=s['replayStoreId'],bindingDigest=s['physicalBindingDigest'],node=x['node'],verifier=str(Path(__file__).with_name('local-cvi-owner-replay-verifier.ts')))
        value=operate(Path(s['replayRoot']),r,mode,config,rpc,clock,witness=w)
    send(dict(stage='result',result=value))
except Exception:
    send(dict(stage='held'));sys.exit(2)
