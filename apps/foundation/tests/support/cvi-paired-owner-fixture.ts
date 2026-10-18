import type {Proposal} from '../../src/session/proposal-stream.ts';
import {mkdir} from 'node:fs/promises';
import {witnessedCall} from './cvi-witness-process.ts';
import type {ReplayWitnessPin} from '../../src/server/local-cvi-replay-witness.ts';
/** Actual local pair/transaction/signature/journal; account, model and wire simulated. */
import {vi} from 'vitest';
import {startupAdmissionFixture} from './cvi-startup-admission-fixture.ts';
import {mandatoryCall} from './cvi-mandatory-fixture.ts';
import {transactionCall} from './cvi-deferred-gate-fixture.ts';
import {createLocalGatedSqliteOwnerPair} from '../../src/server/local-cvi-owner-pair.ts';
import {createLocalCviStartupOwner} from '../../src/server/local-cvi-startup-owner.ts';
import {createLocalCviNotebookContext} from '../../src/server/local-cvi-notebook-context.ts';
import {createLocalCviTranscriptAdapter} from '../../src/server/local-cvi-transcript-adapter.ts';
import {createLocalCviHttpAdapter} from '../../src/server/local-cvi-http-adapter.ts';
import {witnessServiceDigest} from '../../src/server/local-cvi-witness-service.ts';
import {historyCanonical} from '../../src/server/local-cvi-history-authority.ts';
import {APPROVED_NOTES_RETENTION} from '../../src/session/notes-retention-policy.ts';
import {call} from './cvi-replay-process.ts';
/** Fixed synthetic identity metadata shared before factory construction. */
export const PAIRED_FIXTURE_SCOPE=Object.freeze({ownerId:'00000000-0000-4000-8000-000000000001',sessionId:'11111111-1111-4111-8111-111111111111'});
const signal=()=>new AbortController().signal;
export async function pairedOwnerFixture(configure?:(ports:any,f:Awaited<ReturnType<typeof startupAdmissionFixture>>,control:{clock:()=>number;at(n:number):void})=>void,options:Readonly<{extract?:(input:Readonly<{text:string;complete:boolean}>,signal:AbortSignal)=>Promise<readonly Proposal[]>}>={}){
 const extract=options.extract??(async({text}:Readonly<{text:string;complete:boolean}>)=>[{field:'style' as const,value:text}]);if(typeof extract!=='function')throw Error('Synthetic extractor required');
 let time=1000,ordinal=0,seq=0;const clock=()=>time;const f=await startupAdmissionFixture(()=>time,10000,true),m=f.gateMaterial(),key=m.databaseKey,authority=f.x.authorityPort('rotator'),rotator=f.x.actors.find(a=>a.role==='rotator')!,reader=f.x.actors.find(a=>a.role==='observer')!;
 const witnessRoot=f.root+'/replay-witness';await mkdir(witnessRoot,{mode:0o700});const witness=await witnessedCall(f.replayRoot,'prepareWitness',{witnessRoot,storeId:f.journal.storeId,kind:'replay'}) as ReplayWitnessPin;
 const config={witness,authority:f.x.pin,database:m.pin.database,principal:'fixture_rotator',actor:{principalDigest:rotator.principalDigest,readerPrincipal:reader.principalDigest,ownerDigest:f.ownerDigest},scope:f.scope,baseline:f.baseline,registry:m.registry,nativeRoot:f.x.root,replayRoot:f.replayRoot,physicalBindingDigest:m.physicalBindingDigest,binding:f.resources.binding};
 const plans=new Map<string,any>();let nativeLease:any;
 const ports={authority,credentials:f.resources.authority,planFull:vi.fn(async(kind:'activate'|'renew',args:Record<string,unknown>,at:number,_s:AbortSignal)=>{const intent=await f.x.plan(kind,args);const full=await mandatoryCall({root:f.x.root,config:{...f.x.config,now:at},mode:'plan-full',actor:intent.actor,kind:intent.kind,args:intent.args});plans.set(intent.id.slice(0,32),intent);return {intent,previous:full.previous,target:full.target};}),
 identity:async(request:any,b:any)=>{const body={version:1,keyId:m.pin.database.keyId,...request,bindingDigest:witnessServiceDigest(b),issuedAt:time,expiresAt:time+3000};return {body,signature:key.sign(historyCanonical(body))};},
 observe:async(command:Record<string,unknown>)=>{const plan=plans.get(command.operationId as string);if(!plan)throw Error('Unknown original plan');const seen=await transactionCall({root:f.x.root,plan,command,config:f.x.config,principal:'fixture_rotator',mode:'observe'});const g=seen.snapshot.grants.find((r:any)=>r[6]==='active');nativeLease={storeId:f.x.pin.storeId,policyDigest:f.x.pin.policyDigest,generation:g[0],ownerDigest:g[1],bootDigest:g[2],token:plan.args.token,issuedAt:g[4],expiresAt:g[5]};f.restoreMarker({operationId:seen.operationId,transactionId:seen.transactionId,claimHash:seen.claimHash,consumed:true,protected:true});return seen;},
 references:()=>f.gateMaterial().registry,checkpoint:m.readPorts};
 configure?.(ports,f,{clock,at:n=>time=n});
 const pair=createLocalGatedSqliteOwnerPair(config,ports,clock),identity={...PAIRED_FIXTURE_SCOPE,isCurrent:async()=>true},appRequest=()=>new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}});
 const draft=vi.fn(async(s:any)=>'Synthetic '+s.notes.coverage.text),check=vi.fn(async(text:string,s:any)=>({approved:true,text,revision:s.revision})),context=createLocalCviNotebookContext({simulation:true,identity,authorize:async r=>r.headers.get('authorization')==='Bearer fixture-customer'?identity:null,checkpoint:pair.checkpoint,ports:{draft,check},clock,policy:APPROVED_NOTES_RETENTION});
 const resources={...f.resources,replay:pair.replay,authority:pair.credentials,makeFlow:()=>context.flow},make=()=>createLocalCviStartupOwner(f.expected,context.checkpoint,pair.admission,resources,clock,5000,8000);
 let wire:ReturnType<typeof createLocalCviHttpAdapter>|undefined;
 const start=async()=>{const owner=await make().start(signal());if(!owner)throw Error('Original paired fixture held');const transcript=createLocalCviTranscriptAdapter({simulation:true,conversation:'c_fixture',participantId:'h_fixture',context,admit:async()=>({request:appRequest(),turnId:'fixture-paired-turn-'+ordinal,turnOrdinal:ordinal}),extract,deadlineMs:8000});wire=createLocalCviHttpAdapter({simulation:true,binding:resources.binding,owner,context,transcript,applicationRequest:appRequest(),clock:()=>time});let streaming=false,index=0,streamEpoch=-1;return {owner,wire,transcript,stream:(text:string,complete=false)=>{const epoch=context.flow.snapshot().context?.epoch??-1;if(epoch!==streamEpoch){streaming=false;index=0;streamEpoch=epoch;}if(!streaming){ordinal++;index=0;streaming=true;}if(complete)streaming=false;return transcript.ingest('fixture-room','fixture-pal',{message_type:'conversation',event_type:complete?'conversation.utterance':'conversation.utterance.streaming',timestamp:1,seq:++seq,conversation_id:'c_fixture',properties:{role:'user',speech:text,participant_id:'h_fixture',...(!complete?{content_index:index++,final:false}:{})}},signal());},say:(text:string)=>{ordinal++;streaming=false;return transcript.ingest('fixture-room','fixture-pal',{message_type:'conversation',event_type:'conversation.utterance',timestamp:1,seq:++seq,conversation_id:'c_fixture',properties:{role:'user',speech:text,participant_id:'h_fixture'}},signal());}};};
 const http=(text:string,prefix='')=>new Request(resources.binding.origin+'/cvi/v1/chat/completions',{method:'POST',headers:{'x-ai-stylist-token':resources.binding.secret,'content-type':'application/json'},body:JSON.stringify({model:'local-simulation',stream:true,messages:[...(prefix?[{role:'assistant',content:prefix}]:[]),{role:'user',content:text}]})});
 return {f,clock,config,ports,pair,context,resources,make,start,http,draft,nativeLease:()=>structuredClone(nativeLease),write:async()=>f.executeTracked(await f.x.commitPlan(nativeLease)),at:(n:number)=>time=n,records:async()=>((await call(f.replayRoot,'inspect',{storeId:f.journal.storeId})) as any).records,close:async()=>{wire?.close();await pair.close();await f.close();}};
}
