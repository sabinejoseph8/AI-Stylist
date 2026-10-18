/** Actual disposable PostgreSQL, original owner pair and loopback App rehearsal.
 * Identity is synthetic. This is not hosted Auth, provider cleanup or live timing. */
import {expect,it,vi} from 'vitest';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {createServer} from 'vite';
import type {AddressInfo} from 'node:net';
import type {ServerResponse} from 'node:http';
import {observeLocalCviInput} from '../src/server/local-cvi-transcript-adapter.ts';
import {FIELDS} from '../../../packages/style-contracts/src/index.ts';
import {candidateNoteFixture,candidateIllustrationPorts} from './support/cvi-candidate-illustrations.ts';
import {createLocalCviCandidateRehearsal} from '../src/server/local-cvi-candidate-rehearsal.ts';
import {createConsultationSlot} from '../src/server/consultation-slot.ts';
import type {ConsultationLease} from '../src/server/consultation-slot.ts';
import {createLocalCviViewPort} from '../src/server/local-cvi-view-port.ts';
import {pairedOwnerFixture,PAIRED_FIXTURE_SCOPE} from './support/cvi-paired-owner-fixture.ts';

const enabled=process.env.AI_STYLIST_LOCAL_GLOBAL_ADMISSION==='1'&&process.env.AI_STYLIST_LOCAL_BROWSER_REHEARSAL==='1';
const runtimeRequire=createRequire(process.execPath);
it.skipIf(!enabled)('actual global SQL admission refuses a separate start before its coordinator factory while the original App stays current',async()=>{
 const container=process.env.AI_STYLIST_GLOBAL_SQL_CONTAINER??'';
 expect(container).toMatch(/^stylist-data-[a-f0-9]{10}$/);
 const sql=(query:string)=>execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],{input:query,encoding:'utf8',timeout:8000,stdio:['pipe','pipe','pipe']}).trim();
 const literal=(v:unknown)=>v===null?'null':typeof v==='boolean'||typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
 let sqlCalls=0;
 const rpc={async call(name:string,p:Record<string,unknown>){
  const keys=name==='stylist_claim_consultation'?['p_owner','p_session','p_token']:name==='stylist_update_consultation'?['p_owner','p_session','p_token','p_fence','p_action','p_cleanup_verified']:null;
  if(!keys)throw Error('Unexpected fixture RPC');
  expect(Object.keys(p).sort()).toEqual(keys.slice().sort());sqlCalls++;
  const raw=sql('set role service_role; select to_jsonb(public.'+name+'('+keys.map(k=>literal(p[k])).join(',')+'));');
  return raw?JSON.parse(raw):null;
 }};
 const primary=PAIRED_FIXTURE_SCOPE,other=Object.freeze({ownerId:'00000000-0000-4000-8000-000000000002',sessionId:'22222222-2222-4222-8222-222222222222'});
 sql('insert into auth.users(id) values ('+literal(primary.ownerId)+'),('+literal(other.ownerId)+') on conflict do nothing;');
 expect(sql('select state from stylist_private.consultation_slot where slot=1;')).toBe('free');
 const firstSlot=createConsultationSlot(primary.ownerId,rpc),secondSlot=createConsultationSlot(other.ownerId,rpc);
 let lease:ConsultationLease|null=null,x:Awaited<ReturnType<typeof pairedOwnerFixture>>|undefined,port:ReturnType<typeof createLocalCviViewPort>|undefined;
 let firstFactories=0,secondFactories=0,reserved=false,closed=false,origin='';
 let holdInput=false,inputStarted=false,finishInput=()=>{};
 let run:Awaited<ReturnType<Awaited<ReturnType<typeof pairedOwnerFixture>>['start']>>|undefined,candidate:ReturnType<typeof createLocalCviCandidateRehearsal>|undefined;
 const inputStreams=new Set<ServerResponse>();
 let release=()=>{};const barrier=new Promise<void>(r=>{release=r;});
 const tasks=new Set<Promise<void>>();let server:Awaited<ReturnType<typeof createServer>>|undefined,browser:any;
 const request=()=>new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}});
 const signal=()=>new AbortController().signal;
 const reply=(res:ServerResponse,status:number,value:unknown)=>{res.statusCode=status;res.setHeader('content-type','application/json');res.setHeader('cache-control','no-store');res.end(JSON.stringify(value));};
 try{
  server=await createServer({configFile:false,root:process.cwd(),server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error',plugins:[{name:'global-consultation-fixture',configureServer(s){
   s.middlewares.use('/__consultation_events',(req,res)=>{
    if(req.method!=='GET'||req.headers.host!==new URL(origin).host||(req.headers.origin&&req.headers.origin!==origin)||req.socket.remoteAddress!=='127.0.0.1'||!run||!x){res.statusCode=403;res.end();return;}
    inputStreams.add(res);res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-store','x-content-type-options':'nosniff'});
    const off=observeLocalCviInput(run.transcript,x.context,notice=>res.write('data: '+JSON.stringify(notice)+'\n\n'));res.on('close',()=>{inputStreams.delete(res);off();});
   });
   s.middlewares.use('/__global_landing',(_req,res)=>{res.setHeader('content-type','text/html');res.end('<!doctype html><main>Local admission rehearsal</main>');});
   s.middlewares.use((req,res,next)=>{
    if(!['/__global_start','/__consultation_fixture'].includes(req.url??'')){next();return;}
    const task=(async()=>{
     if(req.method!=='POST'||req.headers.host!==new URL(origin).host||req.headers.origin!==origin||req.headers['content-type']!=='application/json'||req.socket.remoteAddress!=='127.0.0.1'){reply(res,403,{});return;}
     let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1024)throw Error('Oversized fixture command');}
     const c=JSON.parse(body);if(!c||typeof c!=='object'||Array.isArray(c))throw Error();
     const keys=Object.keys(c).sort().join(',');
     if(req.url==='/__global_start'){
      if(keys!=='action'||!['primary','competitor'].includes(c.action)){reply(res,400,{});return;}
      const slot=c.action==='primary'?firstSlot:secondSlot,scope=c.action==='primary'?primary:other;
      const claim=await slot.claim(scope.sessionId);
      if(!claim){reply(res,409,{state:'busy'});return;}
      if(!await slot.update(claim,'provider')){reply(res,409,{state:'held'});return;}
      // Both starts use actual independent SQL admission. No factory runs before it.
      if(c.action==='competitor'){secondFactories++;throw Error('Competing factory must not run');}
      lease=claim;reserved=true;await barrier;
      if(closed){reply(res,503,{state:'held'});return;}
      firstFactories++;x=await pairedOwnerFixture(undefined,{extract:async({text},s)=>{if(holdInput){inputStarted=true;await new Promise<void>(r=>{finishInput=r;});if(s.aborted)throw Error('Synthetic input canceled');}return[{field:'style',value:text}];}});run=await x.start();
      for(const [field] of FIELDS)expect(await x.context.edit(request(),{action:'edit',id:'global_setup_'+field,epoch:1,field,baseRevision:0,sequence:0,value:candidateNoteFixture[field]},signal())).toBe('applied');
      port=createLocalCviViewPort(x.context,request());candidate=createLocalCviCandidateRehearsal({simulation:true,context:x.context,request:request(),clock:x.clock,...candidateIllustrationPorts(x.clock)});reply(res,200,{state:'ready'});return;
     }
     if((keys!=='action'&&keys!=='action,command')||!port||!lease){reply(res,400,{});return;}
     const current=()=>firstSlot.update(lease!,'check');
     if(!await current()){await port.end(signal());reply(res,200,null);return;}
     let value:unknown;
     if(c.action==='snapshot'&&keys==='action')value=await port.snapshot(signal());
     else if(c.action==='edit'&&keys==='action,command')value=await port.edit(c.command,signal());
     else if(c.action==='clear'&&keys==='action')value=await port.clear(signal());
     else if(c.action==='end'&&keys==='action')value=await port.end(signal());
     else if(c.action==='candidateSnapshot'&&keys==='action')value=await candidate!.snapshot(signal());
     else if(c.action==='candidatePrepare'&&keys==='action,command')value=await candidate!.prepare(c.command,signal());
     else if(c.action==='candidateFeedback'&&keys==='action,command')value=await candidate!.feedback(c.command,signal());
     else throw Error('Unsupported fixture action');
     if(!await current()){await port.end(signal());reply(res,200,null);return;}
     reply(res,200,value);
    })().catch(()=>reply(res,503,{state:'held'}));
    tasks.add(task);void task.finally(()=>tasks.delete(task));
   });
  }}]});
  await server.listen();origin='http://127.0.0.1:'+(server.httpServer!.address() as AddressInfo).port;
  const {webkit}=runtimeRequire('playwright'),executable=process.env.WEBKIT_EXECUTABLE??webkit.executablePath();expect(existsSync(executable)).toBe(true);
  browser=await webkit.launch({headless:true,executablePath:executable});const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors:string[]=[],external:string[]=[];
  page.on('pageerror',(e:Error)=>errors.push(e.message));await page.route('**/*',(route:any)=>{if(new URL(route.request().url()).origin!==origin){external.push(route.request().url());return route.abort();}return route.continue();});
  await page.addInitScript(()=>{Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia(){throw Error('Device request forbidden');}}});});
  await page.goto(origin+'/__global_landing');
  const start=(action:string)=>page.evaluate(async(action:string)=>{const r=await fetch('/__global_start',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action})});return{status:r.status,body:await r.json()};},action);
  const pending=start('primary');void pending.catch(()=>{});await vi.waitFor(()=>expect(reserved).toBe(true));
  expect(firstFactories).toBe(0);expect((await start('competitor'))).toEqual({status:409,body:{state:'busy'}});expect(secondFactories).toBe(0);
  expect(sql('select state from stylist_private.consultation_slot where slot=1;')).toBe('provider');
  release();expect(await pending).toEqual({status:200,body:{state:'ready'}});expect(firstFactories).toBe(1);
  expect(await start('primary')).toEqual({status:409,body:{state:'busy'}});expect(firstFactories).toBe(1);
  await page.goto(origin+'/tests/browser/coordinated-notebook.html?input');await page.getByText('Shared sample notes are current.',{exact:true}).waitFor();
  await page.locator('section[aria-label="Shared sample notebook"] summary').click();
  await page.getByRole('button',{name:'Edit style',exact:true}).click();await page.getByLabel('Edit Style',{exact:true}).fill('Long sleeves');await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByText('Shared notebook updated. Ambiguous budgets remain To confirm.',{exact:true}).waitFor();
  expect((await port!.snapshot(signal()))!.notes.style.value).toBe('Long sleeves');expect(firstFactories).toBe(1);expect(secondFactories).toBe(0);
  expect(await start('competitor')).toEqual({status:409,body:{state:'busy'}});
  expect(await page.locator('section[aria-label="Shared sample notebook"] dd').filter({hasText:'Long sleeves'}).isVisible()).toBe(true);
  const generated=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64');
  await page.getByLabel('Choose sample clothing photos',{exact:true}).setInputFiles({name:'generated-global.png',mimeType:'image/png',buffer:generated});
  await page.getByLabel('Describe the sample garment',{exact:true}).fill('Navy blazer');await page.getByLabel('Owned',{exact:true}).check();await page.getByRole('button',{name:'Confirm shared session reference',exact:true}).click();await page.getByRole('heading',{name:'Confirmed shared session reference',exact:true}).waitFor();
  const confirmedURL=await page.locator('.confirmed-reference img').getAttribute('src');expect(confirmedURL).toMatch(/^blob:/);
  const check=page.getByRole('button',{name:'Check shared illustrated sample',exact:true});await check.click();await page.getByRole('button',{name:'Save shared sample look',exact:true}).waitFor();
  holdInput=true;inputStarted=false;const partial=run!.stream('Prefer long sleeves');void partial.catch(()=>{});await vi.waitFor(()=>expect(inputStarted).toBe(true));
  await page.getByText('Simulated speech is being checked. The earlier sample is hidden; you can edit notes or clear this session.',{exact:true}).waitFor();expect(await check.isDisabled()).toBe(true);expect(await page.getByRole('button',{name:'Save shared sample look',exact:true}).count()).toBe(0);expect(await candidate!.snapshot(signal())).toBeNull();expect(await page.locator('.confirmed-reference img').getAttribute('src')).toBe(confirmedURL);
  expect(await start('competitor')).toEqual({status:409,body:{state:'busy'}});expect(secondFactories).toBe(0);
  finishInput();expect((await partial).status).toBe('applied');holdInput=false;
  const panel=page.locator('section[aria-label="Shared sample notebook"]');await panel.locator('dd').filter({hasText:'Prefer long sleeves'}).getByText('To confirm',{exact:true}).waitFor();expect(await check.isDisabled()).toBe(true);
  expect((await run!.stream('Prefer long sleeves',true)).status).toBe('applied');await panel.locator('dd').filter({hasText:'Prefer long sleeves'}).getByText('To confirm',{exact:true}).waitFor();expect(x!.context.sampleInputReady()).toBe(true);
  await page.getByRole('button',{name:'Confirm style',exact:true}).click();await panel.locator('dd').filter({hasText:'Prefer long sleeves'}).getByText('Confirmed',{exact:true}).waitFor();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Check shared illustrated sample'&&!b.disabled));expect(await page.getByRole('button',{name:'Save shared sample look',exact:true}).count()).toBe(0);
  await check.click();await page.getByText('Shared sample needs fresh checks.',{exact:true}).waitFor();expect(await page.getByRole('button',{name:'Save shared sample look',exact:true}).count()).toBe(0);
  // The synthetic catalog still verifies Long sleeves, not the changed wording.
  // Preserve the failed check, then explicitly correct the note and check again.
  await page.getByRole('button',{name:'Edit style',exact:true}).click();await page.getByLabel('Edit Style',{exact:true}).fill('Long sleeves');await page.getByRole('button',{name:'Save',exact:true}).click();await page.getByText('Shared notebook updated. Ambiguous budgets remain To confirm.',{exact:true}).waitFor();
  await check.click();await page.getByRole('button',{name:'Save shared sample look',exact:true}).waitFor();expect(await page.locator('.confirmed-reference img').getAttribute('src')).toBe(confirmedURL);
  // Trusted fixture SQL, never a browser-selected clock or cleanup flag.
  sql("update stylist_private.consultation_slot set expires_at=clock_timestamp()-interval '1 second' where slot=1;");
  await page.getByRole('button',{name:'Refresh shared notes',exact:true}).click();await page.getByText('Shared notes could not be verified. No old notes are displayed.',{exact:true}).waitFor();
  expect(await panel.locator('dd').filter({hasText:'Long sleeves'}).count()).toBe(0);expect(await page.getByRole('button',{name:'Save shared sample look',exact:true}).count()).toBe(0);expect(await start('competitor')).toEqual({status:409,body:{state:'busy'}});expect(secondFactories).toBe(0);
  expect(sql('select state from stylist_private.consultation_slot where slot=1;')).toBe('provider');
  const records=(await x!.f.x.inspect()).requests.length;expect(records).toBeLessThanOrEqual(128);expect(await x!.records()).toHaveLength(0);expect(x!.draft).not.toHaveBeenCalled();expect(errors).toEqual([]);expect(external).toEqual([]);expect(await page.evaluate(()=>localStorage.length+sessionStorage.length)).toBe(0);
  process.stdout.write(JSON.stringify({scope:'global-sql-original-pair-browser',firstFactories,secondFactories,sqlCalls,authorityRecords:records,authorityRecordCap:128,protectedOutputs:0})+'\n');await context.close();
 }finally{
  closed=true;release();finishInput();for(const stream of inputStreams)stream.end();await browser?.close();candidate?.close();await Promise.allSettled([...tasks]);await x?.close();await server?.close();
  // Fixture-only cleanup after every local resource closes; no real provider exists.
  if(lease)await firstSlot.update(lease,'end',true);
 }
},120000);
