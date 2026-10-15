import {it,expect} from 'vitest';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,unlink,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixtureCall} from './support/recovery-admission-process.ts';
async function setup(){const root=await mkdtemp(join(tmpdir(),'stylist-durable-admission-')),expected=await fixtureCall(root,{},'prepare');return {root,expected,close:()=>rm(root,{recursive:true,force:true})};}
function probe(root:string,expected:unknown,mode='complete'){
 return new Promise<{code:number|null;value?:{status:string;providerCalls:number;passwordCalls:number}}>((resolve,reject)=>{
  const child=spawn(process.execPath,[fileURLToPath(new URL('./support/recovery-admission-process.ts',import.meta.url)),'probe'],{stdio:['pipe','pipe','pipe']});let text='';const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Probe timeout'));},8000);
  child.stdout.on('data',data=>text+=data.toString());child.stderr.resume();child.on('error',error=>{clearTimeout(timer);reject(error);});
  child.on('close',code=>{clearTimeout(timer);try{resolve({code,...(text?{value:JSON.parse(text)}:{})});}catch{reject(Error('Probe failed'));}});child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({root,expected,mode}));
 });
}
it('fresh Node/Python processes preserve counts through three full reset/cleanup cycles',async()=>{
 const f=await setup();try{
  for(let n=0;n<3;n++)expect((await probe(f.root,f.expected)).value).toEqual({status:'complete',providerCalls:1,passwordCalls:1});
  expect((await probe(f.root,f.expected)).value).toEqual({status:'notCreated',providerCalls:0,passwordCalls:0});
  const state=await fixtureCall(f.root,f.expected,'inspect') as {records:Array<{kind:string;state:string}>};expect(state.records.filter(x=>x.kind==='verify').map(x=>x.state)).toEqual(['completed','completed','completed']);
  expect(await readFile(join(f.root,'ledger.json'),'utf8')).not.toMatch(/made-up-only|synthetic-only|access_token|password/);
 }finally{await f.close();}
},15000);
it.each([['crash-verify',71,'reserved'],['crash-reset',72,'resetting']])('a crash at %s blocks the next fresh process before provider work',async(mode,exit,state)=>{
 const f=await setup();try{
  expect((await probe(f.root,f.expected,mode as string)).code).toBe(exit);expect((await probe(f.root,f.expected)).value).toEqual({status:'notCreated',providerCalls:0,passwordCalls:0});
  const saved=await fixtureCall(f.root,f.expected,'inspect') as {records:Array<{state:string}>};expect(saved.records.at(-1)?.state).toBe(state);
 }finally{await f.close();}
},15000);
it('missing journal state blocks a new process without reseeding or provider work',async()=>{
 const f=await setup();try{await unlink(join(f.root,'ledger.json'));expect((await probe(f.root,f.expected)).value).toEqual({status:'notCreated',providerCalls:0,passwordCalls:0});await expect(readFile(join(f.root,'ledger.json'))).rejects.toThrow();}finally{await f.close();}
},15000);
