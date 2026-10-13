import {it,expect,vi} from 'vitest';
import {createPrivateNotesTrialExecution,isPrivateNotesTrialExecution,validNoteExecution,noteExecutionOptions} from '../src/note-execution.ts';
import {createPreparedNoteProviderSession} from '../src/prepared-note-provider-session.ts';
import {prepareNoteStartup} from '../src/prepared-note-startup.ts';
import {PreparedRemoteNoteCapture} from '../src/note-remote-capture.ts';
import {NotebookState} from '../src/notebook-state.ts';
import {prepareNoteDispatchBudget} from '../src/note-dispatch-budget.ts';
import {NoteConnectionScope} from '../src/note-connection-scope.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const ledger={version:1,purpose:'notes-only-private-trial',approval:{id:'fixture_approval',cents:200,maxSeconds:85,maxTurns:2,maxExtractions:64,maxInputTokens:1000000,maxOutputTokens:2048},reservation:{id:'fixture_run',state:'reserved'}};
const permit=()=>createPrivateNotesTrialExecution({financialApproved:true,securityApproved:true,ledger:structuredClone(ledger)});
for(const options of [{},{financialApproved:true},{securityApproved:true},{financialApproved:false,securityApproved:true}])it('refuses an execution capability without both explicit trusted approvals',()=>expect(()=>createPrivateNotesTrialExecution({...options,ledger})).toThrow('authorization'));
for(const reservation of [null,{id:'fixture_run',state:'held'},{id:'fixture_run',state:'transport-closed'}])it('refuses missing or consumed reservations',()=>expect(()=>createPrivateNotesTrialExecution({financialApproved:true,securityApproved:true,ledger:{...ledger,reservation}})).toThrow('reservation'));
it('rejects malformed allowance terms rather than changing the approved bounds',()=>expect(()=>createPrivateNotesTrialExecution({financialApproved:true,securityApproved:true,ledger:{...ledger,approval:{...ledger.approval,cents:201}}})).toThrow());
it('accepts only an opaque process-local capability, with an explicit unmixed mode',()=>{
 const cap=permit();expect(isPrivateNotesTrialExecution(cap)).toBe(true);expect(Object.isFrozen(cap)).toBe(true);expect(cap).toMatchObject({approvalId:'fixture_approval',reservationId:'fixture_run'});
 expect(isPrivateNotesTrialExecution({...cap})).toBe(false);expect(isPrivateNotesTrialExecution(structuredClone(cap))).toBe(false);
 for(const bad of [{},{simulation:false},{privateTrial:{...cap}},{simulation:true,privateTrial:cap},{simulation:'false',privateTrial:cap}])expect(validNoteExecution(bad as never)).toBe(false);
 expect(validNoteExecution({simulation:true})).toBe(true);expect(validNoteExecution({privateTrial:cap})).toBe(true);expect(Object.isFrozen(noteExecutionOptions({privateTrial:cap}))).toBe(true);
});
it('requires counting in private-trial provider composition before sending configuration',()=>{
 const socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,send:vi.fn(),close:vi.fn()});
 expect(()=>createPreparedNoteProviderSession({privateTrial:permit(),socket,fetch:vi.fn(),signal:new AbortController().signal,notebook:new NotebookState(),capture:new PreparedRemoteNoteCapture({simulation:true}),changed:()=>{}})).toThrow('counted extraction');expect(socket.send).not.toHaveBeenCalled();
});
it('propagates the selected private mode through startup, provider and capture without freeing its lease',async()=>{
 const cap=permit(),execution={privateTrial:cap},capture=new PreparedRemoteNoteCapture(execution),notebook=new NotebookState();
 const socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,send:vi.fn(),close:vi.fn()});
 const startup=prepareNoteStartup({...execution,signal:new AbortController().signal,open:async(_signal,initial)=>{initial({type:'session.created',session:{id:'fixture'}});return{socket,detachInitialEvents:()=>{}};},session:{capture,notebook,fetch:vi.fn(),countFetch:vi.fn(),changed:()=>{}}});
 try{
  await startup.openingSettled;socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}})}));
  expect(startup.status()).toMatchObject({state:'ready',liveEnabled:true,remoteCleanupVerified:false});const active=startup.active()!;expect(active.status().liveEnabled).toBe(true);expect(active.probe.snapshot().liveEnabled).toBe(true);expect(active.probe.snapshot().transcription?.liveEnabled).toBe(true);expect(capture.snapshot().liveEnabled).toBe(true);
  const scope=new NoteConnectionScope({...execution,create:()=>active.probe});const owner={};expect(scope.open(owner)).toBeTruthy();expect(scope.snapshot().liveEnabled).toBe(true);scope.close();expect(scope.snapshot().held).toBe(true);expect(capture.snapshot().ended).toBe(true);
 }finally{startup.end();}
});
it('preserves simulation status and freezes mode selection for accounting',()=>{
 const options={privateTrial:permit()};const budget=prepareNoteDispatchBudget(options);options.privateTrial=undefined as never;budget.reserve(100,2048);expect(budget.snapshot()).toMatchObject({attempts:1,liveEnabled:true});expect(prepareNoteDispatchBudget({simulation:true}).snapshot().liveEnabled).toBe(false);
});
