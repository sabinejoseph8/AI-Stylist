import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import worker from '../worker/index.js';
class Bucket{value=null;etag=0;async get(){return this.value?{etag:String(this.etag),json:async()=>JSON.parse(this.value)}:null}async put(k,v,o){if(o.onlyIf.etagMatches!==undefined&&o.onlyIf.etagMatches!==String(this.etag)||o.onlyIf.etagDoesNotMatch==='*'&&this.value)return null;this.value=v;this.etag++;return {etag:String(this.etag)}}}
const req=(path='/api/plan',options={})=>new Request('https://memory.example'+path,options);
const auth={'oai-authenticated-user-id':'synthetic-owner'};
const change=(args,extra={})=>req('/api/plan',{method:'PATCH',headers:{...auth,'Content-Type':'application/json',Origin:'https://memory.example',...extra},body:JSON.stringify(args)});
const args={id:'1a',done:false,evidence:'Synthetic reopening for a test.',expectedRevision:0};
test('all four document panels and assets serve',async()=>{for(let path of ['/','/style.css','/app.js','/api/documents','/source/plan.md'])assert.equal((await worker.fetch(req(path))).status,200);let html=await(await worker.fetch(req('/'))).text();for(let tab of ['product','design','tech','plan'])assert.ok(html.includes('panel-'+tab))});
test('full sources and parsed design content are retained',async()=>{let d=await(await worker.fetch(req('/api/documents'))).json();assert.equal(d.tasks.length,41);assert.equal(d.palette.length,13);assert.equal(d.phases.length,8);for(let doc of Object.values(d.docs))assert.ok(doc.markdown.length>1000)});
test('unauthenticated task read and write are rejected',async()=>{assert.equal((await worker.fetch(req())).status,401);assert.equal((await worker.fetch(change(args,{'oai-authenticated-user-id':''}))).status,401)});
test('missing bucket is readable but disables updates',async()=>{let r=await(await worker.fetch(req('/api/plan',{headers:auth}))).json();assert.equal(r.storageReady,false);assert.equal((await worker.fetch(change(args))).status,503)});
test('source state is preserved without overrides',async()=>{let r=await(await worker.fetch(req('/api/plan',{headers:auth}),{BUCKET:new Bucket()})).json();assert.equal(r.tasks.filter(t=>t.done).length,r.tasks.filter(t=>t.sourceDone).length);assert.equal(r.tasks.find(t=>t.id==='1b').done,false)});
test('successful update persists and increments revision',async()=>{let env={BUCKET:new Bucket()};let r=await(await worker.fetch(change(args),env)).json();assert.equal(r.revision,1);assert.equal(r.tasks.find(t=>t.id==='1a').done,false);let again=await(await worker.fetch(req('/api/plan',{headers:auth}),env)).json();assert.equal(again.revision,1);assert.equal(again.tasks.find(t=>t.id==='1a').evidence,args.evidence)});
test('stale revision cannot overwrite existing record',async()=>{let env={BUCKET:new Bucket()};await worker.fetch(change(args),env);assert.equal((await worker.fetch(change({...args,done:true}),env)).status,409)});
test('simultaneous saves preserve only one version',async()=>{let env={BUCKET:new Bucket()};let out=await Promise.all([worker.fetch(change(args),env),worker.fetch(change({...args,id:'1b'}),env)]);assert.deepEqual(out.map(r=>r.status).sort(),[200,409])});
test('invalid fields, missing evidence and unknown IDs rejected',async()=>{for(let patch of [{id:'fake'},{evidence:' '},{done:'true'},{expectedRevision:-1},{extra:'bad'},{evidence:'x'.repeat(1201)}])assert.equal((await worker.fetch(change({...args,...patch}),{BUCKET:new Bucket()})).status,400)});
test('cross-origin browser mutations rejected',async()=>{for(let headers of [{Origin:'https://other.example'},{Origin:''},{'Sec-Fetch-Site':'cross-site'}])assert.equal((await worker.fetch(change(args,headers),{BUCKET:new Bucket()})).status,403)});
test('old snapshot override never silently changes a new task',async()=>{let b=new Bucket();b.value=JSON.stringify({revision:1,tasks:{'1b':{done:true,sourceHash:'old',evidence:'Old source'}}});let r=await(await worker.fetch(req('/api/plan',{headers:auth}),{BUCKET:b})).json();assert.equal(r.tasks.find(t=>t.id==='1b').done,false)});
test('MCP discovery and tool list require no private record access',async()=>{for(let method of ['server/discover','tools/list']){let r=await(await worker.fetch(req('/mcp',{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:1,method})}))).json();assert.ok(r.result)} });
test('MCP data tools enforce identity',async()=>{let r=await(await worker.fetch(req('/mcp',{method:'POST',body:JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'list_plan_tasks'}})}))).json();assert.equal(r.result.isError,true)});
test('MCP update uses same durable evidence rules',async()=>{let env={BUCKET:new Bucket()};let r=await(await worker.fetch(req('/mcp',{method:'POST',headers:auth,body:JSON.stringify({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'update_plan_task',arguments:args}})}),env)).json();assert.equal(r.result.isError,false);assert.equal(JSON.parse(r.result.content[0].text).revision,1)});
test('unknown routes and malformed or oversized JSON fail safely',async()=>{assert.equal((await worker.fetch(req('/missing'))).status,404);for(let b of ['{','x'.repeat(9000)]){let r=await worker.fetch(req('/api/plan',{method:'PATCH',headers:{...auth,Origin:'https://memory.example','Content-Type':'application/json'},body:b}),{BUCKET:new Bucket()});assert.ok([400,413].includes(r.status))}});

test('visible current evidence stays aligned with the imported plan summary',async()=>{
 const d=await(await worker.fetch(req('/api/documents'))).json();
 const expected=d.docs.plan.markdown.match(/^## Summary\s*\n+([\s\S]*?)(?=\n\s*\n|$)/m)?.[1].trim();
 assert.ok(expected);assert.equal(d.currentCheckpoint,expected);
 const script=await(await worker.fetch(req('/app.js'))).text(),start=script.indexOf('function tech()');
 const source=script.slice(start,script.indexOf('async ',start));
 const marker='Updated evidence <script>unsafe</script>';
 const rendered=runInNewContext(source+';tech()', {docs:{currentCheckpoint:marker},hero:()=>'',heading:()=>'',banner:t=>t,table:()=>'',svgDiagram:()=>'',archive:()=>'',esc:t=>String(t).replaceAll('<','&lt;').replaceAll('>','&gt;')});
 assert.ok(rendered.includes('Updated evidence &lt;script&gt;unsafe&lt;/script&gt;'));assert.ok(!rendered.includes(marker));
});
