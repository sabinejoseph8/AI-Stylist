import {preparePreferenceContract} from './preference-contract.ts';
import type {PreparedPreferenceContract} from './preference-contract.ts';
export type SimulatedPreferenceAuthority={snapshot:()=>Readonly<{revision:number}>|null;contractSnapshot:()=>PreparedPreferenceContract|null;subscribe:(listener:()=>void)=>()=>void};
/** Separate server-only fixture authority. No account lookup, save endpoint or
 * conversation tool constructs or changes this source. */
export class SimulatedContractPreferenceSource implements SimulatedPreferenceAuthority {
 private current:PreparedPreferenceContract;
 private held=false;
 private listeners=new Set<()=>void>();
 constructor(options:{simulation?:boolean;contract:unknown}){
  if(options.simulation!==true)throw Error('Live contract preference source is disabled.');
  this.current=preparePreferenceContract(options.contract,{simulation:true});
 }
 snapshot(){return this.held?null:this.current;}
 contractSnapshot(){return this.snapshot();}
 subscribe(listener:()=>void){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
 /** The trusted fixture caller supplies rules, never its own new revision. */
 replace(expectedRevision:number,rules:unknown):boolean{
  if(this.held||expectedRevision!==this.current.revision)return false;
  try{
   this.current=preparePreferenceContract({version:1,revision:this.current.revision+1,rules},{simulation:true});
  }catch{
   this.held=true;this.notify();return false;
  }
  this.notify();return true;
 }
 private notify(){
  // One failing observer must not leave another observer's old permit alive.
  for(const listener of [...this.listeners]){try{listener();}catch{/* Source revision is already authoritative. */}}
 }
}
