import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';

const PURPOSE='notes-only-simulation' as const;
type Run={id:string;closed:boolean};
export type PreparedNoteLedger={version:1;purpose:typeof PURPOSE;approval:{id:string;attempts:number;centsPerAttempt:number;secondsPerAttempt:number};runs:Run[]};
export type PreparedNotePersistence={read:()=>Promise<unknown>;compareAndSwap:(expected:PreparedNoteLedger,replacement:PreparedNoteLedger)=>Promise<boolean>};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const validId=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
const positive=(v:unknown,max:number)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0&&v<=max;
function validate(value:unknown):PreparedNoteLedger{
 if(!object(value)||!exact(value,['version','purpose','approval','runs'])||value.version!==1||value.purpose!==PURPOSE)throw Error();
 const a=value.approval,r=value.runs;
 if(!object(a)||!exact(a,['id','attempts','centsPerAttempt','secondsPerAttempt'])||!validId(a.id)||!positive(a.attempts,16)||!positive(a.centsPerAttempt,100_000)||!positive(a.secondsPerAttempt,85)||!Array.isArray(r)||r.length>(a.attempts as number))throw Error();
 if(r.some(v=>!object(v)||!exact(v,['id','closed'])||!validId(v.id)||typeof v.closed!=='boolean')||new Set(r.map(v=>v.id)).size!==r.length||r.filter(v=>!v.closed).length>1)throw Error();
 return structuredClone(value) as PreparedNoteLedger;
}
/** Validates a detached snapshot without exposing stored data in errors. */
export function validatePreparedNoteLedger(value:unknown):PreparedNoteLedger{
 try{return validate(value);}catch{throw Error('Notebook allowance requires review.');}
}
/** Shared preparation contract for a future locked database transition.
 * Accepts exactly one append or one closure; returns a detached validated copy.
 * This does not authorize a new approval or implement database locking. */
export function validatePreparedNoteTransition(previous:unknown,replacement:unknown):PreparedNoteLedger{
 try{
  const before=validate(previous),after=validate(replacement);
  if(!isDeepStrictEqual(before.approval,after.approval))throw Error();
  if(after.runs.length===before.runs.length+1){
   if(before.runs.some(r=>!r.closed)||after.runs.at(-1)!.closed||!isDeepStrictEqual(before.runs,after.runs.slice(0,-1)))throw Error();
  }else if(after.runs.length===before.runs.length){
   let closures=0;
   for(let i=0;i<before.runs.length;i++){
    const a=before.runs[i]!,b=after.runs[i]!;
    if(isDeepStrictEqual(a,b))continue;
    if(a.id!==b.id||a.closed||!b.closed)throw Error();closures++;
   }
   if(closures!==1)throw Error();
  }else throw Error();
  return after;
 }catch{throw Error('Notebook allowance transition requires review.');}
}
/** Explicit simulated persistence only. No key, URL, RPC, initializer, amendment or
 * retry exists. Fixture approval is not human authorization to spend. A future
 * live adapter must use a separately reviewed store and authorized allowance. */
export class PreparedNoteAllowance{
 readonly purpose=PURPOSE;
 private held=false;
 private persistence:PreparedNotePersistence;
 constructor(options:{simulation?:boolean;persistence:PreparedNotePersistence}){
  if(options.simulation!==true)throw Error('Live notebook allowance is disabled.');
  this.persistence=options.persistence;
 }
 private async change(update:(ledger:PreparedNoteLedger)=>void){
  if(this.held)throw Error('Notebook allowance requires review.');
  try{
   const previous=validate(await this.persistence.read()),next=structuredClone(previous);
   update(next);validatePreparedNoteTransition(previous,next);
   if(await this.persistence.compareAndSwap(previous,next)!==true)throw Error();
  }catch{this.held=true;throw Error('Notebook allowance requires review.');}
 }
 async reserve():Promise<string>{
  const id=randomUUID();
  await this.change(ledger=>{if(ledger.runs.some(r=>!r.closed)||ledger.runs.length>=ledger.approval.attempts)throw Error();ledger.runs.push({id,closed:false});});
  return id;
 }
 async closeVerified(id:string):Promise<void>{
  await this.change(ledger=>{const run=ledger.runs.find(r=>r.id===id);if(!run||run.closed)throw Error();run.closed=true;});
 }
 status(){return{held:this.held,liveEnabled:false as const};}
}
