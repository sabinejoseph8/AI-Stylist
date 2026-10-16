import {startupAdmissionFixture} from './cvi-startup-admission-fixture.ts';
import {createLocalOwnedReplayPort} from '../../src/server/local-cvi-owned-replay.ts';
import {replayInspectionFixture} from './cvi-replay-inspection-fixture.ts';
import type {ReplayInspectionRequest} from '../../src/server/local-cvi-replay-inspection.ts';
/** Mixed contract fixture: original startup handoff is actual signed/native.
 * Per-request owner/credential proofs, replay and model outcomes are simulated.
 * Actual guarded HTTP integration uses continuingHttpFixture separately. */
import {vi} from 'vitest';
import {createLocalCviNotebookContext} from '../../src/server/local-cvi-notebook-context.ts';
import {createLocalCviTranscriptAdapter} from '../../src/server/local-cvi-transcript-adapter.ts';
import {createLocalCviStartupOwner} from './cvi-private-contract-owner.ts';
import {localStartupOwnerBoot} from '../../src/server/local-cvi-startup-admission.ts';
import {createLocalCviHttpAdapter} from './cvi-http-contract.ts';
import {APPROVED_NOTES_RETENTION} from '../../src/session/notes-retention-policy.ts';
import type {CviConversationInput} from '../../src/server/local-cvi-styling.ts';
import type {CviReplayReceipt,CviReplayRequest} from '../../src/server/local-cvi-endpoint.ts';
const signal=()=>new AbortController().signal;
export async function cviHttpFixture(profile:Readonly<{temperature?:number;top_p?:number}>={}){
 let time=1000,live=true,turnOrdinal=1,seq=0;
 const f=await startupAdmissionFixture(()=>time),binding=f.resources.binding,expected=f.expected;
 const identity={ownerId:'00000000-0000-4000-8000-000000000001',sessionId:'11111111-1111-4111-8111-111111111111',isCurrent:async()=>live},appRequest=()=>new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}});
 const checkpoint={inspectFresh:vi.fn((s:AbortSignal)=>f.checkpoint.inspectFresh(s)),inspectOwnerFresh:vi.fn(async(n:any)=>{const {minimumRevision,...owner}=n;return {status:'owner-current',revision:minimumRevision,operationId:f.lastPlan()?.id??expected.operationId,owner,permissions:{write:false,reconcile:false,sign:false,resume:false}};})};
 const draft=vi.fn(async(s:any,_signal?:AbortSignal,_conversation?:CviConversationInput)=>'Synthetic coverage '+s.notes.coverage.text),check=vi.fn(async(text:string,s:any,_signal?:AbortSignal,_conversation?:CviConversationInput)=>({approved:true,text,revision:s.revision}));
 const context=createLocalCviNotebookContext({simulation:true,identity,authorize:async r=>r.headers.get('authorization')==='Bearer fixture-customer'?identity:null,checkpoint,ports:{draft,check},clock:()=>time,policy:APPROVED_NOTES_RETENTION});
 const records=new Map<string,CviReplayReceipt>(),replay={storeId:f.journal.storeId,inspect:vi.fn(async(r:ReplayInspectionRequest)=>replayInspectionFixture(r,[...records.values()])),reserve:vi.fn(async(r:CviReplayRequest,_s:AbortSignal)=>{if(records.has(r.requestDigest)||[...records.values()].some(v=>v.status==='reserved'))throw Error('Held');const value={...r,receipt:'fixture-receipt-'+(records.size+1).toString(16).padStart(32,'0'),status:'reserved' as const};records.set(r.requestDigest,value);return {...value};}),consume:vi.fn(async(r:CviReplayReceipt,_s:AbortSignal)=>{const previous=records.get(r.requestDigest);if(!previous||previous.status!=='reserved'||previous.receipt!==r.receipt)throw Error('Held');const value={...r,status:'spent' as const};records.set(r.requestDigest,value);return {...value};})};
 const authority={activate:vi.fn(async(i:any)=>({storeId:i.storeId,scopeDigest:i.scopeDigest,bindingDigest:i.bindingDigest,bootDigest:i.bootDigest,generation:i.previous+1})),check:vi.fn(async(i:any)=>({...i,active:true}))};
 const privateReplay=createLocalOwnedReplayPort({storeId:replay.storeId,nativeStoreId:expected.storeId,binding},{inspect:(r,s)=>replay.inspect(r),mutate:(mode,_lease,_floor,r,s)=>mode==='reserve'?replay.reserve(r,s):replay.consume(r as CviReplayReceipt,s)},()=>time);
 const owner=await createLocalCviStartupOwner(expected,context.checkpoint,f.admission(),{binding,boot:f.resources.boot,replay:privateReplay,authority,makeFlow:()=>context.flow},()=>time,8000).start(signal());
 if(!owner)throw Error('HTTP owner fixture held');
 const transcript=createLocalCviTranscriptAdapter({simulation:true,conversation:'c_fixture',participantId:'h_fixture',context,admit:async d=>d.room==='fixture-room'&&d.sender==='fixture-pal'?{request:appRequest(),turnId:'fixture-http-turn-'+turnOrdinal,turnOrdinal}:null,extract:async({text})=>[{field:'style',value:text}]});
 const make=(deadlineMs=8000,applicationRequest=appRequest())=>createLocalCviHttpAdapter({simulation:true,binding,context,transcript,owner,applicationRequest,profile,clock:()=>time,deadlineMs});
 const wire=make();
 const body=(text='Long sleeves')=>({model:'local-simulation',stream:true,messages:[{role:'user',content:text}],...profile});
 const request=(raw:unknown=body(),extra:HeadersInit={},abortSignal=signal())=>new Request(binding.origin+'/cvi/v1/chat/completions',{method:'POST',signal:abortSignal,headers:{'x-ai-stylist-token':binding.secret,'content-type':'application/json',...Object.fromEntries(new Headers(extra))},body:typeof raw==='string'?raw:JSON.stringify(raw)});
 const say=(text='Long sleeves',stream=false)=>transcript.ingest('fixture-room','fixture-pal',{message_type:'conversation',event_type:stream?'conversation.utterance.streaming':'conversation.utterance',timestamp:1746000000.123,seq:++seq,conversation_id:'c_fixture',properties:{role:'user',speech:text,participant_id:'h_fixture',...(stream?{content_index:seq,final:true}:{})}},signal());
 return {binding,expected,context,owner,transcript,wire,make,records,replay,authority,checkpoint,draft,check,body,request,say,appRequest,next:()=>{turnOrdinal++;},at:(v:number)=>{time=v;},live:(v:boolean)=>{live=v;},close:async()=>{wire.close();await f.close();}};
}
