import {describe,expect,it} from 'vitest';
import {prepareSyntheticLook} from '../src/synthetic-look-candidate.ts';
const candidate={id:'fixture',color:'green',style:'structured',occasion:'wedding',lookType:'dress',newItemCents:12345,currency:'USD' as const,excludedColors:['pink']};
describe('bounded synthetic look candidate',()=>{
 it('derives display and speech text from copied frozen checked fields',()=>{
  const input={...candidate,excludedColors:['pink']},prepared=prepareSyntheticLook(input);
  input.color='red';input.excludedColors.push('green');
  expect(prepared.draft.description).toContain('green, structured dress for wedding');
  expect(prepared.draft.description).toContain('USD 123.45');
  expect(prepared.candidate.excludedColors).toEqual(['pink']);
  expect(Object.isFrozen(prepared.candidate)).toBe(true);expect(Object.isFrozen(prepared.candidate.excludedColors)).toBe(true);expect(Object.isFrozen(prepared.draft)).toBe(true);
 });
 it.each([{id:'bad id'},{color:''},{style:'x'.repeat(161)},{newItemCents:-1},{newItemCents:1.5},{currency:'CAD'},{excludedColors:['']},{excludedColors:Array(17).fill('red')},{description:'unchecked'}])('rejects invalid or extra candidate data %j',changes=>{
  expect(()=>prepareSyntheticLook({...candidate,...changes} as never)).toThrow('Invalid synthetic candidate');
 });
});
