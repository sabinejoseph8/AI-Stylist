/** Disconnected experiment. No route, provider, persistence or media transport. */
export const CVI_FIELDS = ['occasion','timing','color','coverage','budget','lookType','wardrobe'] as const;
export type CviField = typeof CVI_FIELDS[number];
export type CviNotes = Readonly<Record<CviField, Readonly<{text:string;confirmed:boolean}>>>;
export type CviSnapshot = Readonly<{revision:number;notes:CviNotes}>;
export type CviCheck = Readonly<{approved:boolean;revision:number;text:string}>;
export interface CviSimulationPorts {
  draft(snapshot:CviSnapshot, signal:AbortSignal):Promise<string>;
  check(text:string, snapshot:CviSnapshot, signal:AbortSignal):Promise<CviCheck>;
}
export type CviPrepared = Readonly<{status:'prepared'|'blocked';takeSse():string|null}>;
const empty = ():CviNotes=>Object.freeze(Object.fromEntries(CVI_FIELDS.map(k=>[k,Object.freeze({text:'',confirmed:false})])) as Record<CviField,{text:string;confirmed:boolean}>);
const textOk=(x:unknown):x is string=>typeof x==='string'&&x.trim().length>0&&x.length<=4000;

/** Normalized inputs are trusted server/test commands, never raw Tavus messages. */
export function createLocalCviStyling(ports:CviSimulationPorts, deadlineMs=1000){
  if(!Number.isInteger(deadlineMs)||deadlineMs<1||deadlineMs>8000)throw Error('Invalid local deadline');
  let notes=empty(),revision=0,epoch=0,closed=false,lastSeq=-1;
  const seen=new Set<string>();
  let pending:AbortController|undefined;
  const invalidate=()=>{epoch++;pending?.abort();pending=undefined;};
  const snapshot=():CviSnapshot=>Object.freeze({revision,notes});
  const blocked=():CviPrepared=>Object.freeze({status:'blocked',takeSse:()=>null});
  return Object.freeze({
    snapshot,
    /** Real transcript extraction/confirmation authority is deliberately not wired. */
    note(input:{id:string;seq:number;field:CviField;text:string;confirmed:boolean}):boolean{
      if(closed||!input||typeof input.id!=='string'||!/^fixture-[a-z0-9-]{1,60}$/.test(input.id)||
         !Number.isSafeInteger(input.seq)||input.seq<0||input.seq<=lastSeq||seen.has(input.id)||seen.size>=128||
         !CVI_FIELDS.includes(input.field)||!textOk(input.text)||typeof input.confirmed!=='boolean')return false;
      invalidate();seen.add(input.id);lastSeq=input.seq;revision++;
      notes=Object.freeze({...notes,[input.field]:Object.freeze({text:input.text,confirmed:input.confirmed})});
      return true;
    },
    interrupt(){if(!closed)invalidate();},
    end(){invalidate();closed=true;notes=empty();revision++;seen.clear();},
    async prepare(signal?:AbortSignal):Promise<CviPrepared>{
      if(closed||signal?.aborted)return blocked();
      invalidate();const mine=epoch, snap=snapshot(), controller=new AbortController();pending=controller;
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
        const text=await Promise.race([Promise.resolve().then(()=>ports.draft(snap,controller.signal)),canceled]);
        if(!textOk(text)||controller.signal.aborted||epoch!==mine||closed)return blocked();
        const verdict=await Promise.race([Promise.resolve().then(()=>ports.check(text,snap,controller.signal)),canceled]);
        if(!verdict||Object.keys(verdict).sort().join(',')!=='approved,revision,text'||verdict.approved!==true||
          verdict.revision!==snap.revision||verdict.text!==text||controller.signal.aborted||epoch!==mine||closed)return blocked();
        let consumed=false;
        return Object.freeze({status:'prepared',takeSse(){
          if(consumed||closed||epoch!==mine||signal?.aborted)return null;
          consumed=true;
          // Single buffered chunk; JSON encoding prevents SSE newline injection.
          const chunk={id:'local-cvi-fixture',object:'chat.completion.chunk',created:0,model:'local-simulation',
            choices:[{index:0,delta:{role:'assistant',content:text},finish_reason:null}]};
          const stop={...chunk,choices:[{index:0,delta:{},finish_reason:'stop'}]};
          return `data: ${JSON.stringify(chunk)}\n\ndata: ${JSON.stringify(stop)}\n\ndata: [DONE]\n\n`;
        }});
      }catch{return blocked();}
      finally{if(timer)clearTimeout(timer);signal?.removeEventListener('abort',onAbort);if(pending===controller)pending=undefined;}
    },
  });
}
