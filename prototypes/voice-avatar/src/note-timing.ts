export type TimingState = 'pending' | 'rendered' | 'failed' | 'canceled';
type Sample = { id:number; inputAt:number; extractedAt:number|null; renderedAt:number|null; state:TimingState };

/** Bounded timing metadata only. No transcript, note value or media is stored. */
export class NoteTiming {
  private samples:Sample[]=[];
  private next=0;
  private overflow=0;
  constructor(privateClock:()=>number=()=>performance.now()){this.clock=privateClock;}
  private clock:()=>number;
  begin(inputAt:number):number|null {
    if(this.samples.length>=256){this.overflow++;return null;}
    if(!Number.isFinite(inputAt)||inputAt<0)return null;
    const id=++this.next;this.samples.push({id,inputAt,extractedAt:null,renderedAt:null,state:'pending'});return id;
  }
  extracted(id:number){
    const sample=this.samples.find(s=>s.id===id),now=this.clock();
    if(!sample||sample.state!=='pending'||sample.extractedAt!==null)return false;
    if(!Number.isFinite(now)||now<sample.inputAt){sample.state='failed';return false;}
    sample.extractedAt=now;return true;
  }
  rendered(id:number){
    const sample=this.samples.find(s=>s.id===id),now=this.clock();
    if(!sample||sample.state!=='pending'||sample.extractedAt===null)return false;
    if(!Number.isFinite(now)||now<sample.extractedAt){sample.state='failed';return false;}
    sample.renderedAt=now;sample.state='rendered';return true;
  }
  finish(id:number,state:'failed'|'canceled'){
    const sample=this.samples.find(s=>s.id===id);if(sample?.state==='pending')sample.state=state;
  }
  records(){return this.samples.map(sample=>({...sample}));}
  report(){
    const elapsed=this.samples.filter(s=>s.state==='rendered').map(s=>s.renderedAt!-s.inputAt).sort((a,b)=>a-b);
    const count=(state:TimingState)=>this.samples.filter(s=>s.state===state).length;
    return {total:this.samples.length,rendered:count('rendered'),failed:count('failed'),canceled:count('canceled'),pending:count('pending'),overflow:this.overflow,
      p95Ms:elapsed.length?elapsed[Math.ceil(elapsed.length*.95)-1]!:null,
      // Reporting a number is not evidence of representative live acceptance.
      liveTargetVerified:false as const};
  }
  clear(){this.samples=[];this.overflow=0;/* IDs never repeat: late render callbacks cannot complete new samples. */}
}
