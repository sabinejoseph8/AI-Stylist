/** Local SQL composition checks only. No HTTP connection, credentials or provider. */
import assert from 'node:assert/strict';
import {execFile, spawn} from 'node:child_process';
import {PreparedNoteAllowance} from '../src/prepared-note-allowance.ts';
import type {PreparedNoteLedger} from '../src/prepared-note-allowance.ts';
import {createPreparedNotePersistenceTransport} from '../src/prepared-note-persistence-transport.ts';
import {createPreparedNoteServerOwner} from '../src/prepared-note-server-owner.ts';
import {TRANSCRIPTION_MODEL} from '../src/live-transcription.ts';

const [flag, container, ...extra] = process.argv.slice(2);
const worker = extra.length === 1 && extra[0] === '--open-history-hold';
if (flag !== '--local-docker' || !container || !/^ai-stylist-notebook-db-[a-f0-9]{12}$/.test(container) || (extra.length && !worker)) {
 throw Error('An explicitly isolated local test container is required.');
}
async function command(args: string[], input = ''): Promise<string> {
 return new Promise((resolve, reject) => {
  const child = spawn('docker', args, {stdio: ['pipe', 'pipe', 'pipe']});
  let output = '', bytes = 0, failed = false;
  const timer = setTimeout(() => {failed = true; child.kill();}, 5000);
  child.stdout.on('data', (chunk: Buffer) => {
   bytes += chunk.length;
   if (bytes > 65536) {failed = true; child.kill();} else output += chunk.toString('utf8');
  });
  child.stderr.resume(); // Never print SQL arguments or database diagnostics.
  child.on('error', () => {clearTimeout(timer); reject(Error('Local database command unavailable.'));});
  child.on('close', code => {clearTimeout(timer); if (failed || code !== 0) reject(Error('Local database command failed.')); else resolve(output.trim());});
  child.stdin.on('error', () => {});
  child.stdin.end(input);
 });
}
const inspection = JSON.parse(await command(['inspect', container])) as Array<{
 HostConfig: {NetworkMode: string; PortBindings: unknown; Tmpfs: Record<string,string>};
 Mounts: unknown[]; Config: {Image: string};
}>;
assert.equal(inspection.length, 1);
const isolated = inspection[0]!;
assert.equal(isolated.HostConfig.NetworkMode, 'none');
assert.ok(!isolated.HostConfig.PortBindings || Object.keys(isolated.HostConfig.PortBindings).length === 0);
assert.ok(isolated.HostConfig.Tmpfs['/var/lib/postgresql/data']);
assert.equal(isolated.Mounts.length, 0);
assert.equal(isolated.Config.Image, 'postgres:17@sha256:2d2b8998d31037bf721cfdf764d76ba74171b4fab3431b7f72c27c56ddbdf9e3');
const sql = (query: string) => command(['exec', '-i', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atq'], query);
const literal = (value: unknown) => "'" + JSON.stringify(value).replaceAll("'", "''") + "'::jsonb";
const base: PreparedNoteLedger = {version:1,purpose:'notes-only-simulation',approval:{id:'synthetic_sql_composition',attempts:3,centsPerAttempt:100,secondsPerAttempt:85},runs:[]};
const reset = () => sql('delete from stylist_notebook_private.allowance; insert into stylist_notebook_private.allowance(ledger) values (' + literal(base) + ');');
const read = async (): Promise<PreparedNoteLedger> => JSON.parse(await sql('set role service_role; select public.stylist_notebook_allowance_read();'));
const preview = {origin:'https://fixture.onrender.com',password:'synthetic_local_password_123456789'};
const request = (signal = new AbortController().signal) => ({method:'GET',path:'/api/notebook-simulation',host:'fixture.onrender.com',origin:preview.origin,authorization:'Basic '+Buffer.from('stylist:'+preview.password).toString('base64'),signal});
type Fault = 'none' | 'reserve-ack-lost' | 'close-ack-lost' | 'reserve-pending';
const endings: Array<() => Promise<void>> = [];
function setup(fault: Fault = 'none', readBarrier?: () => Promise<void>) {
 let calls = 0, providers = 0, closes = 0;
 let release!: () => void, signalCommitted!: () => void;
 const committed = new Promise<void>(resolve => {signalCommitted = resolve;});
 const fetch = async (url: string, init: RequestInit): Promise<Response> => {
  calls++;
  if (url === 'https://fixture.supabase.co/rest/v1/rpc/stylist_notebook_allowance_read') {
   const snapshot = await read();
   await readBarrier?.();
   return Response.json(snapshot);
  }
  assert.equal(url, 'https://fixture.supabase.co/rest/v1/rpc/stylist_notebook_allowance_change');
  const {expected,replacement} = JSON.parse(init.body as string) as {expected:PreparedNoteLedger;replacement:PreparedNoteLedger};
  let applied: string;
  try {applied = await sql('set role service_role; select public.stylist_notebook_allowance_change('+literal(expected)+','+literal(replacement)+');');}
  catch {return new Response('null',{status:500,headers:{'content-type':'application/json'}});}
  assert.equal(applied, 't');
  const reserving = replacement.runs.some(run => !run.closed);
  if ((fault === 'reserve-ack-lost' && reserving) || (fault === 'close-ack-lost' && !reserving)) throw Error('Synthetic acknowledgment loss.');
  if (fault === 'reserve-pending' && reserving) {
   const pending = new Promise<void>(resolve => {release = resolve;});
   signalCommitted(); await pending;
  }
  return Response.json(true);
 };
 const persistence = createPreparedNotePersistenceTransport({simulation:true,url:'https://fixture.supabase.co',fetch});
 const allowance = new PreparedNoteAllowance({simulation:true,persistence});
 const owner = createPreparedNoteServerOwner({simulation:true,preview,allowance,changed:()=>{},createTransports:()=>{
  providers++;
  return {socket:Object.assign(new EventTarget(),{readyState:1,bufferedAmount:0,send:()=>{},close:()=>{closes++;}}),capture:{start:async()=>true,stop:()=>{}},fetch:async()=>{throw Error('No provider request permitted.');}};
 }});
 const start = async (signal?: AbortSignal) => {
  const result = await owner.start(request(signal));
  if (result.status === 200) endings.push(result.end);
  return result;
 };
 return {owner,allowance,start,committed,release:()=>release(),counts:()=>({calls,providers,closes})};
}
if (worker) {
 const before = await read(); assert.ok(before.runs.some(run=>!run.closed));
 const freshProcess = setup(); assert.equal((await freshProcess.start()).status,503);
 assert.equal(freshProcess.counts().providers,0);
 assert.equal(freshProcess.owner.status().state,'held');
 assert.deepEqual(await read(),before);
} else try {
 await reset();
 const normal = setup(), first = await normal.start();
 assert.equal(first.status,200); if(first.status!==200) throw Error('Expected local owner.');
 assert.equal((await read()).runs[0]!.closed,false);
 await first.end();
 assert.equal(normal.owner.status().state,'idle');
 assert.deepEqual(normal.counts(),{calls:4,providers:1,closes:1});
 const firstClosed = await read(); assert.equal(firstClosed.runs[0]!.closed,true);

 const fresh = setup(), second = await fresh.start();
 assert.equal(second.status,200); if(second.status!==200) throw Error('Expected replacement local owner.');
 assert.deepEqual((await read()).runs[0],firstClosed.runs[0]);
 assert.equal((await read()).runs.length,2); await second.end();
 const third = await fresh.start(); assert.equal(third.status,200); if(third.status!==200) throw Error('Expected final fixture slot.');
 await third.end(); assert.equal((await fresh.start()).status,503);
 assert.equal((await read()).runs.length,3); assert.equal(fresh.counts().providers,2);

 await reset();
 const uncertain = setup('reserve-ack-lost');
 assert.equal((await uncertain.start()).status,503);
 assert.equal(uncertain.owner.status().state,'held'); assert.equal(uncertain.counts().providers,0);
 const open = await read(); assert.equal(open.runs[0]!.closed,false);
 const restarted = setup(); assert.equal((await restarted.start()).status,503);
 assert.equal(restarted.counts().providers,0); assert.deepEqual(await read(),open);
 await new Promise<void>((resolve,reject)=>{
  execFile(process.execPath,[process.argv[1]!, '--local-docker',container,'--open-history-hold'],{timeout:15000,maxBuffer:65536},error=>{
   if(error)reject(Error('Fresh process did not preserve the unresolved reservation hold.')); else resolve();
  });
 });
 assert.deepEqual(await read(),open);

 await reset();
 const lostClose = setup('close-ack-lost'), closing = await lostClose.start();
 assert.equal(closing.status,200); if(closing.status!==200) throw Error('Expected local owner.');
 await closing.end(); assert.equal(lostClose.owner.status().state,'held');
 assert.equal(lostClose.counts().closes,1); assert.equal((await read()).runs[0]!.closed,true);
 assert.equal((await lostClose.start()).status,409); // No automatic retry in an uncertain owner.
 const recovered = setup(), recovery = await recovered.start();
 assert.equal(recovery.status,200); if(recovery.status!==200) throw Error('Expected fresh fixture owner.');
 assert.equal((await read()).runs.length,2); await recovery.end();

 await reset();
 const pending = setup('reserve-pending'), abort = new AbortController();
 const starting = pending.start(abort.signal);
 await pending.committed; abort.abort(); pending.release();
 assert.equal((await starting).status,499); assert.equal(pending.owner.status().state,'idle');
 assert.equal(pending.counts().providers,0); assert.equal((await read()).runs[0]!.closed,true);

 await reset();
 let reads = 0, releaseReads!: () => void;
 const bothRead = new Promise<void>(resolve=>{releaseReads=resolve;});
 const barrier = async () => {reads++; if(reads===2)releaseReads(); await bothRead;};
 const a = setup('none',barrier), b = setup('none',barrier);
 const competitors = await Promise.all([a.start(),b.start()]);
 assert.deepEqual(competitors.map(r=>r.status).sort(),[200,503]);
 assert.equal(a.counts().providers+b.counts().providers,1);
 const winner = competitors.find(r=>r.status===200)!; await winner.end();
 assert.equal(a.counts().calls+b.counts().calls,6); // Both reservations actually reached SQL compare-and-swap.
 const final = await read(); assert.equal(final.runs.length,1); assert.equal(final.runs[0]!.closed,true);
 await reset();
 const gated = setup(), authoritative = await gated.start();
 assert.equal(authoritative.status,200); if(authoritative.status!==200) throw Error('Expected local owner.');
 authoritative.probe.receive({type:'session.updated',session:{type:'transcription',audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:TRANSCRIPTION_MODEL},turn_detection:null}}}});
 const draft = {id:'synthetic_sql_look',description:'Synthetic look checked by a fixture only'};
 const ticket = authoritative.looks.begin(draft); assert.ok(ticket);
 const permit = authoritative.looks.complete(ticket,{outcome:'passed',reason:'Trusted synthetic fixture result'}); assert.ok(permit);
 let speechSignal!: AbortSignal, frame!: () => boolean;
 assert.equal(authoritative.looks.startSpeech(permit,(_draft,signal,authorize)=>{speechSignal=signal;frame=authorize;}),true);
 assert.equal(frame(),true); assert.equal(authoritative.probe.edit('color','Blue',0),true);
 assert.equal(speechSignal.aborted,true); assert.equal(frame(),false); assert.equal(authoritative.looks.visual(permit),null);
 const revisedTicket = authoritative.looks.begin(draft); assert.ok(revisedTicket);
 const revisedPermit = authoritative.looks.complete(revisedTicket,{outcome:'passed',reason:'Trusted revised synthetic fixture result'}); assert.ok(revisedPermit);
 assert.equal(await authoritative.probe.beginTurn('synthetic_new_turn'),true);
 assert.equal(authoritative.looks.visual(revisedPermit),null); assert.equal(authoritative.looks.begin(draft),null);
 await authoritative.end(); assert.equal((await read()).runs[0]!.closed,true);
 assert.equal(authoritative.looks.begin(draft),null);
 assert.deepEqual(JSON.parse(await sql('select ledger from public.stylist_prototype_budget;')),{synthetic_legacy:true,closed_attempts:9});
 console.log('8 local SQL-backed TypeScript owner scenarios passed, including a fresh Node process. No HTTP or paid provider calls.');
 const {checkNotebookBrowserDb}=await import('./check-notebook-browser-db.ts');
 await checkNotebookBrowserDb({reset,read,sql,literal});
} finally {
 for (const end of endings) await end();
}
