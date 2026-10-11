/** Prepared revision fence. Requires a fresh authoritative DB read before release. */
export class ProfileRevisionFence {
 #issued=new WeakSet<object>();
 #revision:number|null=null; #closed=false; #generation=0;
 #cancel:()=>void;
 constructor(cancel:()=>void){this.#cancel=cancel;}
 observe(value:unknown):void {
  if(this.#closed)throw Error('Closed');
  if(!Number.isSafeInteger(value)||Number(value)<0||(this.#revision!==null&&Number(value)<this.#revision)){this.close();throw Error('Invalid or stale revision');}
  if(value===this.#revision)return;
  const previous=this.#revision;this.#revision=value as number;this.#generation++;
  if(previous!==null)try{this.#cancel();}catch{this.close();throw Error('Invalidation failed');}
 }
 capture():Readonly<{revision:number;generation:number}>{
  if(this.#closed||this.#revision===null)throw Error('Not ready');
  const stamp=Object.freeze({revision:this.#revision,generation:this.#generation});this.#issued.add(stamp);return stamp;
 }
 allows(stamp:Readonly<{revision:number;generation:number}>):boolean{return this.#issued.has(stamp)&&!this.#closed&&this.#revision!==null&&stamp.revision===this.#revision&&stamp.generation===this.#generation;}
 close():void{if(this.#closed)return;this.#closed=true;this.#generation++;try{this.#cancel();}catch{}}
}
