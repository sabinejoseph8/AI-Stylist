/** Unbranded native/guard protocol contracts; genuine pair acceptance is tested separately. */
import {it,expect} from 'vitest';
import {startupAdmissionFixture} from './support/cvi-startup-admission-fixture.ts';
import {createLocalCviStartupOwner} from './support/cvi-private-contract-owner.ts';
import {createLocalCviNotebookContext} from '../src/server/local-cvi-notebook-context.ts';
import {createLocalCviTranscriptAdapter} from '../src/server/local-cvi-transcript-adapter.ts';
import {createLocalCviHttpAdapter} from './support/cvi-http-contract.ts';
import {APPROVED_NOTES_RETENTION} from '../src/session/notes-retention-policy.ts';
import {credentialCall} from './support/cvi-credential-process.ts';
import {call} from './support/cvi-replay-process.ts';
const signal=()=>new AbortController().signal;
it.each(['next-request','prepared-output'])('fresh signed proof works after RPC expiry and refuses lease expiry at %s',async stage=>{
 let time=1000;const f=await startupAdmissionFixture(()=>time);let wire:ReturnType<typeof createLocalCviHttpAdapter>|undefined;
 try{
  const identity={ownerId:'00000000-0000-4000-8000-000000000001',sessionId:'11111111-1111-4111-8111-111111111111',isCurrent:async()=>true},request=()=>new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}});
  const context=createLocalCviNotebookContext({simulation:true,identity,authorize:async r=>r.headers.get('authorization')==='Bearer fixture-customer'?identity:null,checkpoint:f.checkpoint,ports:{draft:async s=>'Synthetic '+s.notes.coverage.text,check:async(text,s)=>({approved:true,text,revision:s.revision})},clock:()=>time,policy:APPROVED_NOTES_RETENTION});
  f.resources.makeFlow=()=>context.flow;
  const owner=await createLocalCviStartupOwner(f.expected,context.checkpoint,f.admission(),f.resources,()=>time,5000,8000).start(signal());expect(owner).not.toBeNull();expect(f.nativeLease().expiresAt).toBe(9000);
  time=6001;
  const transcript=createLocalCviTranscriptAdapter({simulation:true,conversation:'c_fixture',participantId:'h_fixture',context,admit:async()=>({request:request(),turnId:'fixture-later-input',turnOrdinal:1}),extract:async()=>[{field:'style',value:'Long sleeves'}],deadlineMs:8000});
  expect((await transcript.ingest('fixture-room','fixture-pal',{message_type:'conversation',event_type:'conversation.utterance',timestamp:1,seq:1,conversation_id:'c_fixture',properties:{role:'user',speech:'Long sleeves',participant_id:'h_fixture'}},signal())).status).toBe('applied');
  wire=createLocalCviHttpAdapter({simulation:true,binding:f.resources.binding,owner:owner!,context,transcript,applicationRequest:request(),clock:()=>time});
  const http=(prefix='')=>new Request(f.resources.binding.origin+'/cvi/v1/chat/completions',{method:'POST',headers:{'x-ai-stylist-token':f.resources.binding.secret,'content-type':'application/json'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[...(prefix?[{role:'assistant',content:prefix}]:[]),{role:'user',content:'Long sleeves'}]})});
  const response=await wire.handle(http());expect(response.status).toBe(200);if(stage==='next-request')expect(await response.text()).toContain('Long sleeves');
  const before:any=await call(f.replayRoot,'inspect',{storeId:f.journal.storeId});expect(before.records).toHaveLength(2);expect(before.records[0].status).toBe('spent');expect(before.records[1].status).toBe(stage==='next-request'?'spent':'reserved');
  time=9000;if(stage==='next-request')expect((await wire.handle(http('Fresh body to require current-owner inspection'))).status).toBe(409);else await expect(response.text()).rejects.toThrow();
  expect(transcript.currentInput()).toBeNull();expect(Object.values(context.flow.snapshot().notes).every(n=>n.text==='')).toBe(true);
  const after:any=await call(f.replayRoot,'inspect',{storeId:f.journal.storeId});expect(after.records).toEqual(before.records);expect(f.nativeLease().expiresAt).toBe(9000);expect(f.resources.binding.expiresAt).toBe(10000);
 }finally{wire?.close();await f.close();}
},60000);
it('a post-RPC committed grant stays spent without activating credentials or returning an owner',async()=>{let time=1000;const f=await startupAdmissionFixture(()=>time);try{
 const execute=f.ports.execute;f.ports.execute=async(p,s)=>{const result=await execute(p,s);time=6000;return result;};
 const startup=createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>time,5000,8000);expect(await startup.start(signal())).toBeNull();expect(startup.isHeld()).toBe(true);expect(f.nativeLease().expiresAt).toBe(9000);expect((await f.x.inspect()).revision).toBe(4);
 const credentials:any=await credentialCall(f.credential,'inspect',{storeId:f.scope.credentialStoreId});expect(credentials.generations).toHaveLength(1);expect(f.drafts()).toBe(0);expect(await startup.start(signal())).toBeNull();
 }finally{await f.close();}},30000);
it('a longer lease does not make an old signed observation fresh',async()=>{let time=1000;const f=await startupAdmissionFixture(()=>time);try{
 const owner=await createLocalCviStartupOwner(f.expected,f.checkpoint,f.admission(),f.resources,()=>time,5000,8000).start(signal());expect(owner).not.toBeNull();f.x.setReplayRead(true);time=6001;
 const request=new Request(f.resources.binding.origin+'/v1/chat/completions',{method:'POST',headers:{authorization:'Bearer '+f.resources.binding.secret,'x-cvi-conversation':f.resources.binding.conversation,'x-cvi-request-id':'fixture-stale-time-proof','content-type':'application/json'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[{role:'user',content:'Synthetic'}]})});
 expect((await owner!.handle(request)).status).toBe(409);expect(f.drafts()).toBe(0);f.x.setReplayRead(false);expect((await owner!.handle(new Request(request.url,{method:'POST',headers:{...Object.fromEntries(request.headers),'x-cvi-request-id':'fixture-no-rearm'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[{role:'user',content:'Synthetic'}]})}))).status).toBe(409);const replay:any=await call(f.replayRoot,'inspect',{storeId:f.journal.storeId});expect(replay.records).toHaveLength(0);owner!.end();
 }finally{await f.close();}},30000);

/** Mandatory paired entry: the original contract assertions above stay intact. */
it.each(['next-request','prepared-output'])('genuine paired HTTP remains valid after RPC expiry and refuses owner expiry at %s',async stage=>{
 const {pairedOwnerFixture}=await import('./support/cvi-paired-owner-fixture.ts'),x=await pairedOwnerFixture();try{
  const {owner,wire,transcript,say}=await x.start();expect(x.nativeLease().expiresAt).toBe(9000);x.at(6001);expect((await say('Long sleeves')).status).toBe('applied');const response=await wire.handle(x.http('Long sleeves'));expect(response.status).toBe(200);if(stage==='next-request')expect(await response.text()).toContain('Long sleeves');
  const before=await x.records();expect(before).toHaveLength(2);expect(before[0].status).toBe('spent');expect(before[1].status).toBe(stage==='next-request'?'spent':'reserved');
  x.at(9000);if(stage==='next-request')expect((await wire.handle(x.http('Long sleeves','Require a new owner check'))).status).not.toBe(200);else await expect(response.text()).rejects.toThrow();
  expect(transcript.currentInput()).toBeNull();expect(Object.values(x.context.flow.snapshot().notes).every(n=>n.text==='')).toBe(true);expect(await x.records()).toEqual(before);expect(x.nativeLease().expiresAt).toBe(9000);expect(x.resources.binding.expiresAt).toBe(10000);owner.end();
 }finally{await x.close();}
},60000);
it('a genuine pair holds a late post-COMMIT proof without activating credentials or refunding the grant',async()=>{
 const {pairedOwnerFixture}=await import('./support/cvi-paired-owner-fixture.ts');let committed=false,late=false,activations=0;
 const x=await pairedOwnerFixture((ports,_f,control)=>{const observe=ports.observe,read=ports.authority.read,activate=ports.credentials.activate;ports.observe=async(c:any,s:AbortSignal)=>{const r=await observe(c,s);committed=true;return r;};ports.authority={...ports.authority,read:async(n:string,s:AbortSignal)=>{const r=await read(n,s);if(committed&&!late){late=true;control.at(6000);}return r;}};ports.credentials={...ports.credentials,activate:async(i:any,s:AbortSignal)=>{activations++;return activate(i,s);}};});try{
  const startup=x.make();expect(await startup.start(signal())).toBeNull();expect(startup.isHeld()).toBe(true);expect(late).toBe(true);expect(activations).toBe(0);expect(x.nativeLease().expiresAt).toBe(9000);expect((await x.f.x.inspect()).revision).toBe(4);expect(await startup.start(signal())).toBeNull();expect(x.draft).not.toHaveBeenCalled();
 }finally{await x.close();}
},60000);
it('a genuine paired owner refuses old signed observations even while its lease remains valid',async()=>{
 const {pairedOwnerFixture}=await import('./support/cvi-paired-owner-fixture.ts'),x=await pairedOwnerFixture();try{
  const {wire,say}=await x.start();await say('Long sleeves');x.f.x.setReplayRead(true);x.at(6001);expect((await wire.handle(x.http('Long sleeves'))).status).not.toBe(200);expect(x.draft).not.toHaveBeenCalled();x.f.x.setReplayRead(false);expect((await wire.handle(x.http('Long sleeves','No rearm after failed proof'))).status).not.toBe(200);expect(await x.records()).toHaveLength(0);expect(Object.values(x.context.flow.snapshot().notes).every(n=>n.text==='')).toBe(true);
 }finally{await x.close();}
},60000);
