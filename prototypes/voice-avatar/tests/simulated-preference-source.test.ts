import {describe,expect,it,vi} from 'vitest';
import {SimulatedPreferenceSource} from '../src/simulated-preference-source.ts';
describe('server-only simulated preference source',()=>{
 it('requires explicit simulation',()=>expect(()=>new SimulatedPreferenceSource({})).toThrow('disabled'));
 it('copies, normalizes and deduplicates constraints',()=>{
  const values=[' Pink ','PINK'],source=new SimulatedPreferenceSource({simulation:true,excludedColors:values});values.push('blue');
  expect(source.snapshot()).toEqual({revision:1,excludedColors:['pink']});expect(Object.isFrozen(source.snapshot()!.excludedColors)).toBe(true);
 });
 it('publishes revision changes synchronously and supports unsubscribe',()=>{
  const source=new SimulatedPreferenceSource({simulation:true}),listener=vi.fn();const remove=source.subscribe(listener);
  expect(source.replace(1,['blue'])).toBe(true);expect(source.snapshot()?.revision).toBe(2);expect(listener).toHaveBeenCalledTimes(1);
  remove();source.replace(2,[]);expect(listener).toHaveBeenCalledTimes(1);
 });
 it('rejects stale updates without changing valid constraints',()=>{
  const source=new SimulatedPreferenceSource({simulation:true,excludedColors:['green']}),listener=vi.fn();source.subscribe(listener);
  expect(source.replace(0,[])).toBe(false);expect(source.snapshot()?.excludedColors).toEqual(['green']);expect(listener).not.toHaveBeenCalled();
 });
 it.each([null,[''],[2],['x'.repeat(161)],Array(17).fill('pink')])('holds malformed updates %j without fallback or retry',value=>{
  const source=new SimulatedPreferenceSource({simulation:true}),listener=vi.fn();source.subscribe(listener);
  expect(source.replace(1,value)).toBe(false);expect(source.snapshot()).toBeNull();expect(listener).toHaveBeenCalledTimes(1);
  expect(source.replace(1,[])).toBe(false);expect(listener).toHaveBeenCalledTimes(1);
 });
 it('rejects malformed initial data',()=>expect(()=>new SimulatedPreferenceSource({simulation:true,excludedColors:['']})).toThrow('Invalid'));
 it('adapts only current confirmed color exclusions and holds a malformed source',()=>{
  const source=new SimulatedPreferenceSource({simulation:true,excludedColors:[' Blue ']});
  const old=source.contractSnapshot()!;expect(old).toMatchObject({version:1,revision:1,rules:[{field:'color',kind:'excluded',status:'confirmed',value:'blue'}]});
  source.replace(1,['green']);expect(source.contractSnapshot()?.revision).toBe(2);expect(old.rules[0]?.value).toBe('blue');
  source.replace(2,{});expect(source.contractSnapshot()).toBeNull();
 });

});
