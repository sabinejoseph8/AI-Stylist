/** Disposable local PostgreSQL only. No HTTP, credentials, microphone or provider. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepareReservedNotesStartupDiagnostic} from '../src/reserved-notes-startup-diagnostic.ts';
import {preparePrivateNotesTrialPersistence} from '../src/private-notes-trial-persistence.ts';
const [flag,container,holdId,...extra]=process.argv.slice(2);
if(flag!=='--local-docker'||!container||!/^stylist-private-notes-[a-f0-9]{12}$/.test(container)||extra.length||holdId&&!/^notes_startup_diag_fixture_[a-z]+$/.test(holdId))throw Error('Disposable local database required.');
function command(executable:string,args:string[],input=''):Promise<string>{return new Promise((resolve,reject)=>{const child=spawn(executable,args,{stdio:['pipe','pipe','pipe']});let output='',size=0,failed=false;const timer=setTimeout(()=>{failed=true;child.kill();},10000);child.stdout.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>65536){failed=true;child.kill();}else output+=chunk.toString('utf8');});child.stderr.resume();child.stdin.on('error',()=>{});child.on('error',()=>{clearTimeout(timer);reject(Error('Local check unavailable.'));});child.on('close',code=>{clearTimeout(timer);if(failed||code!==0)reject(Error('Local check failed.'));else resolve(output.trim());});child.stdin.end(input);});}
const [inspection]=JSON.parse(await command('docker',['inspect',container]));
assert.equal(inspection.HostConfig.NetworkMode,'none');assert.ok(!inspection.HostConfig.PortBindings||Object.keys(inspection.HostConfig.PortBindings).length===0);assert.ok(inspection.HostConfig.Tmpfs['/var/lib/postgresql/data']);assert.equal(inspection.Mounts.length,0);assert.equal(inspection.Config.Image,'postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3');
const sql=(query:string)=>command('docker',['exec','-i',container,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-Atq'],query);
const literal=(v:unknown)=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
const read=async(id:string)=>JSON.parse(await sql("set role service_role;select public.stylist_private_notes_trial_read_approved('"+id+"');"));
function store(id:string,lost=false){return preparePrivateNotesTrialPersistence({simulation:true,approvedTrialId:id,url:'https://fixture.supabase.co',fetch:async(url,init)=>{
 const body=JSON.parse(init.body as string);assert.equal(body.approved_id,id);assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');
 if(url.endsWith('/stylist_private_notes_trial_read_approved'))return Response.json(await read(id));
 assert.equal(url,'https://fixture.supabase.co/rest/v1/rpc/stylist_private_notes_trial_change_approved');assert.equal(await sql("set role service_role;select public.stylist_private_notes_trial_change_approved('"+id+"',"+literal(body.expected)+','+literal(body.replacement)+');'),'t');if(lost)throw Error('Synthetic lost acknowledgment');return Response.json(true);
 }});}
const authorization=(approvalId:string)=>({approvalId,financialApproved:true,securityApproved:true,scope:'startup-only' as const});
async function seed(id:string){const ledger={version:1,purpose:'notes-only-private-trial',approval:{id,cents:200,maxSeconds:85,maxTurns:2,maxExtractions:64,maxInputTokens:1000000,maxOutputTokens:2048},reservation:null};await sql("insert into stylist_notes_trial_private.approved_trials(approval_id,ledger)values('"+id+"',"+literal(ledger)+');');}
if(holdId){
 let opened=false;const result=await prepareReservedNotesStartupDiagnostic({authorization:authorization(holdId),store:store(holdId),makeOpener:()=>{opened=true;throw Error('Not permitted');}}).run(new AbortController().signal);assert.equal(result.reservationAttempted,false);assert.equal(opened,false);
}else{
 const original=await sql('set role service_role;select public.stylist_private_notes_trial_read();');let connections=0;
 const makeOpener=(accepted:boolean)=>()=>{connections++;const socket=Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,close:()=>{},send:(encoded:string)=>{const command=JSON.parse(encoded);assert.equal(command.type,'session.update');queueMicrotask(()=>socket.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(accepted?{type:'session.updated',session:command.session}:{type:'error',error:{type:'invalid_request_error',param:'session.type',code:'invalid_value',event_id:command.event_id}})})));}});return{open:async(_signal:AbortSignal,initial:(value:unknown)=>void)=>{initial({type:'session.created',session:{id:'synthetic'}});return{socket,detachInitialEvents:()=>{}};},end:()=>{}};};
 const fresh=async(id:string)=>command(process.execPath,[fileURLToPath(import.meta.url),'--local-docker',container,id]);
 for(const accepted of [true,false]){const id='notes_startup_diag_fixture_'+(accepted?'accepted':'rejected');await seed(id);const result=await prepareReservedNotesStartupDiagnostic({authorization:authorization(id),store:store(id),makeOpener:makeOpener(accepted)}).run(new AbortController().signal);assert.equal(result.result?.outcome,accepted?'configuration-accepted':'configuration-rejected');assert.equal(result.outcomeRecorded,true);assert.equal((await read(id)).reservation.state,'held');await fresh(id);}
 const lost='notes_startup_diag_fixture_lost';await seed(lost);const prior=connections;const result=await prepareReservedNotesStartupDiagnostic({authorization:authorization(lost),store:store(lost,true),makeOpener:makeOpener(false)}).run(new AbortController().signal);assert.equal(result.reservationAcknowledged,false);assert.equal(connections,prior);assert.equal((await read(lost)).reservation.state,'reserved');await fresh(lost);
 const race='notes_startup_diag_fixture_race';await seed(race);const before=connections;const results=await Promise.all([0,1].map(()=>prepareReservedNotesStartupDiagnostic({authorization:authorization(race),store:store(race),makeOpener:makeOpener(false)}).run(new AbortController().signal)));assert.equal(connections-before,1);assert.equal(results.filter(r=>r.result!==null).length,1);assert.equal((await read(race)).reservation.state,'held');await fresh(race);
 assert.equal(await sql('set role service_role;select public.stylist_private_notes_trial_read();'),original);assert.equal(await sql('select value from public.avatar_sentinel;'),'17');
 console.log('4 SQL-backed startup diagnostic scenarios and 4 fresh-process refusal checks passed. No HTTP or provider calls.');
}
