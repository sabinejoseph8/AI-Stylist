/** Loopback-only actual coordinator/store/browser rehearsal. Synthetic identity
 * and fixed logical clock are not customer authentication or live timing. */
import {expect,it} from 'vitest';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {createServer} from 'vite';
import type {ViteDevServer} from 'vite';
import type {AddressInfo} from 'node:net';
import {pairedOwnerFixture} from './support/cvi-paired-owner-fixture.ts';
import {observeLocalCviInput} from '../src/server/local-cvi-transcript-adapter.ts';
import {candidateNoteFixture} from './support/cvi-candidate-illustrations.ts';
import {FIELDS} from '../../../packages/style-contracts/src/index.ts';
import {createLocalCviCandidateRehearsal} from '../src/server/local-cvi-candidate-rehearsal.ts';
import {candidateIllustrationPorts} from './support/cvi-candidate-illustrations.ts';
import {createLocalCviViewPort} from '../src/server/local-cvi-view-port.ts';
const runtimeRequire=createRequire(process.execPath);
it.skipIf(process.env.AI_STYLIST_LOCAL_BROWSER_REHEARSAL!=='1')('external simulated input hides old samples, preserves references and survives failed checks without reviving cleared notes',async()=>{
 const {webkit}=runtimeRequire('playwright');const executable=process.env.WEBKIT_EXECUTABLE??webkit.executablePath();expect(existsSync(executable)).toBe(true);
 let hold=false,started=false,finish=()=>{};
 const x=await pairedOwnerFixture(undefined,{extract:async({text},signal)=>{if(hold){started=true;await new Promise<void>(r=>{finish=r;});if(signal.aborted)throw Error('Synthetic extraction canceled');}return[{field:'style',value:text}];}});let server:Awaited<ReturnType<typeof createServer>>|undefined,browser:any;
 try{
  const run=await x.start();for(const [field] of FIELDS)expect(await x.context.edit(new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}}),{action:'edit',id:'input_setup_'+field,epoch:1,field,baseRevision:0,sequence:0,value:candidateNoteFixture[field]},new AbortController().signal)).toBe('applied');const port=createLocalCviViewPort(x.context,new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}}));
  const illustrations=candidateIllustrationPorts(x.clock);const candidate=createLocalCviCandidateRehearsal({simulation:true,context:x.context,request:new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer fixture-customer'}}),clock:x.clock,...illustrations});
  const trace:string[]=[];let origin='',inputConnections=0;const inputStreams=new Set<import('node:http').ServerResponse>();const install=(server:ViteDevServer)=>{
   server.middlewares.use('/__consultation_events',(req,res)=>{
    if(req.method!=='GET'||req.headers.host!==new URL(origin).host||req.headers.origin&&req.headers.origin!==origin||req.socket.remoteAddress!=='127.0.0.1'){res.statusCode=403;res.end();return;}
    inputConnections++;inputStreams.add(res);res.on('close',()=>inputStreams.delete(res));res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-store','x-content-type-options':'nosniff'});
    const off=observeLocalCviInput(run.transcript,x.context,notice=>res.write('data: '+JSON.stringify(notice)+'\n\n'));res.on('close',off);
   });
   server.middlewares.use('/__consultation_fixture',(req,res)=>{void(async()=>{
   res.setHeader('cache-control','no-store');res.setHeader('content-type','application/json');
   if(req.method!=='POST'||req.headers.origin!==origin||req.headers['content-type']!=='application/json'){trace.push('request-refused');res.statusCode=403;res.end('{}');return;}
   let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)throw Error();}
   const c=JSON.parse(body);trace.push(String(c.action));const keys=Object.keys(c).sort().join(',');if(keys!=='action'&&keys!=='action,command')throw Error();const signal=new AbortController().signal;
   let result:unknown;if(c.action==='snapshot'&&keys==='action')result=await port.snapshot(signal);else if(c.action==='edit'&&keys==='action,command')result=await port.edit(c.command,signal);else if(c.action==='clear'&&keys==='action')result=await port.clear(signal);else if(c.action==='end'&&keys==='action')result=await port.end(signal);else if(c.action==='candidateSnapshot'&&keys==='action')result=await candidate.snapshot(signal);else if(c.action==='candidatePrepare'&&keys==='action,command')result=await candidate.prepare(c.command,signal);else if(c.action==='candidateFeedback'&&keys==='action,command')result=await candidate.feedback(c.command,signal);else throw Error();trace.push(result===null?'result-null':'result-returned');res.end(JSON.stringify(result));
  })().catch(()=>{trace.push('handler-error');res.statusCode=400;res.end('{}');});});};
  server=await createServer({configFile:false,root:process.cwd(),server:{host:'127.0.0.1',port:0,strictPort:false},logLevel:'error',plugins:[{name:'local-consultation-fixture',configureServer:install}]});
  await server.listen();origin='http://127.0.0.1:'+(server.httpServer!.address() as AddressInfo).port;
  browser=await webkit.launch({headless:true,executablePath:executable});const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors:string[]=[],external:string[]=[];
  page.on('pageerror',(e:Error)=>errors.push(e.message));await page.route('**/*',(route:any)=>{const u=new URL(route.request().url());if(u.origin!==origin){external.push(u.origin);return route.abort();}return route.continue();});
  await page.addInitScript(()=>{Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia(){throw Error('Device request forbidden');}}});});
  await page.goto(origin+'/tests/browser/coordinated-notebook.html?input');try{await page.getByText('Shared sample notes are current.',{exact:true}).waitFor({timeout:8000});}catch{throw Error(JSON.stringify({errors,trace,external,features:await page.evaluate(()=>({any:typeof AbortSignal.any,crypto:typeof crypto.subtle,secure:isSecureContext})),status:await page.locator('[role=status]').allTextContents()}));}await page.locator('section[aria-label="Shared sample notebook"] summary').click();
  const panel=page.locator('section[aria-label="Shared sample notebook"]');
  const generated=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64');
  await page.getByLabel('Choose sample clothing photos',{exact:true}).setInputFiles({name:'generated-fixture.png',mimeType:'image/png',buffer:generated});try{await page.getByLabel('Describe the sample garment',{exact:true}).waitFor({timeout:8000});}catch{throw Error(JSON.stringify({mediaStatus:await page.locator('[role=status]').allTextContents(),features:await page.evaluate(()=>({bitmap:typeof createImageBitmap,canvasType:document.createElement('canvas').toDataURL('image/webp').split(';')[0]}))}));}await page.getByLabel('Describe the sample garment',{exact:true}).fill('Navy blazer');await page.getByLabel('Owned',{exact:true}).check();await page.getByRole('button',{name:'Confirm shared session reference',exact:true}).click();await page.getByRole('heading',{name:'Confirmed shared session reference',exact:true}).waitFor();expect((await port.snapshot(new AbortController().signal))!.notes.wardrobe.value).toBe('Owned: Navy blazer');
  const confirmedURL=await page.locator('.confirmed-reference img').getAttribute('src');expect(confirmedURL).toMatch(/^blob:/);await page.getByRole('button',{name:'Enlarge shared reference',exact:true}).click();await page.getByRole('dialog',{name:'Enlarged shared clothing reference',exact:true}).waitFor();await page.evaluate(()=>document.dispatchEvent(new Event('fixture-shared-refresh')));await page.getByText('Shared sample notes are current.',{exact:true}).waitFor();expect(await page.getByRole('dialog',{name:'Enlarged shared clothing reference',exact:true}).isVisible()).toBe(true);await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement?.textContent)).toBe('Close shared reference');await page.getByRole('button',{name:'Close shared reference',exact:true}).click();
  const check=page.getByRole('button',{name:'Check shared illustrated sample',exact:true});
  await check.click();await page.getByRole('button',{name:'Save shared sample look',exact:true}).waitFor();
  hold=true;started=false;const partial=run.stream('Long sleeves');await (await import('vitest')).vi.waitFor(()=>expect(started).toBe(true));
  await page.getByText('Simulated speech is being checked. The earlier sample is hidden; you can edit notes or clear this session.',{exact:true}).waitFor();
  expect(await check.isDisabled()).toBe(true);expect(await page.getByRole('button',{name:'Save shared sample look',exact:true}).count()).toBe(0);expect(await page.locator('.confirmed-reference img').getAttribute('src')).toBe(confirmedURL);expect(await candidate.snapshot(new AbortController().signal)).toBeNull();
  finish();expect((await partial).status).toBe('applied');hold=false;
  await panel.locator('dd').filter({hasText:'Long sleeves'}).getByText('To confirm',{exact:true}).waitFor();expect(await check.isDisabled()).toBe(true);expect(x.context.sampleInputReady()).toBe(false);
  expect((await run.stream('Long sleeves',true)).status).toBe('applied');await panel.locator('dd').filter({hasText:'Long sleeves'}).getByText('To confirm',{exact:true}).waitFor();expect(x.context.sampleInputReady()).toBe(true);await page.getByRole('button',{name:'Confirm style',exact:true}).click();await panel.locator('dd').filter({hasText:'Long sleeves'}).getByText('Confirmed',{exact:true}).waitFor();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Check shared illustrated sample'&&!b.disabled));
  expect(await page.getByRole('button',{name:'Save shared sample look',exact:true}).count()).toBe(0);await check.click();await page.getByRole('button',{name:'Save shared sample look',exact:true}).waitFor();expect(await page.locator('.confirmed-reference img').getAttribute('src')).toBe(confirmedURL);
  await page.getByRole('button',{name:'Save shared sample look',exact:true}).click();await page.getByText('Checked illustration copied to separate sample memory. No notes or photo were saved.',{exact:true}).waitFor();
  illustrations.setOutcome('unknown');await check.click();await page.getByText('Shared sample needs fresh checks.',{exact:true}).waitFor();expect(await page.getByRole('button',{name:'Save shared sample look',exact:true}).count()).toBe(0);
  illustrations.setOutcome('pass');illustrations.facts.mockRejectedValueOnce(Error('Synthetic catalog unavailable'));await check.click();await page.getByText('No current checked shared sample.',{exact:true}).waitFor();expect(await page.getByRole('button',{name:'Save shared sample look',exact:true}).count()).toBe(0);expect(await page.locator('.confirmed-reference img').getAttribute('src')).toBe(confirmedURL);
  await check.click();await page.getByRole('button',{name:'Save shared sample look',exact:true}).waitFor();
  hold=true;started=false;const late=run.stream('Old words that must disappear');await (await import('vitest')).vi.waitFor(()=>expect(started).toBe(true));await page.getByText('Simulated speech is being checked. The earlier sample is hidden; you can edit notes or clear this session.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Clear session notes',exact:true}).click();await page.getByText('Shared sample notes are current.',{exact:true}).waitFor();finish();expect((await late).status).toBe('stale');
  expect(await page.getByText('Not specified',{exact:true}).count()).toBe(7);expect(await page.locator('.confirmed-reference').count()).toBe(0);expect(await page.getByRole('button',{name:'Save shared sample look',exact:true}).count()).toBe(0);
  await page.getByRole('button',{name:'Saved looks',exact:true}).click();await page.getByRole('button',{name:'Reopen Shared illustrated sample (sample 2)',exact:true}).waitFor();await page.getByRole('button',{name:'Stylist',exact:true}).click();expect(await page.getByText('Not specified',{exact:true}).count()).toBe(7);
  for(const stream of inputStreams)stream.end();await page.getByText('Simulated input connection is unavailable. Earlier samples are hidden.',{exact:true}).waitFor();expect(await check.isDisabled()).toBe(true);await page.getByRole('button',{name:'Refresh shared notes',exact:true}).click();await page.getByText('Shared sample notes are current.',{exact:true}).waitFor();expect(await check.isDisabled()).toBe(true);expect(await page.getByText('Simulated input connection is unavailable. Earlier samples are hidden.',{exact:true}).isVisible()).toBe(true);expect(inputConnections).toBe(1);expect(await page.getByRole('button',{name:'Save shared sample look',exact:true}).count()).toBe(0);
  await page.getByRole('button',{name:'End sample session',exact:true}).click();await page.getByText('Shared sample session ended locally.',{exact:true}).waitFor();
  const count=(await x.f.x.inspect()).requests.length;expect(count).toBeLessThanOrEqual(128);expect(await x.records()).toHaveLength(0);process.stdout.write(JSON.stringify({scope:'shared-transcript-failure-browser',authorityRecords:count,authorityRecordCap:128,protectedOutputs:0})+'\n');expect(errors).toEqual([]);expect(external).toEqual([]);expect(await page.evaluate(()=>localStorage.length+sessionStorage.length)).toBe(0);candidate.close();await context.close();
 }finally{await browser?.close();await server?.close();await x.close();}
},120000);
