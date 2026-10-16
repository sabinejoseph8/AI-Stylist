/** Disconnected experiment. No route, provider, persistence or media transport. */
export const CVI_FIELDS = ['occasion','timing','color','coverage','budget','lookType','wardrobe'] as const;
export type CviField = typeof CVI_FIELDS[number];
export type CviNotes = Readonly<Record<CviField, Readonly<{text:string;confirmed:boolean}>>>;
export type CviSnapshot = Readonly<{revision:number;notes:CviNotes;context?:Readonly<{epoch:number;nativeRevision:number;inputRevision:number}>}>;
export interface CviContextPort {snapshot():CviSnapshot|null;subscribe(change:()=>void):()=>void;end():void;ready?():boolean}
export type CviConversationInput=Readonly<{kind:'untrusted-conversation';epoch:number;inputRevision:number;messages:readonly Readonly<{speaker:'customer'|'stylist'|'provider-context';text:string}>[]}>;
export type CviCheck = Readonly<{approved:boolean;revision:number;text:string}>;
export interface CviSimulationPorts {
  draft(snapshot:CviSnapshot, signal:AbortSignal,conversation?:CviConversationInput):Promise<string>;
  check(text:string, snapshot:CviSnapshot, signal:AbortSignal,conversation?:CviConversationInput):Promise<CviCheck>;
}
export type CviPrepared = Readonly<{status:'prepared'|'blocked';reason?:'context-changed'|'context-pending';takeSse():string|null}>;
const empty = ():CviNotes=>Object.freeze(Object.fromEntries(CVI_FIELDS.map(k=>[k,Object.freeze({text:'',confirmed:false})])) as Record<CviField,{text:string;confirmed:boolean}>);
const textOk=(x:unknown):x is string=>typeof x==='string'&&x.trim().length>0&&x.length<=4000;

/** Normalized inputs are trusted server/test commands, never raw Tavus messages. */
export function createLocalCviStyling(ports:CviSimulationPorts, deadlineMs=1000,context?:CviContextPort){
  if(!Number.isInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Invalid local deadline');
  if(context&&(typeof context.snapshot!=='function'||typeof context.subscribe!=='function'||typeof context.end!=='function'||context.ready!==undefined&&typeof context.ready!=='function'))throw Error('Invalid local context');
  const read=context?.snapshot.bind(context),subscribe=context?.subscribe.bind(context),endContext=context?.end.bind(context),isReady=context?.ready?.bind(context);let unsubscribe:(()=>void)|undefined;
  let notes=empty(),revision=0,epoch=0,closed=false,lastSeq=-1;
  const seen=new Set<string>();
  let pending:AbortController|undefined;
  const invalidate=()=>{epoch++;pending?.abort();pending=undefined;};
  const snapshot=():CviSnapshot=>{
   if(closed||!read)return Object.freeze({revision,notes});
   const raw=structuredClone(read());if(!raw||Object.keys(raw).sort().join(',')!=='context,notes,revision'||!Number.isSafeInteger(raw.revision)||raw.revision<0||!raw.context||Object.keys(raw.context).sort().join(',')!=='epoch,inputRevision,nativeRevision'||!Number.isSafeInteger(raw.context.epoch)||raw.context.epoch<1||!Number.isSafeInteger(raw.context.nativeRevision)||raw.context.nativeRevision<0||!Number.isSafeInteger(raw.context.inputRevision)||raw.context.inputRevision<0||!raw.notes||Object.keys(raw.notes).sort().join(',')!==[...CVI_FIELDS].sort().join(','))throw Error('Context unavailable');
   for(const field of CVI_FIELDS){const n=raw.notes[field];if(!n||Object.keys(n).sort().join(',')!=='confirmed,text'||typeof n.text!=='string'||n.text.length>4000||typeof n.confirmed!=='boolean'||(!n.text.trim()&&n.confirmed))throw Error('Context unavailable');}
   return Object.freeze({revision:raw.revision,context:Object.freeze({...raw.context}),notes:Object.freeze(Object.fromEntries(CVI_FIELDS.map(k=>[k,Object.freeze({...raw.notes[k]})])) as Record<CviField,{text:string;confirmed:boolean}>)});
  };
  const same=(a:CviSnapshot,b:CviSnapshot)=>a.revision===b.revision&&a.context?.epoch===b.context?.epoch&&a.context?.nativeRevision===b.context?.nativeRevision&&a.context?.inputRevision===b.context?.inputRevision&&CVI_FIELDS.every(k=>a.notes[k].text===b.notes[k].text&&a.notes[k].confirmed===b.notes[k].confirmed);
  const changed=(snap:CviSnapshot,signal?:AbortSignal)=>{try{return !!read&&!closed&&!signal?.aborted&&!same(snap,snapshot());}catch{return false;}};
  const stale=():CviPrepared=>Object.freeze({status:'blocked',reason:'context-changed',takeSse:()=>null});
  if(read)snapshot();if(subscribe){unsubscribe=subscribe(invalidate);if(typeof unsubscribe!=='function')throw Error('Context unavailable');}
  const blocked=():CviPrepared=>Object.freeze({status:'blocked',takeSse:()=>null});
  const readiness=()=>{if(closed)return 'unavailable';try{const state=isReady?isReady():true;return state===true?'ready':state===false?'pending':'unavailable';}catch{return 'unavailable';}};
  const available=()=>readiness()==='ready';
  return Object.freeze({
    snapshot,available,isOpen:()=>!closed,
    /** Real transcript extraction/confirmation authority is deliberately not wired. */
    note(input:{id:string;seq:number;field:CviField;text:string;confirmed:boolean}):boolean{
      if(read||closed||!input||typeof input.id!=='string'||!/^fixture-[a-z0-9-]{1,60}$/.test(input.id)||
         !Number.isSafeInteger(input.seq)||input.seq<0||input.seq<=lastSeq||seen.has(input.id)||seen.size>=128||
         !CVI_FIELDS.includes(input.field)||!textOk(input.text)||typeof input.confirmed!=='boolean')return false;
      invalidate();seen.add(input.id);lastSeq=input.seq;revision++;
      notes=Object.freeze({...notes,[input.field]:Object.freeze({text:input.text,confirmed:input.confirmed})});
      return true;
    },
    interrupt(){if(!closed)invalidate();},
    end(){invalidate();closed=true;notes=empty();revision++;seen.clear();unsubscribe?.();unsubscribe=undefined;try{endContext?.();}catch{/* Closed locally; no remote deletion claim. */}},
    async prepare(signal?:AbortSignal,conversation?:CviConversationInput):Promise<CviPrepared>{
      if(closed||signal?.aborted)return blocked();
      let input:CviConversationInput|undefined;
      if(conversation!==undefined){try{
       const c=structuredClone(conversation);
       if(!read||!c||Object.keys(c).sort().join(',')!=='epoch,inputRevision,kind,messages'||c.kind!=='untrusted-conversation'||!Number.isSafeInteger(c.epoch)||c.epoch<1||!Number.isSafeInteger(c.inputRevision)||c.inputRevision<1||!Array.isArray(c.messages)||!c.messages.length||c.messages.length>32||c.messages.at(-1)?.speaker!=='customer'||!c.messages.at(-1)?.text.trim()||c.messages.some(m=>!m||Object.keys(m).sort().join(',')!=='speaker,text'||!['customer','stylist','provider-context'].includes(m.speaker)||typeof m.text!=='string'||m.text.length>4000)||new TextEncoder().encode(JSON.stringify(c)).length>65536)return blocked();
       input=Object.freeze({...c,messages:Object.freeze(c.messages.map(m=>Object.freeze({...m})))});
      }catch{return blocked();}}
      const state=readiness();if(state==='unavailable')return blocked();
      if(state==='pending')return Object.freeze({status:'blocked',reason:'context-pending',takeSse:()=>null});
      invalidate();let snap:CviSnapshot;try{snap=snapshot();}catch{return blocked();}if(input&&(input.epoch!==snap.context?.epoch||input.inputRevision!==snap.context?.inputRevision))return stale();const mine=epoch,controller=new AbortController();pending=controller;
      let timer:ReturnType<typeof setTimeout>|undefined;
      let onAbort:()=>void=()=>{};
      const canceled=new Promise<never>((_,reject)=>{
        onAbort=()=>{controller.abort();reject(Error('Stopped'));};
        controller.signal.addEventListener('abort',()=>reject(Error('Stopped')),{once:true});
        signal?.addEventListener('abort',onAbort,{once:true});
        timer=setTimeout(onAbort,deadlineMs);
      });
      try{
        // Nothing streams until the full text and exact snapshot pass a separate check.
        const text=await Promise.race([Promise.resolve().then(()=>(input?ports.draft(snap,controller.signal,input):ports.draft(snap,controller.signal))),canceled]);
        if(!textOk(text)||controller.signal.aborted||epoch!==mine||closed)return changed(snap,signal)?stale():blocked();
        const verdict=await Promise.race([Promise.resolve().then(()=>(input?ports.check(text,snap,controller.signal,input):ports.check(text,snap,controller.signal))),canceled]);
        if(!verdict||Object.keys(verdict).sort().join(',')!=='approved,revision,text'||verdict.approved!==true||
          verdict.revision!==snap.revision||verdict.text!==text||controller.signal.aborted||epoch!==mine||closed)return changed(snap,signal)?stale():blocked();
        let consumed=false;
        return Object.freeze({status:'prepared',takeSse(){
          if(consumed||closed||epoch!==mine||signal?.aborted)return null;try{if(!same(snap,snapshot()))return null;}catch{return null;}
          consumed=true;
          // Single buffered chunk; JSON encoding prevents SSE newline injection.
          const chunk={id:'local-cvi-fixture',object:'chat.completion.chunk',created:0,model:'local-simulation',
            choices:[{index:0,delta:{role:'assistant',content:text},finish_reason:null}]};
          const stop={...chunk,choices:[{index:0,delta:{},finish_reason:'stop'}]};
          return `data: ${JSON.stringify(chunk)}\n\ndata: ${JSON.stringify(stop)}\n\ndata: [DONE]\n\n`;
        }});
      }catch{return changed(snap,signal)?stale():blocked();}
      finally{if(timer)clearTimeout(timer);signal?.removeEventListener('abort',onAbort);if(pending===controller)pending=undefined;}
    },
  });
}
