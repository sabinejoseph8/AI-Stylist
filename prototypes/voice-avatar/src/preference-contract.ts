import {FIELDS} from './notebook-state.ts';
import type {Field,NotebookState} from './notebook-state.ts';
type Kind='required'|'excluded'|'preferred';
type Rule=Readonly<{id:string;field:Field;kind:Kind;status:'confirmed'|'uncertain';value:string|null}>;
export type PreparedPreferenceContract=Readonly<{version:1;revision:number;rules:readonly Rule[]}>;
const object=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const exact=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const normalized=(value:string)=>value.trim().replace(/\s+/g,' ').toLowerCase();
/** Server-only discovery contract. Does not establish identity, persist a profile,
 * authorize exceptions or approve a look. Only injected synthetic callers use it. */
export function preparePreferenceContract(value:unknown,options:{simulation?:boolean}):PreparedPreferenceContract{
 if(options.simulation!==true)throw Error('Live preference contract is disabled.');
 const fail=()=>{throw Error('Preference contract held.');};
 if(!object(value)||!exact(value,['version','revision','rules'])||value.version!==1||!Number.isSafeInteger(value.revision)||(value.revision as number)<1||!Array.isArray(value.rules)||value.rules.length>32)return fail();
 const ids=new Set<string>();const rules:Rule[]=[];
 for(const rule of value.rules){
  if(!object(rule)||!exact(rule,['id','field','kind','status','value'])||typeof rule.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(rule.id)||ids.has(rule.id)||!FIELDS.some(([field])=>field===rule.field)||!['required','excluded','preferred'].includes(rule.kind as string)||!['confirmed','uncertain'].includes(rule.status as string)||!(rule.value===null||typeof rule.value==='string'&&Boolean(rule.value.trim())&&rule.value.length<=160)||rule.status==='confirmed'&&rule.value===null)return fail();
  ids.add(rule.id);rules.push(Object.freeze({id:rule.id,field:rule.field as Field,kind:rule.kind as Kind,status:rule.status as Rule['status'],value:rule.value===null?null:(rule.value as string).trim()}));
 }
 return Object.freeze({version:1,revision:value.revision as number,rules:Object.freeze(rules)});
}
/** Conservative lexical reconciliation only. Different text is unresolved, not
 * proof of semantic incompatibility. Preserve every rule for the future validator. */
export function reconcilePreparedPreferences(profile:PreparedPreferenceContract,notebook:ReturnType<NotebookState['snapshot']>,options:{simulation?:boolean}){
 // Revalidate and copy even a typed input; it grants no caller authority.
 const saved=preparePreferenceContract(profile,options);
 const issues:Array<{ruleId:string;field:Field;reason:'saved-value-uncertain'|'note-to-confirm'|'request-differs'|'request-excluded'|'saved-rules-unresolved'}>=[];
 const requirements=saved.rules.filter(rule=>rule.kind!=='preferred');
 const ranking=saved.rules.filter(rule=>rule.kind==='preferred'&&rule.status==='confirmed');
 const uncertainPreferences=saved.rules.filter(rule=>rule.kind==='preferred'&&rule.status==='uncertain');
 for(const rule of requirements){
  if(rule.status!=='confirmed'||rule.value===null){issues.push({ruleId:rule.id,field:rule.field,reason:'saved-value-uncertain'});continue;}
  const note=notebook.notes[rule.field];
  if(note.status==='tentative'){issues.push({ruleId:rule.id,field:rule.field,reason:'note-to-confirm'});continue;}
  if(note.status==='confirmed'){
   const same=normalized(note.value)===normalized(rule.value);
   if(rule.kind==='required'&&!same)issues.push({ruleId:rule.id,field:rule.field,reason:'request-differs'});
   if(rule.kind==='excluded'&&same)issues.push({ruleId:rule.id,field:rule.field,reason:'request-excluded'});
  }
  const other=requirements.some(candidate=>candidate.id!==rule.id&&candidate.field===rule.field&&candidate.status==='confirmed'&&candidate.value!==null&&(
   rule.kind==='required'&&candidate.kind==='required'&&normalized(candidate.value)!==normalized(rule.value!)||
   rule.kind!==candidate.kind&&normalized(candidate.value)===normalized(rule.value!)));
  if(other)issues.push({ruleId:rule.id,field:rule.field,reason:'saved-rules-unresolved'});
 }
 const noteConstraints=FIELDS.flatMap(([field])=>notebook.notes[field].status==='confirmed'?[{field,value:notebook.notes[field].value}]:[]);
 const tentativeFields=FIELDS.filter(([field])=>notebook.notes[field].status==='tentative').map(([field])=>field);
 return {status:issues.length?'needs-clarification' as const:'ready-for-validator' as const,profileRevision:saved.revision,notebookSession:notebook.session,notebookRevision:notebook.revision,requirements,ranking,uncertainPreferences,noteConstraints,tentativeFields,issues};
}
