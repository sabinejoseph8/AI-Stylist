import {afterEach,expect,it,vi} from 'vitest';
import {prepareNotesStartupDiagnostic,STARTUP_DIAGNOSTIC_EVENT_ID} from '../src/notes-startup-diagnostic.ts';
const created={type:'session.created',session:{id:'synthetic',type:'realtime'}};
const ack={type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'gpt-live-transcribe'},turn_detection:null}}}};
function fixture(profile?:'minimal'){
 const controller=new AbortController(),socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,send:vi.fn(),close:vi.fn()}),detachInitialEvents=vi.fn();
 let initial!:(v:unknown)=>void,resolve!:(v:{socket:typeof socket;detachInitialEvents:()=>void})=>void;
 const open=vi.fn((_signal:AbortSignal,receive:(v:unknown)=>void)=>{initial=receive;return new Promise<{socket:typeof socket;detachInitialEvents:()=>void}>(r=>resolve=r);});
 const diagnostic=vi.fn(),runner=prepareNotesStartupDiagnostic({simulation:true,simulationProfile:profile,open,signal:controller.signal,diagnostic});
 return{controller,socket,diagnostic,open,runner,detachInitialEvents,initial:(v:unknown)=>initial(v),opened:async()=>{resolve({socket,detachInitialEvents});await Promise.resolve();},message:(v:unknown)=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(v)}))};
}
afterEach(()=>vi.useRealTimers());
it('refuses default execution without constructing a connection',()=>{const open=vi.fn();expect(()=>prepareNotesStartupDiagnostic({open,signal:new AbortController().signal})).toThrow('disabled');expect(open).not.toHaveBeenCalled();});
it('constructs no connection until run and refuses a second run',async()=>{const s=fixture();expect(s.open).not.toHaveBeenCalled();const p=s.runner.run();expect(s.open).toHaveBeenCalledOnce();s.controller.abort();await p;expect(()=>s.runner.run()).toThrow('single use');});
it('does not connect on an already-aborted signal',async()=>{const s=fixture();s.controller.abort();expect((await s.runner.run()).outcome).toBe('canceled');expect(s.open).not.toHaveBeenCalled();});
it('sends exactly one correlated configuration and no audio or generation, then immediately closes',async()=>{const s=fixture(),p=s.runner.run();s.initial(created);expect(s.socket.send).not.toHaveBeenCalled();await s.opened();const commands=s.socket.send.mock.calls.map(([v])=>JSON.parse(v));expect(commands).toEqual([{event_id:STARTUP_DIAGNOSTIC_EVENT_ID,type:'session.update',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'gpt-live-transcribe',languages:['en'],delay:'low'},turn_detection:null}}}}]);s.message(ack);expect(await p).toMatchObject({outcome:'configuration-accepted',cleanupRequested:true,remoteCleanupVerified:false});expect(s.socket.close).toHaveBeenCalledOnce();expect(s.detachInitialEvents).toHaveBeenCalledOnce();s.message(ack);expect(s.socket.send).toHaveBeenCalledOnce();});
it('captures creation after open settlement',async()=>{const s=fixture(),p=s.runner.run();await s.opened();expect(s.socket.send).not.toHaveBeenCalled();s.initial(created);s.message(ack);expect((await p).outcome).toBe('configuration-accepted');});
it('classifies a pre-creation error without sending configuration',async()=>{const s=fixture(),p=s.runner.run();await s.opened();s.initial({type:'error',error:{type:'invalid_request_error',code:'model_not_found',message:'private sentinel'}});expect(await p).toMatchObject({outcome:'initial-rejected',errorCorrelated:false,details:['provider-code-model-not-found','provider-param-missing']});expect(s.socket.send).not.toHaveBeenCalled();expect(JSON.stringify(s.diagnostic.mock.calls)).not.toContain('sentinel');});
it.each([STARTUP_DIAGNOSTIC_EVENT_ID,'unrelated',undefined])('reports correlation only for the exact fixed event identity: %s',async event_id=>{const s=fixture(),p=s.runner.run();await s.opened();s.initial(created);s.message({type:'error',error:{type:'invalid_request_error',code:'invalid_value',param:'session.type',event_id,message:'private sentinel'}});expect(await p).toMatchObject({outcome:'configuration-rejected',errorCorrelated:event_id===STARTUP_DIAGNOSTIC_EVENT_ID,details:['provider-code-invalid-value','provider-param-session-type']});expect(JSON.stringify(s.diagnostic.mock.calls)).not.toContain('sentinel');expect(s.socket.send).toHaveBeenCalledOnce();});
it.each([{},null,{type:'session.created',session:{}},{type:'input_audio_buffer.committed'}])('holds an invalid initial event without sending anything %#',async value=>{const s=fixture(),p=s.runner.run();await s.opened();s.initial(value);expect((await p).outcome).toBe('invalid-event');expect(s.socket.send).not.toHaveBeenCalled();});
it('does not accept realtime configuration as transcription readiness',async()=>{const s=fixture(),p=s.runner.run();await s.opened();s.initial(created);s.message({...ack,session:{type:'realtime'}});expect((await p).outcome).toBe('incompatible-ack');expect(s.socket.close).toHaveBeenCalledOnce();});
it.each(['opening','configuration'])('times out %s, cancels the opener and closes a late socket',async stage=>{vi.useFakeTimers();const s=fixture(),p=s.runner.run();if(stage==='configuration'){await s.opened();s.initial(created);}await vi.advanceTimersByTimeAsync(10000);expect((await p).outcome).toBe('timed-out');expect(s.open.mock.calls[0]![0].aborted).toBe(true);if(stage==='opening')await s.opened();expect(s.socket.close).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);});
it('redacts opening failure',async()=>{const runner=prepareNotesStartupDiagnostic({simulation:true,signal:new AbortController().signal,open:async()=>{throw Error('private sentinel');}});expect(await runner.run()).toMatchObject({outcome:'opening-failed',remoteCleanupVerified:false});});
it('never claims verified cleanup if closing throws',async()=>{const s=fixture(),p=s.runner.run();await s.opened();s.socket.close.mockImplementation(()=>{throw Error('private sentinel');});s.initial(created);s.message(ack);const result=await p;expect(result.remoteCleanupVerified).toBe(false);expect(JSON.stringify(result)).not.toContain('sentinel');});
it('bounds and rejects unexpected later packets',async()=>{const s=fixture(),p=s.runner.run();await s.opened();s.initial(created);s.message({type:'response.audio.delta',delta:'private sentinel'});expect((await p).outcome).toBe('invalid-event');expect(s.socket.send).toHaveBeenCalledOnce();});

it('rejects an oversized initial envelope without sending configuration',async()=>{const s=fixture(),p=s.runner.run();await s.opened();s.initial({...created,private:'x'.repeat(16384)});expect((await p).outcome).toBe('invalid-event');expect(s.socket.send).not.toHaveBeenCalled();});

it.each([
 [{},'provider-param-missing'],[{param:null},'provider-param-null'],
 [{param:'private sentinel'},'provider-param-unrecognized'],[{param:42},'provider-param-malformed'],
])('retains only a safe parameter category through startup cleanup: %s',async(error,expected)=>{
 const s=fixture(),p=s.runner.run();await s.opened();s.initial(created);
 s.message({type:'error',error:{...error,type:'invalid_request_error',code:'invalid_parameter',message:'private sentinel'}});
 expect(await p).toMatchObject({outcome:'configuration-rejected',details:['provider-code-invalid-parameter',expected],cleanupRequested:true,remoteCleanupVerified:false});
 expect(s.socket.send).toHaveBeenCalledOnce();expect(s.socket.close).toHaveBeenCalled();
 expect(JSON.stringify(s.diagnostic.mock.calls)).not.toContain('sentinel');
});

it('minimal simulation sends only the reviewed configuration and closes without audio',async()=>{
 const s=fixture('minimal'),p=s.runner.run();await s.opened();s.initial(created);
 expect(s.socket.send.mock.calls.map(([value])=>JSON.parse(value))).toEqual([{event_id:STARTUP_DIAGNOSTIC_EVENT_ID,type:'session.update',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'gpt-live-transcribe'},turn_detection:null}}}}]);
 s.message(ack);expect(await p).toMatchObject({outcome:'configuration-accepted',cleanupRequested:true,remoteCleanupVerified:false});
 expect(s.socket.send).toHaveBeenCalledOnce();expect(s.socket.close).toHaveBeenCalledOnce();
 expect(()=>s.runner.run()).toThrow('single use');
});
it.each(['missing','null','unknown','malformed'])('minimal simulation retains fixed %s parameter evidence and does not retry',async shape=>{
 const s=fixture('minimal'),p=s.runner.run();await s.opened();s.initial(created);
 const fields=shape==='missing'?{}:{param:shape==='null'?null:shape==='unknown'?'private sentinel':42};
 s.message({type:'error',error:{...fields,type:'invalid_request_error',code:'invalid_parameter',message:'private sentinel'}});
 const result=await p;expect(result.outcome).toBe('configuration-rejected');
 expect(result.details).toEqual(['provider-code-invalid-parameter',shape==='unknown'?'provider-param-unrecognized':`provider-param-${shape}`]);
 expect(JSON.stringify(result)).not.toContain('sentinel');expect(s.socket.send).toHaveBeenCalledOnce();expect(s.socket.close).toHaveBeenCalledOnce();
});
it('minimal simulation keeps the ten-second deadline and closes a late connection',async()=>{
 vi.useFakeTimers();const s=fixture('minimal'),p=s.runner.run();await vi.advanceTimersByTimeAsync(10000);
 expect((await p).outcome).toBe('timed-out');await s.opened();expect(s.socket.send).not.toHaveBeenCalled();expect(s.socket.close).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
});
it('minimal simulation cancels immediately and never accepts a late acknowledgment',async()=>{
 const s=fixture('minimal'),p=s.runner.run();await s.opened();s.initial(created);s.controller.abort();
 expect((await p).outcome).toBe('canceled');s.message(ack);expect(s.socket.send).toHaveBeenCalledOnce();expect(s.socket.close).toHaveBeenCalledOnce();
});
it('refuses unknown simulated profiles before constructing a connection',()=>{
 const s=fixture();expect(()=>prepareNotesStartupDiagnostic({simulation:true,simulationProfile:'private sentinel' as never,open:s.open,signal:s.controller.signal})).toThrow('simulation only');expect(s.open).not.toHaveBeenCalled();
});
it('an existing live execution permit cannot select the unapproved minimal profile',async()=>{
 const {createPrivateNotesTrialExecution}=await import('../src/note-execution.ts');
 const permit=createPrivateNotesTrialExecution({financialApproved:true,securityApproved:true,ledger:{version:1,purpose:'notes-only-private-trial',approval:{id:'synthetic_approved_trial',cents:200,maxSeconds:85,maxTurns:2,maxExtractions:64,maxInputTokens:1000000,maxOutputTokens:2048},reservation:{id:'synthetic_reservation',state:'reserved'}}});
 const s=fixture();expect(()=>prepareNotesStartupDiagnostic({privateTrial:permit,simulationProfile:'minimal',open:s.open,signal:s.controller.signal})).toThrow('simulation only');expect(s.open).not.toHaveBeenCalled();
});
it.each(['realtime','wrong-model'])('minimal simulation refuses an incompatible %s acknowledgment',async kind=>{
 const s=fixture('minimal'),p=s.runner.run();await s.opened();s.initial(created);
 const value=structuredClone(ack);if(kind==='realtime')value.session.type='realtime';else value.session.audio.input.transcription.model='different';s.message(value);
 expect((await p).outcome).toBe('incompatible-ack');expect(s.socket.close).toHaveBeenCalledOnce();expect(s.socket.send).toHaveBeenCalledOnce();
});

it('refuses a forged minimal grant before opening any connection',()=>{
 const s=fixture();expect(()=>prepareNotesStartupDiagnostic({simulation:true,minimalExecution:{profile:'minimal'},open:s.open,signal:s.controller.signal})).toThrow('authorization');expect(s.open).not.toHaveBeenCalled();
});
it('does not mint a minimal grant from a forged private execution',async()=>{
 const {createMinimalStartupExecution}=await import('../src/notes-startup-diagnostic.ts');
 expect(()=>createMinimalStartupExecution({approvalId:'synthetic',reservationId:'synthetic'} as never)).toThrow('authorization');
});
