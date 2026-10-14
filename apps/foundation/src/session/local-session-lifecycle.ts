import type {StylingSession,SessionSnapshot} from './styling-session.ts';
import {LocalDiagnostics} from '../diagnostics/local-diagnostics.ts';
/** Local sample cleanup coordination. Call poll on ticks and session changes.
 * Cleanup ports must be idempotent. Failed ports retry on the next local poll;
 * success is recorded only when both ports finish. No provider cleanup claim. */
export class LocalSessionLifecycle {
 private previous:SessionSnapshot|null=null;
 private pendingTemporary=false;
 private pendingExport=false;
 private cleaning=false;
 private readonly session:StylingSession;
 private readonly owner:string;
 private readonly ports:{clearTemporary:()=>void;invalidateExport:()=>void};
 private readonly diagnostics:LocalDiagnostics;
 constructor(session:StylingSession,owner:string,ports:{clearTemporary:()=>void;invalidateExport:()=>void},diagnostics:LocalDiagnostics){this.session=session;this.owner=owner;this.ports=ports;this.diagnostics=diagnostics;}
 poll(){
  const next=this.session.snapshot(this.owner);if(!next)return null;
  const previous=this.previous;this.previous=next;
  if(next.warning&&!previous?.warning)this.diagnostics.record('session-warning');
  if(next.state==='disconnected'&&previous?.state!=='disconnected')this.diagnostics.record('session-disconnected');
  if(next.state==='active'&&previous?.state==='disconnected')this.diagnostics.record('session-reconnected');
  const finished=next.state==='ended'&&previous?.state!=='ended';
  const cleared=next.state==='active'&&previous?.state==='active'&&next.epoch!==previous.epoch;
  if(finished||cleared){this.pendingTemporary=true;this.pendingExport=true;this.diagnostics.record(cleared?'session-cleared':next.reason==='expired'?'session-expired':'session-ended');}
  if(!this.cleaning&&(this.pendingTemporary||this.pendingExport)){
   this.cleaning=true;let failed=false;
   try{
    if(this.pendingExport)try{this.ports.invalidateExport();this.pendingExport=false;}catch{failed=true;}
    if(this.pendingTemporary)try{this.ports.clearTemporary();this.pendingTemporary=false;}catch{failed=true;}
    if(failed)this.diagnostics.record('cleanup-failed');
    if(!this.pendingTemporary&&!this.pendingExport)this.diagnostics.record('cleanup-complete');
   }finally{this.cleaning=false;}
  }
  return next;
 }
 pending(){return this.pendingTemporary||this.pendingExport;}
}
