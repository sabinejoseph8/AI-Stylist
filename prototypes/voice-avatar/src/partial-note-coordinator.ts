import {FIELDS,NotebookState} from './notebook-state.ts';
import type {Field} from './notebook-state.ts';
import {NoteTiming} from './note-timing.ts';

type Transcript = {version:1;eventId:string;turnId:string;sequence:number;role:'user'|'assistant';text:string;final:boolean};
export type NotePatch = {field:Field;value:string;evidence:string;confirmed:boolean};
export type ExtractionInput = Readonly<{turnId:string;text:string;context?:string}>;
type Turn = {id:string;sequence:number;text:string;appliedText:string;final:boolean;expected:Record<Field,number>;inputAt:number;owned:Partial<Record<Field,number>>;settled:boolean};
type Job = {id:number;turn:Turn;text:string;fullText:string;controller:AbortController;sample:number;timer:ReturnType<typeof setTimeout>};
const fields=new Set<string>(FIELDS.map(([id])=>id));
const exact=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
const object=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const identity=(value:unknown):value is string=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);
function transcript(value:unknown):Transcript|null {
  if(!object(value)||!exact(value,['version','eventId','turnId','sequence','role','text','final'])||value.version!==1
    ||!identity(value.eventId)||!identity(value.turnId)||!Number.isSafeInteger(value.sequence)||(value.sequence as number)<0
    ||!['user','assistant'].includes(value.role as string)||typeof value.text!=='string'||!value.text.trim()||value.text.length>4000||typeof value.final!=='boolean')return null;
  return value as Transcript;
}
function patches(value:unknown,text:string):NotePatch[]|null {
  if(!Array.isArray(value)||value.length>7)return null;
  const seen=new Set<string>();
  for(const item of value){
    if(!object(item)||!exact(item,['field','value','evidence','confirmed'])||typeof item.field!=='string'||!fields.has(item.field)||seen.has(item.field)
      ||typeof item.value!=='string'||!item.value.trim()||item.value.length>160||typeof item.evidence!=='string'||!item.evidence.trim()||item.evidence.length>160
      ||!text.includes(item.evidence)||typeof item.confirmed!=='boolean')return null;
    seen.add(item.field);
  }
  return value as NotePatch[];
}

/** Vendor-independent preparation. Requires an injected extractor; no provider
 * connection or persistence is implemented. Real extraction results stay tentative.
 * Only the explicitly synthetic UI fixture may confirm its known sample clauses.
 */
export class PartialNoteCoordinator {
  private notebook:NotebookState;
  private extract:(input:ExtractionInput,signal:AbortSignal)=>Promise<unknown>;
  private settled:(turnId:string)=>void;
  private changed:(receipt:number|null)=>void;
  private invalidated:()=>void;
  private clock:()=>number;
  private nextSequence:()=>number;
  private syntheticFixture:boolean;
  private session:number;
  private turn:Turn|null=null;
  private seen=new Set<string>();
  private retired=new Set<string>();
  private debounce:ReturnType<typeof setTimeout>|undefined;
  private job:Job|null=null;
  private waitingAt:number|null=null;
  private nextJob=0;
  private extractionCount=0;
  private captureSequence=0;
  private pendingRenders=new Map<number,{session:number;revision:number}>();
  private unsubscribe:()=>void;
  private counters={accepted:0,rejected:0,applied:0,failures:0};
  readonly timing:NoteTiming;
  constructor(options:{notebook:NotebookState;extract:(input:ExtractionInput,signal:AbortSignal)=>Promise<unknown>;changed:(receipt:number|null)=>void;invalidated?:()=>void;settled?:(turnId:string)=>void;clock?:()=>number;nextSequence?:()=>number;syntheticFixture?:boolean}){
    this.settled=options.settled??(()=>{});this.invalidated=options.invalidated??(()=>{});this.notebook=options.notebook;this.extract=options.extract;this.changed=options.changed;this.clock=options.clock??(()=>performance.now());
    this.nextSequence=options.nextSequence??(()=>++this.captureSequence);this.syntheticFixture=options.syntheticFixture===true;
    this.session=this.notebook.snapshot().session;this.timing=new NoteTiming(this.clock);
    this.unsubscribe=this.watchRevisions();
  }
  private watchRevisions(){
    return this.notebook.subscribe(()=>{
      const current=this.notebook.snapshot();
      for(const [id,expected] of this.pendingRenders){
        if(expected.session!==current.session||expected.revision!==current.revision){
          this.pendingRenders.delete(id);this.timing.finish(id,'canceled');
        }
      }
    });
  }
  private cancelJob(){
    if(this.job){clearTimeout(this.job.timer);this.timing.finish(this.job.sample,'canceled');this.job.controller.abort();this.job=null;}
  }
  accept(value:unknown):boolean{
    const event=transcript(value),snapshot=this.notebook.snapshot();
    if(!event||event.role!=='user'||snapshot.session!==this.session||this.seen.has(event.eventId)||this.seen.size>=256
      ||this.retired.has(event.turnId)||this.retired.size>=32||this.extractionCount>=64){this.counters.rejected++;return false;}
    if(this.turn?.id===event.turnId&&(this.turn.final||event.sequence<=this.turn.sequence)){this.counters.rejected++;return false;}
    if(this.turn?.id!==event.turnId){
      this.cancelJob();clearTimeout(this.debounce);this.debounce=undefined;this.waitingAt=null;
      if(this.turn)this.retired.add(this.turn.id);
      this.turn={id:event.turnId,sequence:-1,text:'',appliedText:'',owned:{},settled:false,final:false,inputAt:this.clock(),expected:Object.fromEntries(FIELDS.map(([id])=>[id,snapshot.notes[id].revision])) as Record<Field,number>};
    }
    if(this.job&&!event.text.startsWith(this.job.fullText))this.cancelJob();clearTimeout(this.debounce);
    // A recognizer rewrite can remove evidence already displayed from this turn.
    // Retract only our exact revisions; never undo a touch edit or confirmation.
    if(this.turn.appliedText&&!event.text.startsWith(this.turn.appliedText)){
      const rewritten=this.turn;let retracted=false;
      for(const [field,revision] of Object.entries(rewritten.owned) as [Field,number][]){
        if(this.notebook.retractSpeech(this.session,field,revision)){
          rewritten.expected[field]=this.notebook.snapshot().notes[field].revision;retracted=true;
        }
      }
      rewritten.owned={};rewritten.appliedText='';
      this.pendingRenders.forEach((_v,id)=>this.timing.finish(id,'canceled'));this.pendingRenders.clear();
      if(retracted){try{this.invalidated();}catch{this.changed(null);return false;}}
    }
    if(!this.turn||this.notebook.snapshot().session!==this.session)return false;
    this.turn.sequence=event.sequence;this.turn.text=event.text;this.turn.final=event.final;this.turn.inputAt=this.clock();
    this.seen.add(event.eventId);this.counters.accepted++;
    this.schedule();return true;
  }
  private schedule(){
    if(this.waitingAt===null)this.waitingAt=this.clock();
    clearTimeout(this.debounce);
    const delay=Math.min(100,Math.max(0,400-(this.clock()-this.waitingAt)));
    this.debounce=setTimeout(()=>{this.debounce=undefined;void this.flush();},delay);
  }
  private async flush(){
    if(this.job)return;
    const turn=this.turn;if(!turn||this.notebook.snapshot().session!==this.session)return;
    const fullText=turn.text,text=fullText.startsWith(turn.appliedText)?fullText.slice(turn.appliedText.length).trim():fullText;
    if(!text){this.waitingAt=null;this.settle(turn);return;}
    if(this.extractionCount>=64){this.waitingAt=null;this.counters.failures++;return;}
    const sample=this.timing.begin(this.waitingAt??this.clock());this.waitingAt=null;if(sample===null){this.counters.failures++;return;}
    const controller=new AbortController(),id=++this.nextJob;
    const job:Job={id,turn,text,fullText,controller,sample,timer:setTimeout(()=>{
      if(this.job?.id!==id)return;this.counters.failures++;this.timing.finish(sample,'failed');controller.abort();this.job=null;this.changed(null);if(this.waitingAt!==null)this.schedule();
    },1500)};
    this.job=job;this.extractionCount++;
    const current=()=>this.job?.id===id&&!controller.signal.aborted&&this.turn===turn&&this.notebook.snapshot().session===this.session;
    try{
      const result=await this.extract(Object.freeze({turnId:turn.id,text,context:fullText.startsWith(turn.appliedText)?turn.appliedText.slice(-1000):''}),controller.signal);
      if(!current())return;
      const parsed=patches(result,text);
      if(!parsed||!this.timing.extracted(sample)){this.counters.failures++;this.timing.finish(sample,'failed');this.changed(null);return;}
      let applied=0;
      for(const patch of parsed){
        const expected=turn.expected[patch.field];
        if(this.notebook.snapshot().notes[patch.field].revision!==expected)continue;
        if(this.notebook.capture({session:this.session,field:patch.field,baseRevision:expected,sequence:this.nextSequence(),value:patch.value,confirmed:this.syntheticFixture&&patch.confirmed})){
          turn.expected[patch.field]=this.notebook.snapshot().notes[patch.field].revision;turn.owned[patch.field]=turn.expected[patch.field];applied++;
        }
      }
      turn.appliedText=fullText;this.counters.applied+=applied;
      if(applied){this.pendingRenders.set(sample,{session:this.session,revision:this.notebook.snapshot().revision});this.changed(sample);}
      else this.timing.finish(sample,'canceled');
    }catch{
      if(current()){this.counters.failures++;this.timing.finish(sample,'failed');this.changed(null);}
    }finally{
      clearTimeout(job.timer);if(this.job?.id===id){this.job=null;if(this.waitingAt!==null)this.schedule();else this.settle(turn);}
    }
  }
  private settle(turn:Turn){
    if(this.turn!==turn||!turn.final||turn.settled||turn.appliedText!==turn.text||this.job||this.waitingAt!==null||this.notebook.snapshot().session!==this.session)return;
    turn.settled=true;try{this.settled(turn.id);}catch{this.changed(null);}
  }
  acknowledgeRendered(receipt:number):boolean{
    const expected=this.pendingRenders.get(receipt);this.pendingRenders.delete(receipt);
    const current=this.notebook.snapshot();
    if(!expected||expected.session!==current.session||expected.revision!==current.revision){this.timing.finish(receipt,'canceled');return false;}
    return this.timing.rendered(receipt);
  }
  cancel(){
    this.unsubscribe();
    clearTimeout(this.debounce);this.debounce=undefined;this.waitingAt=null;this.cancelJob();
    if(this.turn)this.retired.add(this.turn.id);this.turn=null;
    this.pendingRenders.forEach((_v,id)=>this.timing.finish(id,'canceled'));this.pendingRenders.clear();
  }
  reset(){this.cancel();this.session=this.notebook.snapshot().session;this.seen.clear();this.retired.clear();this.extractionCount=0;this.counters={accepted:0,rejected:0,applied:0,failures:0};this.timing.clear();this.unsubscribe=this.watchRevisions();}
  snapshot(){return {...this.counters,extracting:Boolean(this.job),queued:Boolean(this.debounce),timing:this.timing.report()};}
}
