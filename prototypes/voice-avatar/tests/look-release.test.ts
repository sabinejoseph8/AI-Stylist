import {describe,it,expect,vi} from 'vitest';
import {NotebookState} from '../src/notebook-state.ts';
import {LookRelease} from '../src/look-release.ts';
const draft={id:'sample',description:'Synthetic emerald dress with neutral shoes.'};
const pass={outcome:'passed' as const,reason:'Independent fixture check passed'};
function setup(){const notebook=new NotebookState(),release=new LookRelease(notebook);return{notebook,release};}
function approved(){const s=setup(),ticket=s.release.begin(draft),permit=s.release.complete(ticket,pass)!;return{...s,ticket,permit};}
describe('shared synthetic look display and speech gate',()=>{
 it('holds display and speech until a check passes',()=>{const s=setup(),ticket=s.release.begin(draft),fake={id:1,session:1,revision:0,checkId:ticket.id},start=vi.fn();expect(s.release.visual(fake)).toBeNull();expect(s.release.startSpeech(fake,start)).toBe(false);expect(start).not.toHaveBeenCalled();});
 it.each(['blocked','unknown','malformed'])('holds %s validation',outcome=>{const s=setup(),ticket=s.release.begin(draft);expect(s.release.complete(ticket,{outcome:outcome as 'blocked',reason:'Held'})).toBeNull();});
 it('holds empty pass reasons and rejects copied tickets',()=>{const s=setup(),ticket=s.release.begin(draft);expect(s.release.complete({...ticket},pass)).toBeNull();expect(s.release.complete(ticket,{outcome:'passed',reason:''})).toBeNull();});
 it('releases the same immutable draft for display and speech only once',()=>{const s=setup(),mutable={...draft},ticket=s.release.begin(mutable);mutable.description='Unvalidated change';const permit=s.release.complete(ticket,pass)!;expect(s.release.visual(permit)?.description).toBe(draft.description);let heard='';expect(s.release.startSpeech(permit,(look,signal,authorize)=>{expect(signal.aborted).toBe(false);if(authorize())heard=look.description;})).toBe(true);expect(heard).toBe(draft.description);expect(s.release.startSpeech(permit,vi.fn())).toBe(false);expect(s.release.visual({...permit})).toBeNull();});
 it.each(['edit','speech','profile','reference','clear','recheck','end','dispose'])('cancels queued speech immediately on %s',action=>{const s=approved();let signal!:AbortSignal,authorize!:()=>boolean;const stopped=vi.fn();s.release.startSpeech(s.permit,(_draft,sig,check)=>{signal=sig;authorize=check;sig.addEventListener('abort',stopped);});switch(action){case'edit':s.notebook.edit('color','Blue');break;case'speech':s.notebook.capture({session:1,field:'color',baseRevision:0,sequence:1,value:'Blue',confirmed:false});break;case'profile':s.notebook.preferencesChanged();break;case'reference':s.notebook.setReference({label:'My jacket',kind:'owned'});break;case'clear':s.notebook.clear();break;case'recheck':s.release.begin({...draft,id:'next'});break;case'end':s.release.end();break;default:s.release.dispose();}expect(signal.aborted).toBe(true);expect(stopped).toHaveBeenCalledTimes(1);expect(authorize()).toBe(false);expect(s.release.visual(s.permit)).toBeNull();});
 it('rejects old validation after edits or a newer candidate',()=>{const s=setup(),old=s.release.begin(draft);s.notebook.edit('budget','USD 100 maximum (items only)');expect(s.release.complete(old,pass)).toBeNull();const second=s.release.begin({...draft,id:'second'});const third=s.release.begin({...draft,id:'third'});expect(s.release.complete(second,pass)).toBeNull();expect(s.release.complete(third,pass)).not.toBeNull();});
 it('rejects external check completion and check timeouts',()=>{const s=setup(),ticket=s.release.begin(draft);s.notebook.timeout(ticket);expect(s.release.complete(ticket,pass)).toBeNull();});
 it('holds transport exceptions without replaying speech',()=>{const s=approved();expect(s.release.startSpeech(s.permit,()=>{throw Error('Provider failure');})).toBe(false);expect(s.release.visual(s.permit)).toBeNull();expect(s.release.startSpeech(s.permit,vi.fn())).toBe(false);});
 it('never authorizes frames after an edit inside the speech callback',()=>{const s=approved(),sent:string[]=[];expect(s.release.startSpeech(s.permit,(look,_signal,authorize)=>{s.notebook.edit('color','Blue');if(authorize())sent.push(look.description);})).toBe(false);expect(sent).toEqual([]);});
 it('bounds input and refuses work after disposal',()=>{const s=setup();expect(()=>s.release.begin({...draft,description:'x'.repeat(2001)})).toThrow();s.release.dispose();expect(()=>s.release.begin(draft)).toThrow();});
});

describe('notebook and simulated playback integration',()=>{
 it('discards already queued frames after a budget change',async()=>{
   const s=approved(),queue:Array<()=>void>=[],delivered:string[]=[];
   s.release.startSpeech(s.permit,(look,signal,authorize)=>{
     for(const frame of [look.description,'second frame'])queue.push(()=>{if(!signal.aborted&&authorize())delivered.push(frame);});
   });
   queue.shift()!();expect(delivered).toHaveLength(1);
   s.notebook.edit('budget','USD 100 maximum (items only)');
   for(const frame of queue)frame();
   expect(delivered).toHaveLength(1);expect(s.release.visual(s.permit)).toBeNull();
 });
 it('cannot release another candidate from a previously approved permit',()=>{
   const s=approved();const old=s.permit,ticket=s.release.begin({...draft,id:'replacement',description:'Different unchecked look'});
   expect(s.release.visual(old)).toBeNull();expect(s.release.startSpeech(old,vi.fn())).toBe(false);
   s.notebook.preferencesChanged();expect(s.release.complete(ticket,pass)).toBeNull();
 });
});
