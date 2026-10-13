/** Isolated SQL-backed ledger owner checks. No HTTP, credentials or providers. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {preparePrivateNotesTrialPersistence} from '../src/private-notes-trial-persistence.ts';
import {PrivateNotesTrialLedgerOwner} from '../src/private-notes-trial-ledger.ts';
import type {PrivateNotesTrialLedger} from '../src/private-notes-trial-ledger.ts';
const [flag,container,mode,...extra]=process.argv.slice(2);
if(flag!=='--local-docker'||!container||!/^stylist-private-notes-[a-f0-9]{12}$/.test(container)||extra.length||mode&&mode!=='--hold')throw Error('An isolated local test container is required.');
function command(executable:string,args:string[],input=''):Promise<string>{return new Promise((resolve,reject)=>{
 const child=spawn(executable,args,{stdio:['pipe','pipe','pipe']});let output='',bytes=0,failed=false;
 const timer=setTimeout(()=>{failed=true;child.kill();},10000);
 child.stdout.on('data',(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>65536){failed=true;child.kill();}else output+=chunk.toString('utf8');});child.stderr.resume();child.stdin.on('error',()=>{});
 child.on('error',()=>{clearTimeout(timer);reject(Error('Local check unavailable.'));});child.on('close',code=>{clearTimeout(timer);if(failed||code!==0)reject(Error('Local check failed.'));else resolve(output.trim());});child.stdin.end(input);
});}
const [inspection]=JSON.parse(await command('docker',['inspect',container]));
assert.equal(inspection.HostConfig.NetworkMode,'none');assert.ok(!inspection.HostConfig.PortBindings||Object.keys(inspection.HostConfig.PortBindings).length===0);assert.ok(inspection.HostConfig.Tmpfs['/var/lib/postgresql/data']);assert.equal(inspection.Mounts.length,0);assert.equal(inspection.Config.Image,'postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3');
const sql=(query:string)=>command('docker',['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-Atq'],query);
const literal=(v:unknown)=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
const base:PrivateNotesTrialLedger={version:1,purpose:'notes-only-private-trial',approval:{id:'synthetic_owner_not_approval',cents:200,maxSeconds:85,maxTurns:2,maxExtractions:64,maxInputTokens:1000000,maxOutputTokens:2048},reservation:null};
const reset=()=>sql('delete from stylist_notes_trial_private.allowance;insert into stylist_notes_trial_private.allowance(ledger)values('+literal(base)+');');
const read=async():Promise<PrivateNotesTrialLedger>=>JSON.parse(await sql('set role service_role;select public.stylist_private_notes_trial_read();'));
function persistence(lostResponse=false,barrier?:()=>Promise<void>){let reads=0,writes=0;
 const transport=preparePrivateNotesTrialPersistence({simulation:true,url:'https://fixture.supabase.co',fetch:async(url,init)=>{
  assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');
  if(url==='https://fixture.supabase.co/rest/v1/rpc/stylist_private_notes_trial_read'){
   reads++;const value=await read();await barrier?.();return Response.json(value);
  }
  assert.equal(url,'https://fixture.supabase.co/rest/v1/rpc/stylist_private_notes_trial_change');writes++;
  const {expected,replacement}=JSON.parse(init.body as string);
  const result=await sql('set role service_role;select public.stylist_private_notes_trial_change('+literal(expected)+','+literal(replacement)+');');assert.equal(result,'t');
  if(lostResponse)throw Error('Synthetic lost response.');return Response.json(true);
 }});
 return {...transport,counts:()=>({reads,writes})};
}
async function freshHold(){await command(process.execPath,[fileURLToPath(import.meta.url),'--local-docker',container,'--hold']);}
if(mode==='--hold'){
 const p=persistence();await assert.rejects(new PrivateNotesTrialLedgerOwner(p).reserve());assert.deepEqual(p.counts(),{reads:1,writes:0});
}else{
 await reset();let p=persistence(),owner=new PrivateNotesTrialLedgerOwner(p);const id=await owner.reserve();await owner.recordOutcome(id,'transport-closed');assert.equal((await read()).reservation?.state,'transport-closed');await freshHold();
 await reset();p=persistence(true);owner=new PrivateNotesTrialLedgerOwner(p);await assert.rejects(owner.reserve());await assert.rejects(owner.reserve());assert.deepEqual(p.counts(),{reads:1,writes:1});assert.equal((await read()).reservation?.state,'reserved');await freshHold();
 await reset();let release!:()=>void,readers=0;const ready=new Promise<void>(r=>release=r);const barrier=async()=>{if(++readers===2)release();await ready;};const a=persistence(false,barrier),b=persistence(false,barrier);
 const results=await Promise.allSettled([new PrivateNotesTrialLedgerOwner(a).reserve(),new PrivateNotesTrialLedgerOwner(b).reserve()]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(a.counts().writes+b.counts().writes,2);await freshHold();
 await reset();p=persistence();owner=new PrivateNotesTrialLedgerOwner(p);await owner.reserve();await assert.rejects(owner.recordOutcome('unknown','held'));assert.equal(owner.status().held,true);assert.equal((await read()).reservation?.state,'reserved');await freshHold();
 assert.equal(await sql('select value from public.avatar_sentinel;'),'17');
 console.log('4 SQL-backed TypeScript owner scenarios passed, including 4 fresh-process refusal checks.');
}
