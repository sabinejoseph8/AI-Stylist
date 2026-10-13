import {buildOpenAINoteRequest} from './openai-note-extractor.ts';
import {prepareNoteDispatchBudget} from './note-dispatch-budget.ts';
import type {ExtractionInput} from './partial-note-coordinator.ts';
/** Disabled composition. The injected server counter must count the entire exact
 * request for its pinned model, including instructions and structured schema.
 * Identical serialized bytes go to counting and dispatch; neither receives a
 * mutable request object. No default counter, fetch, credentials or live route. */
export function prepareBudgetedNoteDispatch(options:{simulation?:boolean;
 count:(request:string,signal:AbortSignal)=>Promise<number>;
 dispatch:(request:string,signal:AbortSignal)=>Promise<unknown>}){
 if(options.simulation!==true)throw Error('Live budgeted extraction is disabled.');
 const budget=prepareNoteDispatchBudget({simulation:true});
 const active=new Set<AbortController>();let ended=false,countRequests=0;
 const stop=()=>{ended=true;budget.hold();for(const controller of active)controller.abort();};
 return Object.freeze({
  async request(input:ExtractionInput,signal:AbortSignal):Promise<unknown>{
   if(ended||signal.aborted)throw Error('Budgeted extraction unavailable.');
   if(countRequests>=64){stop();throw Error('Budgeted extraction unavailable.');}
   countRequests++;
   const controller=new AbortController();active.add(controller);
   let rejectStop!:(error:Error)=>void;
   const stopped=new Promise<never>((_,reject)=>{rejectStop=reject;});
   void stopped.catch(()=>{});
   const abort=()=>rejectStop(Error('Budgeted extraction unavailable.'));
   const cancel=()=>controller.abort();
   controller.signal.addEventListener('abort',abort,{once:true});
   signal.addEventListener('abort',cancel,{once:true});
   const deadline=setTimeout(stop,5000);
   try{
    if(signal.aborted){controller.abort();throw Error();}
    const body=buildOpenAINoteRequest(input),serialized=JSON.stringify(body);
    const count=await Promise.race([options.count(serialized,controller.signal),stopped]);
    if(ended||controller.signal.aborted)throw Error();
    // Synchronous reservation after counting makes overlapping completions atomic.
    budget.reserve(count,body.max_output_tokens);
    const result=await Promise.race([options.dispatch(serialized,controller.signal),stopped]);
    if(ended||controller.signal.aborted)throw Error();
    return result;
   }catch{if(!controller.signal.aborted)stop();throw Error('Budgeted extraction unavailable.');}
   finally{clearTimeout(deadline);signal.removeEventListener('abort',cancel);controller.signal.removeEventListener('abort',abort);active.delete(controller);}
  },
  end:stop,
  snapshot:()=>Object.freeze({...budget.snapshot(),countRequests})
 });
}
