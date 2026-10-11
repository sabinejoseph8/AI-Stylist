import {ProfileRevisionFence} from './profile-revision.ts';
/** Accept only snapshots from the authenticated owner's prepared RPC. */
export class ProfileRevisionReader {
 #last:Readonly<{revision:number;sequence:number}>|null=null;
 #fence:ProfileRevisionFence;
 constructor(fence:ProfileRevisionFence){this.#fence=fence;}
 accept(input:unknown):void {
  try{
   if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid snapshot');
   const x=input as Record<string,unknown>;
   if(Object.keys(x).length!==2||!Object.hasOwn(x,'revision')||!Object.hasOwn(x,'sequence'))throw Error('Invalid snapshot');
   if(!Number.isSafeInteger(x.revision)||!Number.isSafeInteger(x.sequence)||Number(x.revision)<0||Number(x.sequence)<0||(x.revision===0)!==(x.sequence===0))throw Error('Invalid snapshot');
   const next={revision:x.revision as number,sequence:x.sequence as number};
   if(this.#last&&(next.sequence<this.#last.sequence||next.revision<this.#last.revision||((next.sequence===this.#last.sequence)!==(next.revision===this.#last.revision))))throw Error('Inconsistent snapshot');
   this.#fence.observe(next.revision);
   this.#last=Object.freeze(next);
  }catch{this.#fence.close();throw Error('Profile revision unavailable');}
 }
 unavailable():void{this.#fence.close();}
}
