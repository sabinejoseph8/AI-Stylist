import {describe,it,expect} from 'vitest';
import {validatePreparedNoteTransition} from '../src/prepared-note-allowance.ts';
import type {PreparedNoteLedger} from '../src/prepared-note-allowance.ts';
const fixture=():PreparedNoteLedger=>({version:1,purpose:'notes-only-simulation',approval:{id:'synthetic_only',attempts:3,centsPerAttempt:100,secondsPerAttempt:85},runs:[{id:'old',closed:true},{id:'current',closed:false}]});
describe('single notebook allowance transition contract',()=>{
 it('accepts one closure and returns a detached copy without changing the original',()=>{const before=fixture(),next=structuredClone(before);next.runs[1]!.closed=true;const result=validatePreparedNoteTransition(before,next);expect(result).toEqual(next);result.runs[1]!.closed=false;expect(next.runs[1]!.closed).toBe(true);expect(before.runs[1]!.closed).toBe(false);});
 it('accepts one open append after all prior reservations close',()=>{const before=fixture();before.runs[1]!.closed=true;const next=structuredClone(before);next.runs.push({id:'fresh',closed:false});expect(validatePreparedNoteTransition(before,next)).toEqual(next);});
 it('accepts reordered JSON object keys without changing approval meaning',()=>{const before=fixture(),next=structuredClone(before);next.approval={secondsPerAttempt:85,centsPerAttempt:100,attempts:3,id:'synthetic_only'};next.runs[1]={closed:true,id:'current'};expect(validatePreparedNoteTransition(before,next).runs[1]!.closed).toBe(true);});
 it.each(['id','attempts','centsPerAttempt','secondsPerAttempt'] as const)('rejects an amendment to approval %s',field=>{const before=fixture(),next=structuredClone(before);next.runs[1]!.closed=true;if(field==='id')next.approval.id='different';else next.approval[field]++;expect(()=>validatePreparedNoteTransition(before,next)).toThrow('requires review');});
 it.each(['remove','reorder','rename','reopen','noop','append-while-open','append-closed','append-two','duplicate'] as const)('rejects %s history change',kind=>{
  const before=fixture(),next=structuredClone(before);
  if(kind==='remove')next.runs.pop();
  if(kind==='reorder')next.runs.reverse();
  if(kind==='rename'){next.runs[1]!.id='different';next.runs[1]!.closed=true;}
  if(kind==='reopen'){next.runs[0]!.closed=false;next.runs[1]!.closed=true;}
  if(kind==='append-while-open')next.runs.push({id:'fresh',closed:false});
  if(kind==='append-closed'){before.runs[1]!.closed=true;next.runs[1]!.closed=true;next.runs.push({id:'fresh',closed:true});}
  if(kind==='append-two'){before.runs=[{id:'old',closed:true}];next.runs=[{id:'old',closed:true},{id:'second',closed:true},{id:'third',closed:false}];}
  if(kind==='duplicate'){before.runs[1]!.closed=true;next.runs[1]!.closed=true;next.runs.push({id:'old',closed:false});}
  expect(()=>validatePreparedNoteTransition(before,next)).toThrow('requires review');
 });
 it('rejects an extra hidden payload and a legacy ledger without exposing them',()=>{for(const value of [{...fixture(),private:'sentinel'},{version:1,runs:[]}]){expect(()=>validatePreparedNoteTransition(value,fixture())).toThrow('Notebook allowance transition requires review.');}});
});
