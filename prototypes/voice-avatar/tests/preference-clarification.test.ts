import {describe,it,expect} from 'vitest';
import {NotebookState} from '../src/notebook-state.ts';
import {preparePreferenceClarification} from '../src/preference-clarification.ts';
const setup=()=>{const notebook=new NotebookState(),ticket=notebook.beginCheck();notebook.completeCheck(ticket,{outcome:'unknown',reason:'Safe explanation'});return{simulation:true,profileRevision:1,notebook:notebook.snapshot(),ticket,issues:[{field:'color' as const,reason:'request-conflict' as const}]};};
describe('safe revision-bound clarification records',()=>{
 it('requires explicit simulation',()=>expect(()=>preparePreferenceClarification({...setup(),simulation:false})).toThrow('disabled'));
 it('copies, freezes and deduplicates safe issues',()=>{const input=setup();input.issues.push({...input.issues[0]!});const result=preparePreferenceClarification(input);input.issues.length=0;expect(result.issues).toHaveLength(1);expect(Object.isFrozen(result)).toBe(true);expect(Object.isFrozen(result.issues)).toBe(true);expect(Object.isFrozen(result.issues[0])).toBe(true);expect(result).not.toHaveProperty('permit');});
 it.each([0,1.5,NaN])('rejects invalid profile revision %j',profileRevision=>expect(()=>preparePreferenceClarification({...setup(),profileRevision})).toThrow('held'));
 it.each(['session','revision','id'])('rejects stale ticket %s',key=>{const s=setup();expect(()=>preparePreferenceClarification({...s,ticket:{...s.ticket,[key]:s.ticket[key as keyof typeof s.ticket]+1}})).toThrow('held');});
 it('requires a current held check',()=>{const s=setup();expect(()=>preparePreferenceClarification({...s,notebook:{...s.notebook,gate:{...s.notebook.gate!,state:'passed'}}})).toThrow('held');});
 it.each([[],Array(65).fill({field:'color',reason:'request-conflict'}),[{field:'account',reason:'request-conflict'}],[{field:'color',reason:'override'}],[{field:'color',reason:'request-conflict',value:'private_saved_value'}],[{field:'color',reason:'request-conflict',ruleId:'private_rule'}]])('rejects unsafe or unbounded issues %j',issues=>expect(()=>preparePreferenceClarification({...setup(),issues:issues as never})).toThrow('held'));
});
