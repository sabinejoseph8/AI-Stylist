/** Actual local signed/native/journal composition; account/transport/model fixtures. */
import {vi} from 'vitest';
import {startupAdmissionFixture} from './cvi-startup-admission-fixture.ts';
import {createLocalCviStartupOwner} from '../../src/server/local-cvi-startup-owner.ts';
import {createLocalCviNotebookContext} from '../../src/server/local-cvi-notebook-context.ts';
import {createLocalCviTranscriptAdapter} from '../../src/server/local-cvi-transcript-adapter.ts';
import {createLocalCviHttpAdapter} from '../../src/server/local-cvi-http-adapter.ts';
import {createLocalDurableOwnerContinuation} from '../../src/server/local-cvi-owner-continuation.ts';
import {cviCredentialDigests} from '../../src/server/local-cvi-credentials.ts';
import {APPROVED_NOTES_RETENTION} from '../../src/session/notes-retention-policy.ts';
import {call} from './cvi-replay-process.ts';
const signal=()=>new AbortController().signal;
export async function continuingHttpFixture(){
 let time=1000,live=true,ordinal=0,seq=0;const f=await startupAdmissionFixture(()=>time);
 const identity={ownerId:'00000000-0000-4000-8000-000000000001',sessionId:'11111111-1111-4111-8111-111111111111',isCurrent:async()=>live},request=()=>new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}});
 const draft=vi.fn(async(s:any)=>'Synthetic '+s.notes.coverage.text),check=vi.fn(async(text:string,s:any)=>({approved:true,text,revision:s.revision}));
 const context=createLocalCviNotebookContext({simulation:true,identity,authorize:async r=>r.headers.get('authorization')==='Bearer fixture-customer'?identity:null,checkpoint:f.checkpoint,ports:{draft,check},clock:()=>time,policy:APPROVED_NOTES_RETENTION});f.resources.makeFlow=()=>context.flow;
 const owner=await createLocalCviStartupOwner(f.expected,context.checkpoint,f.admission(),f.resources,()=>time,5000,8000).start(signal());if(!owner){await f.close();throw Error('Continuing HTTP fixture held');}
 const extract=vi.fn(async({text}:{text:string})=>[{field:'style' as const,value:text}]);
 const transcript=createLocalCviTranscriptAdapter({simulation:true,conversation:'c_fixture',participantId:'h_fixture',context,admit:async()=>({request:request(),turnId:'fixture-continuing-turn-'+ordinal,turnOrdinal:ordinal}),extract,deadlineMs:8000});
 const makeWire=(applicationRequest=request())=>createLocalCviHttpAdapter({simulation:true,binding:f.resources.binding,owner,context,transcript,applicationRequest,clock:()=>time});
 const wire=makeWire();
 const rotator=f.x.actors.find(a=>a.role==='rotator')!,reader=f.x.actors.find(a=>a.role==='observer')!,authority=f.x.authorityPort('rotator');
 const ports={plan:vi.fn(async(a:any)=>f.x.plan('renew',{lease:a.lease,ttl:a.ttl,token:a.token})),execute:vi.fn((p:any,s:AbortSignal)=>f.executeTracked(p)),read:(n:string,s:AbortSignal)=>authority.read(n)};
 const continuation=createLocalDurableOwnerContinuation(f.x.pin,f.nativeLease(),cviCredentialDigests(f.resources.binding).bindingDigest,f.resources.binding.expiresAt,{principalDigest:rotator.principalDigest,readerPrincipal:reader.principalDigest},ports,()=>time);
 const say=(text:string)=>{ordinal++;return transcript.ingest('fixture-room','fixture-pal',{message_type:'conversation',event_type:'conversation.utterance',timestamp:1,seq:++seq,conversation_id:'c_fixture',properties:{role:'user',speech:text,participant_id:'h_fixture'}},signal());};
 const http=(text:string,prefix='')=>new Request(f.resources.binding.origin+'/cvi/v1/chat/completions',{method:'POST',headers:{'x-ai-stylist-token':f.resources.binding.secret,'content-type':'application/json'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[...(prefix?[{role:'assistant',content:prefix}]:[]),{role:'user',content:text}]})});
 return {f,context,owner,transcript,wire,makeWire,continuation,ports,draft,check,extract,say,http,request,at:(n:number)=>{time=n;},revoke:()=>{live=false;},records:async()=>((await call(f.replayRoot,'inspect',{storeId:f.journal.storeId})) as any).records,close:async()=>{wire.close();await f.close();}};
}
