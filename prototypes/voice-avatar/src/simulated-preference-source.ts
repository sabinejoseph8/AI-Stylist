/** Server-injected fixture source only. No account identity, database, profile
 * save endpoint or session exception is implemented by this preparation. */
export class SimulatedPreferenceSource {
 private revision=1;
 private colors:readonly string[]=[];
 private held=false;
 private listeners=new Set<()=>void>();
 constructor(options:{simulation?:boolean;excludedColors?:readonly string[]}) {
  if(options.simulation!==true)throw Error('Live preference source is disabled.');
  const colors=this.parse(options.excludedColors??[]);
  if(!colors)throw Error('Invalid simulated preferences.');
  this.colors=colors;
 }
 private parse(value:unknown):readonly string[]|null {
  if(!Array.isArray(value)||value.length>16||value.some(color=>typeof color!=='string'||!color.trim()||color.length>160))return null;
  return Object.freeze([...new Set(value.map(color=>(color as string).trim().toLowerCase()))]);
 }
 snapshot(){return this.held?null:{revision:this.revision,excludedColors:Object.freeze([...this.colors])};}
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 /** Simulates a separately authorized server profile update, not conversation
  * extraction or client save authority. Invalid data holds this source. */
 replace(expectedRevision:number,excludedColors:unknown):boolean {
  if(this.held||expectedRevision!==this.revision)return false;
  const colors=this.parse(excludedColors);
  if(!colors){this.held=true;for(const listener of [...this.listeners])listener();return false;}
  this.colors=colors;this.revision++;
  for(const listener of [...this.listeners])listener();return true;
 }
}
