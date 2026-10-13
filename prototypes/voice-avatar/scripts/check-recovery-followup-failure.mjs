// Local synthetic media and HTTP only. This does not verify real Daily or devices.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {createServer} from 'vite';
const require=createRequire(import.meta.url),{webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=resolve(import.meta.dirname,'..');
const server=await createServer({configFile:false,root,resolve:{alias:[{find:'@daily-co/daily-js',replacement:resolve(root,'tests/browser/recovery-daily.js')},{find:/\.\/streaming-microphone\.ts$/,replacement:resolve(root,'tests/browser/recovery-microphone.js')}]},server:{host:'127.0.0.1',port:0}});
await server.listen();let browser;
try{
 browser=await webkit.launch({headless:true,...(process.env.WEBKIT_EXECUTABLE?{executablePath:process.env.WEBKIT_EXECUTABLE}:{})});const page=await browser.newPage({viewport:{width:390,height:844}});const actions=[];let turns=0,room=1,roomState='idle';
 await page.addInitScript(()=>{
  window.recoveryFixture={created:0,destroyed:0,messages:[],consume:null,allowEndWithoutInterrupt:true};
  window.MediaStream=class {constructor(tracks){this.tracks=tracks;}getAudioTracks(){return this.tracks;}getVideoTracks(){return this.tracks;}};
  Object.defineProperty(HTMLMediaElement.prototype,'srcObject',{get(){return this.testStream||null;},set(value){this.testStream=value;}});
  HTMLMediaElement.prototype.play=async function(){};HTMLMediaElement.prototype.pause=function(){};
  window.emitSpeech=(interrupt=false)=>{const f=window.recoveryFixture;for(let n=0;n<(interrupt?3:33);n++){const pcm=new ArrayBuffer(960);if(n<3){const view=new DataView(pcm);for(let i=0;i<480;i++)view.setInt16(i*2,5000,true);}f.consume?.(pcm);}};
 });
 await page.route('**/api/**',async route=>{
  const request=route.request(),action=new URL(request.url()).pathname.split('/').at(-1);actions.push(action);
  let body={};if(action==='status')body=request.url().includes('/recovery/')?{state:roomState,remainingSeconds:60,turns,turnLimit:3,message:'synthetic'}:{instanceId:'synthetic'};
  else if(action==='allowance')body={available:room===1&&turns===0};
  else if(action==='start'){roomState='ready';}
  else if(action==='connect'){roomState='connected';body={conversationId:'synthetic-'+room,url:'https://synthetic.invalid',token:'fake'};}
  else if(action==='turn'){if(turns===1){await route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'synthetic-private-provider-body'})});return;}turns++;body={id:'reply-'+turns,pcm:Buffer.alloc(96000).toString('base64'),transcript:'synthetic reply '+turns};}
  else if(action==='confirm')body={state:'connected',turns};
  else if(action==='replace'){if(await page.evaluate(()=>window.recoveryFixture.destroyed)!==1)throw Error('Replacement before local destruction');room=2;roomState='ready';}
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 const address=server.httpServer.address();await page.goto(`http://127.0.0.1:${address.port}/recovery.html`);
 await page.getByRole('heading',{name:'Read all steps before starting'}).waitFor();
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
 await page.screenshot({path:'/private/tmp/ai-stylist-recovery-mobile.png',fullPage:true});
 await page.getByRole('button',{name:'Start private voice test'}).click();await page.getByRole('button',{name:'Start microphone'}).click();
 await page.evaluate(()=>window.emitSpeech());await page.getByRole('button',{name:'I heard the whole reply'}).waitFor({state:'visible'});await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='I heard the whole reply'&&!b.disabled));
 await page.getByRole('button',{name:'I heard the whole reply'}).click();
 await page.evaluate(()=>window.emitSpeech());
 await page.getByText('The reply request failed before playback began. Microphone and playback are off. Do not retry. Report this message.',{exact:true}).waitFor();
 await page.waitForFunction(()=>window.recoveryFixture.destroyed===1);
 if(!await page.evaluate(()=>document.querySelector('audio').srcObject===null&&document.querySelector('video').srcObject===null))throw Error('Media retained');
 if(actions.includes('replace')||actions.filter(a=>a==='turn').length!==2||!actions.includes('end'))throw Error('Unexpected retry/replacement or absent cleanup');
 if((await page.locator('body').innerText()).includes('synthetic-private-provider-body'))throw Error('Provider error exposed');
 console.log('Synthetic WebKit confirmed-follow-up failure: fixed request-stage message, media cleanup, no retry/replacement or private body exposure.');
}finally{await browser?.close();await server.close();}
