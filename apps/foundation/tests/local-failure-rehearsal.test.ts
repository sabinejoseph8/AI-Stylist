import {expect,it,vi} from 'vitest';
import {StylingSession} from '../src/session/styling-session.ts';
import {APPROVED_NOTES_RETENTION as policy} from '../src/session/notes-retention-policy.ts';
import {LocalSessionLifecycle} from '../src/session/local-session-lifecycle.ts';
import {LocalDiagnostics} from '../src/diagnostics/local-diagnostics.ts';
import {LocalOutfitValidation} from '../src/validation/local-outfit-validation.ts';
import type {ValidationFixture,SemanticOutcome} from '../src/validation/local-outfit-validation.ts';
import {createAuthSessionAuthority} from '../src/server/auth-session.ts';
// Test-only wiring, never mounted in the customer app or a server.
const owner='00000000-0000-0000-0000-000000000001',sessionId='00000000-0000-0000-0000-000000000002';
function rehearsal(){
 let now=1000,auth:unknown=true,authUnavailable=false,feedUnavailable=false;
 const session=new StylingSession({simulation:true,owner,clock:()=>now,policy});
 const diagnostics=new LocalDiagnostics(),clearTemporary=vi.fn(),invalidateExport=vi.fn();
 const lifecycle=new LocalSessionLifecycle(session,owner,{clearTemporary,invalidateExport},diagnostics);
 const rpc=vi.fn(async()=>{if(authUnavailable)throw Error('synthetic-private-error');return auth;});
 const authority=createAuthSessionAuthority({call:rpc});
 const validator=new LocalOutfitValidation(()=>{
  if(feedUnavailable)throw Error('synthetic-private-source');
  const snapshot=session.snapshot(owner)!;
  return {synthetic:true,sessionId,active:snapshot.state==='active',revision:snapshot.revision,
   profileRevision:1,referenceRevision:1,feedbackRevision:1,candidateId:'sample_look',candidateRevision:1,
   pieces:[{id:'sample_shoe',owned:false,sourceId:'sample_source',productId:'sample_product',variantId:'sample_variant',priceCents:5000,checkedAt:1000,
    facts:{availability:{value:'available',checkedAt:1000},size:{value:'verified',checkedAt:1000},delivery:{value:'verified',checkedAt:1000}}}],
   requirements:[],exceptions:[],requiredPieceIds:['sample_shoe'],budget:{cents:10000,currency:'USD',basis:'items'},shippingCents:null,taxCents:null} satisfies ValidationFixture;
 },{clock:()=>now});
 lifecycle.poll();
 const authenticate=async(signal=new AbortController().signal)=>{
  const active=await authority.active(owner,sessionId,signal);
  if(!active){session.end(owner);validator.end();lifecycle.poll();}return active;
 };
 const turn=()=>({session:session.ticket(owner)!,validation:validator.begin()!});
 const complete=(ticket:ReturnType<typeof turn>,outcome:SemanticOutcome)=>session.isCurrent(owner,ticket.session)&&validator.complete(ticket.validation,outcome);
 return {session,validator,lifecycle,diagnostics,clearTemporary,invalidateExport,rpc,authenticate,turn,complete,
  time:(v:number)=>{now=v;},auth:(v:unknown)=>{auth=v;},authOutage:()=>{authUnavailable=true;},feedOutage:()=>{feedUnavailable=true;}};
}
it('test-only valid composition never enables real cards or audio',async()=>{
 const r=rehearsal();expect(await r.authenticate()).toBe(true);expect(r.complete(r.turn(),'pass')).toBe(true);
 expect(r.validator.snapshot()).toMatchObject({simulationEligible:true,releaseEnabled:false,audioEnabled:false});
});
it.each(['unknown','blocked','refused','timeout'] as SemanticOutcome[])('simulated model/validator %s holds both frame types',outcome=>{
 const r=rehearsal(),t=r.turn();expect(r.complete(t,outcome)).toBe(true);expect(r.validator.simulatedVisual(t.validation)).toBe(false);expect(r.validator.simulatedAudioFrame(t.validation)).toBe(false);
});
it('feed outage revokes simulated pass without leaking source error',()=>{
 const r=rehearsal(),t=r.turn();r.complete(t,'pass');r.feedOutage();expect(r.validator.simulatedVisual(t.validation)).toBe(false);expect(r.complete(t,'pass')).toBe(false);
 expect(JSON.stringify(r.validator.snapshot())).not.toContain('synthetic-private');
});
it('media disconnect cancels old tickets and delayed completion',()=>{
 const r=rehearsal(),t=r.turn();r.session.disconnect(owner);r.lifecycle.poll();expect(t.session.signal.aborted).toBe(true);expect(r.complete(t,'pass')).toBe(false);
 expect(r.validator.simulatedAudioFrame(t.validation)).toBe(false);expect(r.diagnostics.snapshot()['session-disconnected']).toBe(1);
});
it('reconnect preserves notes but requires fresh session and validation tickets',()=>{
 const r=rehearsal();r.session.update(owner,{id:'input_1',epoch:1,field:'color',baseRevision:0,sequence:0,value:'Blue',status:'confirmed',origin:'text'});
 const old=r.turn();r.session.disconnect(owner);r.lifecycle.poll();r.time(2000);expect(r.session.reconnect(owner)).toBe(true);r.lifecycle.poll();
 expect(r.session.snapshot(owner)?.notes.color.value).toBe('Blue');expect(r.complete(old,'pass')).toBe(false);expect(r.complete(r.turn(),'pass')).toBe(true);
 expect(r.validator.simulatedVisual(old.validation)).toBe(false);expect(r.diagnostics.snapshot()['session-reconnected']).toBe(1);
});
it('disconnect expiry refuses reconnect, clears temporary data and rejects old results',()=>{
 const r=rehearsal(),t=r.turn();r.session.disconnect(owner);r.lifecycle.poll();r.time(1000+policy.disconnectMs);
 expect(r.session.reconnect(owner)).toBe(false);r.lifecycle.poll();expect(r.complete(t,'pass')).toBe(false);expect(r.clearTemporary).toHaveBeenCalledOnce();expect(r.invalidateExport).toHaveBeenCalledOnce();
 expect(r.diagnostics.snapshot()['session-expired']).toBe(1);
});
it('idle warning and expiry follow approved deadlines without polling extending them',()=>{
 const r=rehearsal(),t=r.turn();r.time(1000+policy.idleMs-policy.warningMs);expect(r.lifecycle.poll()?.warning).toBe(true);r.lifecycle.poll();
 expect(r.diagnostics.snapshot()['session-warning']).toBe(1);r.time(1000+policy.idleMs);expect(r.lifecycle.poll()?.reason).toBe('expired');expect(r.complete(t,'pass')).toBe(false);
});
it.each([false,null,{},'true'])('expired/malformed authority %j cannot retain a pending turn',async result=>{
 const r=rehearsal();expect(await r.authenticate()).toBe(true);const t=r.turn();r.auth(result);expect(await r.authenticate()).toBe(false);
 expect(r.complete(t,'pass')).toBe(false);expect(r.session.snapshot(owner)?.state).toBe('ended');
});
it('authority outage ends composition without retry or private error output',async()=>{
 const r=rehearsal(),t=r.turn();r.authOutage();expect(await r.authenticate()).toBe(false);expect(r.rpc).toHaveBeenCalledOnce();expect(r.complete(t,'pass')).toBe(false);
 expect(JSON.stringify(r.diagnostics.snapshot())).not.toContain('synthetic-private');
});
it('canceled authorization makes no lookup and admits no pending result',async()=>{
 const r=rehearsal(),t=r.turn(),cancel=new AbortController();cancel.abort();expect(await r.authenticate(cancel.signal)).toBe(false);expect(r.rpc).not.toHaveBeenCalled();expect(r.complete(t,'pass')).toBe(false);
});
it('new requirements invalidate a delayed simulated pass',()=>{
 const r=rehearsal(),t=r.turn();r.session.update(owner,{id:'edit_1',epoch:1,field:'budget',baseRevision:0,sequence:0,value:'USD 40 maximum',status:'confirmed',origin:'touch'});
 expect(r.complete(t,'pass')).toBe(false);expect(r.validator.simulatedVisual(t.validation)).toBe(false);
});
it.each(['clear','end'] as const)('%s prevents old results and cleans temporary data once',action=>{
 const r=rehearsal(),t=r.turn();r.session[action](owner);r.lifecycle.poll();r.lifecycle.poll();expect(r.complete(t,'pass')).toBe(false);expect(r.clearTemporary).toHaveBeenCalledOnce();expect(r.invalidateExport).toHaveBeenCalledOnce();
});
it('failed cleanup remains pending without result revival; only failed local port retries',()=>{
 const r=rehearsal(),t=r.turn();r.clearTemporary.mockImplementationOnce(()=>{throw Error('synthetic-private-cleanup');});r.session.end(owner);r.lifecycle.poll();
 expect(r.lifecycle.pending()).toBe(true);expect(r.complete(t,'pass')).toBe(false);r.lifecycle.poll();expect(r.lifecycle.pending()).toBe(false);
 expect(r.clearTemporary).toHaveBeenCalledTimes(2);expect(r.invalidateExport).toHaveBeenCalledOnce();expect(r.diagnostics.snapshot()).toMatchObject({'cleanup-failed':1,'cleanup-complete':1});
});
it('replacement process cannot accept previous local session or validation tickets',()=>{
 const old=rehearsal().turn(),replacement=rehearsal();expect(replacement.complete(old,'pass')).toBe(false);expect(replacement.validator.complete(old.validation,'pass')).toBe(false);
});
it('late semantic completion and backwards clocks cannot authorize old frames',()=>{
 const r=rehearsal(),t=r.turn();r.time(11000);expect(r.complete(t,'pass')).toBe(false);expect(r.validator.snapshot().semantic).toBe('timeout');
 const s=rehearsal(),old=s.turn();s.time(999);expect(s.complete(old,'pass')).toBe(false);expect(s.session.snapshot(owner)?.reason).toBe('expired');
});
it('authorization completion after cancellation cannot revive the pending turn',async()=>{
 const r=rehearsal(),t=r.turn(),cancel=new AbortController();let finish!:(value:unknown)=>void;
 r.rpc.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));const pending=r.authenticate(cancel.signal);
 cancel.abort();finish(true);expect(await pending).toBe(false);expect(r.complete(t,'pass')).toBe(false);expect(r.rpc).toHaveBeenCalledOnce();
});
it('a superseded validation job cannot complete against a newer turn',()=>{
 const r=rehearsal(),old=r.turn(),fresh=r.turn();expect(r.complete(old,'pass')).toBe(false);expect(r.complete(fresh,'pass')).toBe(true);expect(r.validator.simulatedAudioFrame(old.validation)).toBe(false);
});
it('another owner cannot obtain tickets or preserve access through disconnect',()=>{
 const r=rehearsal(),t=r.turn();expect(r.session.ticket('other_owner')).toBeNull();expect(r.session.snapshot('other_owner')).toBeNull();expect(r.session.reconnect('other_owner')).toBe(false);
 r.session.disconnect(owner);expect(r.session.isCurrent('other_owner',t.session)).toBe(false);
});
