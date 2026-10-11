import {describe,it,expect,vi} from 'vitest';
import {SimulatedContractPreferenceSource} from '../src/simulated-contract-preference-source.ts';
const rule={id:'color',field:'color',kind:'required',status:'confirmed',value:'green'};
const setup=()=>new SimulatedContractPreferenceSource({simulation:true,contract:{version:1,revision:1,rules:[rule]}});
describe('separate contract fixture authority',()=>{
 it('requires explicit simulation',()=>expect(()=>new SimulatedContractPreferenceSource({contract:{}})).toThrow('disabled'));
 it('rejects malformed construction',()=>expect(()=>new SimulatedContractPreferenceSource({simulation:true,contract:{}})).toThrow('held'));
 it('copies immutable contracts and controls the next revision',()=>{const rules=[{...rule}],source=new SimulatedContractPreferenceSource({simulation:true,contract:{version:1,revision:7,rules}});rules[0]!.value='red';const old=source.contractSnapshot()!;expect(old.rules[0]?.value).toBe('green');expect(source.replace(7,[{...rule,value:'blue'}])).toBe(true);expect(source.snapshot()?.revision).toBe(8);expect(old.rules[0]?.value).toBe('green');expect(Object.isFrozen(source.snapshot())).toBe(true);});
 it('refuses stale changes without holding or notifying',()=>{const source=setup(),notify=vi.fn();source.subscribe(notify);expect(source.replace(0,null)).toBe(false);expect(source.snapshot()?.revision).toBe(1);expect(notify).not.toHaveBeenCalled();});
 it('notifies synchronously and removes subscriptions',()=>{const source=setup(),notify=vi.fn();const remove=source.subscribe(notify);source.replace(1,[]);expect(notify).toHaveBeenCalledTimes(1);remove();source.replace(2,[]);expect(notify).toHaveBeenCalledTimes(1);});
 it.each([null,{},[{...rule,override:true}],[{...rule,value:null}]])('holds malformed updates permanently %j',rules=>{const source=setup(),notify=vi.fn();source.subscribe(notify);expect(source.replace(1,rules)).toBe(false);expect(source.snapshot()).toBeNull();expect(source.contractSnapshot()).toBeNull();expect(source.replace(1,[])).toBe(false);expect(notify).toHaveBeenCalledTimes(1);});
 it('notifies every owner even if another observer throws',()=>{const source=setup(),notify=vi.fn();source.subscribe(()=>{throw Error('private fixture error');});source.subscribe(notify);expect(()=>source.replace(1,[])).not.toThrow();expect(notify).toHaveBeenCalledTimes(1);expect(source.snapshot()?.revision).toBe(2);});
 it('holds revision overflow instead of reusing an identity',()=>{const source=new SimulatedContractPreferenceSource({simulation:true,contract:{version:1,revision:Number.MAX_SAFE_INTEGER,rules:[]}});expect(source.replace(Number.MAX_SAFE_INTEGER,[])).toBe(false);expect(source.snapshot()).toBeNull();});
});
