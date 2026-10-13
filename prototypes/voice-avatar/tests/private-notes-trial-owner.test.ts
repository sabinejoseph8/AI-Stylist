import {afterEach,it,expect,vi} from 'vitest';
import {preparePrivateNotesTrialOwner} from '../src/private-notes-trial-owner.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';
const preview={origin:'https://fixture.onrender.com',password:'synthetic_preview_password_1234567890'};
const request=(overrides:object={})=>({method:'GET',path:'/api/private-notes-trial-preparation',host:'fixture.onrender.com',origin:preview.origin,authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64'),consent:true,signal:new AbortController().signal,...overrides});
function setup(){
 const socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,send:vi.fn(),close:vi.fn()});
 const capture={start:vi.fn(async()=>true),stop:vi.fn(),end:vi.fn()},dispose=vi.fn(),publish=vi.fn();
 let consumed=false;const allowance={reserve:vi.fn(async()=>{if(consumed)throw Error('consumed');consumed=true;return 'synthetic_run';}),recordOutcome:vi.fn(async()=>{})};
 const createTransports=vi.fn(()=>({open:async(_signal:AbortSignal,initial:(event:unknown)=>void)=>{initial({type:'session.created',session:{id:'synthetic'}});queueMicrotask(()=>queueMicrotask(()=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}})}))));return{socket,detachInitialEvents:()=>{}};},fetch:vi.fn(async()=>Response.json({})),countFetch:vi.fn(async()=>Response.json({})),capture,dispose}));
 const options={simulation:true,preview,allowance,createTransports,publish};const owner=preparePrivateNotesTrialOwner(options);return{owner,options,allowance,createTransports,publish,dispose,capture,socket};
}
afterEach(()=>vi.useRealTimers());
it('rejects default activation before constructing providers',()=>{const s=setup();expect(()=>preparePrivateNotesTrialOwner({...s.options,simulation:false})).toThrow('disabled');expect(s.createTransports).not.toHaveBeenCalled();});
for(const override of [{authorization:undefined},{origin:'https://evil.test'},{host:'evil.test'},{consent:false},{path:'/other'}])it('checks access before reserve or provider construction',async()=>{const s=setup();expect((await s.owner.start(request(override))).status).not.toBe(200);expect(s.allowance.reserve).not.toHaveBeenCalled();expect(s.createTransports).not.toHaveBeenCalled();});
it('keeps reservation consumed, clears notes and disposes once on end',async()=>{
 const s=setup();const session=await s.owner.start(request());expect(session.status).toBe(200);if(session.status!==200)return;
 expect(s.createTransports).toHaveBeenCalledWith('synthetic_run',{simulation:true});expect(session.edit('color','green',0)).toBe(true);await session.end();await session.end();expect(s.dispose).toHaveBeenCalledOnce();expect(s.socket.close).toHaveBeenCalledOnce();expect(s.capture.end).toHaveBeenCalledOnce();expect(session.snapshot().notes.color.status).toBe('missing');expect(s.allowance.recordOutcome).toHaveBeenCalledExactlyOnceWith('synthetic_run','held');expect(s.owner.status()).toMatchObject({state:'held',activationEnabled:false,remoteCleanupVerified:false});
 const fresh=preparePrivateNotesTrialOwner(s.options);expect((await fresh.start(request())).status).toBe(503);expect(s.createTransports).toHaveBeenCalledOnce();
});
it('limits begin attempts to two before more capture work',async()=>{const s=setup();const session=await s.owner.start(request());if(session.status!==200)throw Error('not ready');await session.beginTurn('t1');await session.beginTurn('t2');expect(await session.beginTurn('t3')).toBe(false);expect(s.owner.status().state).toBe('held');expect(s.capture.start).toHaveBeenCalledOnce();});
it('enforces the 85-second deadline and capture cleanup',async()=>{vi.useFakeTimers();const s=setup();const session=await s.owner.start(request());if(session.status!==200)throw Error('not ready');await vi.advanceTimersByTimeAsync(85000);expect(s.owner.status().state).toBe('held');expect(s.dispose).toHaveBeenCalledOnce();expect(session.snapshot().notes.color.status).toBe('missing');expect(vi.getTimerCount()).toBe(0);});
it('does not retry a failed reservation outcome write',async()=>{const s=setup();s.allowance.recordOutcome.mockRejectedValue(Error('private'));const session=await s.owner.start(request());if(session.status!==200)throw Error('not ready');await session.end();await session.end();expect(s.allowance.recordOutcome).toHaveBeenCalledOnce();expect(s.owner.status().state).toBe('held');});
it('records a late reservation as held after request cancellation without constructing providers',async()=>{const s=setup();let resolve!:(id:string)=>void;s.allowance.reserve.mockImplementation(()=>new Promise(r=>resolve=r));const c=new AbortController();const pending=s.owner.start(request({signal:c.signal}));c.abort();resolve('late');expect((await pending).status).toBe(499);expect(s.createTransports).not.toHaveBeenCalled();expect(s.allowance.recordOutcome).toHaveBeenCalledExactlyOnceWith('late','held');});

async function capability(reservationId:string,approvalId='fixture_approval'){
 const {createPrivateNotesTrialExecution}=await import('../src/note-execution.ts');
 return createPrivateNotesTrialExecution({financialApproved:true,securityApproved:true,ledger:{version:1,purpose:'notes-only-private-trial',approval:{id:approvalId,cents:200,maxSeconds:85,maxTurns:2,maxExtractions:64,maxInputTokens:1000000,maxOutputTokens:2048},reservation:{id:reservationId,state:'reserved'}}});
}
it('obtains matching execution only after access and reservation, then propagates it',async()=>{
 const s=setup(),authorize=vi.fn(async (id:string)=>capability(id));const owner=preparePrivateNotesTrialOwner({...s.options,simulation:false,activation:{approvalId:'fixture_approval',financialApproved:true,securityApproved:true,authorize}});
 expect((await owner.start(request({consent:false}))).status).toBe(403);expect(authorize).not.toHaveBeenCalled();expect(s.allowance.reserve).not.toHaveBeenCalled();
 const result=await owner.start(request());try{expect(result.status).toBe(200);expect(authorize).toHaveBeenCalledWith('synthetic_run',expect.any(AbortSignal));expect(s.allowance.reserve.mock.invocationCallOrder[0]).toBeLessThan(authorize.mock.invocationCallOrder[0]!);expect(authorize.mock.invocationCallOrder[0]).toBeLessThan(s.createTransports.mock.invocationCallOrder[0]!);if(result.status!==200)throw Error('not active');expect(result.probeSnapshot().liveEnabled).toBe(true);expect(result.probeSnapshot().transcription?.liveEnabled).toBe(true);expect(owner.status().activationEnabled).toBe(true);}finally{if(result.status===200)await result.end();}
 expect(s.allowance.recordOutcome).toHaveBeenCalledWith('synthetic_run','held');
});
for(const variant of ['forged','reservation','approval'] as const)it('holds '+variant+' capability without constructing providers',async()=>{
 const s=setup();const owner=preparePrivateNotesTrialOwner({...s.options,simulation:false,activation:{approvalId:'fixture_approval',financialApproved:true,securityApproved:true,authorize:async (id:string)=>variant==='forged'?{} as never:capability(variant==='reservation'?'other':id,variant==='approval'?'other':'fixture_approval')}});
 expect((await owner.start(request())).status).toBe(503);expect(s.createTransports).not.toHaveBeenCalled();expect(s.allowance.recordOutcome).toHaveBeenCalledWith('synthetic_run','held');
});
it('settles authorization cancellation even if its factory ignores abort',async()=>{
 const s=setup();let resolve!:(cap:Awaited<ReturnType<typeof capability>>)=>void;const authorize=vi.fn(()=>new Promise<Awaited<ReturnType<typeof capability>>>(r=>resolve=r));const c=new AbortController();
 const owner=preparePrivateNotesTrialOwner({...s.options,simulation:false,activation:{approvalId:'fixture_approval',financialApproved:true,securityApproved:true,authorize}});
 const pending=owner.start(request({signal:c.signal}));await vi.waitFor(()=>expect(authorize).toHaveBeenCalledOnce());c.abort();expect((await pending).status).toBe(503);resolve(await capability('synthetic_run'));await Promise.resolve();expect(s.createTransports).not.toHaveBeenCalled();expect(s.allowance.recordOutcome).toHaveBeenCalledOnce();expect(owner.status().state).toBe('held');
});
it('rejects mixed and incomplete activation configuration before reservation',()=>{
 const s=setup(),activation={approvalId:'fixture_approval',financialApproved:true,securityApproved:true,authorize:async (id:string)=>capability(id)};
 expect(()=>preparePrivateNotesTrialOwner({...s.options,activation})).toThrow('disabled');expect(()=>preparePrivateNotesTrialOwner({...s.options,simulation:false,activation:{...activation,financialApproved:false}})).toThrow('disabled');expect(s.allowance.reserve).not.toHaveBeenCalled();
});
