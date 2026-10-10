import {NotebookState} from './notebook-state.ts';
import type {CheckTicket,CheckResult} from './notebook-state.ts';

export type LookDraft=Readonly<{id:string;description:string}>;
export type LookPermit=Readonly<{id:number;session:number;revision:number;checkId:number}>;
type Pending={ticket:CheckTicket;draft:LookDraft};
type Released={permit:LookPermit;draft:LookDraft;controller:AbortController;speechStarted:boolean};
/** Synthetic discovery gate. Its checker must independently validate the exact
 * draft. Not a production authority, persistence transaction or Tavus adapter.
 * Every recommendation frame must pass authorizeFrame immediately before enqueue;
 * the transport must honor abort and verify remote cleanup separately.
 */
export class LookRelease {
  private notebook:NotebookState;
  private pending:Pending|null=null;
  private released:Released|null=null;
  private serial=0;
  private closed=false;
  private unsubscribe:()=>void;
  constructor(notebook:NotebookState){
    this.notebook=notebook;
    this.unsubscribe=notebook.subscribe(()=>this.revoke());
  }
  private revoke(){
    const previous=this.released;this.released=null;this.pending=null;
    previous?.controller.abort();
  }
  begin(draft:LookDraft):CheckTicket {
    if(this.closed)throw Error('Look gate is closed.');
    if(!draft||typeof draft.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(draft.id)||typeof draft.description!=='string'||!draft.description.trim()||draft.description.length>2000)throw Error('Invalid look draft.');
    // beginCheck synchronously revokes an older release before storing new work.
    const ticket=this.notebook.beginCheck();
    this.pending={ticket,draft:Object.freeze({...draft})};return ticket;
  }
  complete(ticket:CheckTicket,result:CheckResult):LookPermit|null {
    const pending=this.pending;
    // Identity binds the result to the exact draft captured by begin().
    if(this.closed||!pending||pending.ticket!==ticket)return null;
    this.pending=null;
    if(!this.notebook.completeCheck(ticket,result)||!this.notebook.canPresent())return null;
    const permit=Object.freeze({id:++this.serial,session:ticket.session,revision:ticket.revision,checkId:ticket.id});
    this.released={permit,draft:pending.draft,controller:new AbortController(),speechStarted:false};
    return permit;
  }
  private current(permit:LookPermit){
    const released=this.released,snapshot=this.notebook.snapshot();
    if(this.closed||!released||released.permit!==permit||released.controller.signal.aborted||!this.notebook.canPresent()
      ||snapshot.session!==permit.session||snapshot.revision!==permit.revision||snapshot.gate?.ticket.id!==permit.checkId)return null;
    return released;
  }
  visual(permit:LookPermit):LookDraft|null{return this.current(permit)?.draft??null;}
  startSpeech(permit:LookPermit,start:(draft:LookDraft,signal:AbortSignal,authorizeFrame:()=>boolean)=>void):boolean {
    const released=this.current(permit);if(!released||released.speechStarted)return false;
    released.speechStarted=true;
    try{start(released.draft,released.controller.signal,()=>Boolean(this.current(permit)));}
    catch{this.revoke();return false;}
    return Boolean(this.current(permit));
  }
  end(){this.revoke();}
  dispose(){if(this.closed)return;this.closed=true;this.revoke();this.unsubscribe();}
}
