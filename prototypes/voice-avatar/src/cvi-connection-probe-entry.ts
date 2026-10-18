import Daily from '@daily-co/daily-js';
import type {DailyCall} from '@daily-co/daily-js';
import './cvi-connection-probe.css';
import {probeCleanupMessage} from './cvi-probe-diagnostics.ts';
import type {ProbeStopReason} from './cvi-probe-diagnostics.ts';
import {createProbeMediaPresenter} from './cvi-probe-media.ts';
const root=document.querySelector<HTMLElement>('#app')!;
root.innerHTML=`<p class="eyebrow">AI STYLIST · PRIVATE CONNECTION PROBE</p><h1>Voice connection check</h1><p>One room · Five included minutes maximum · $0 additional charges</p><section><h2>Read before starting</h2><p>This AI avatar gives the same neutral reply each time. It does not give styling advice, update your notebook or recommend products.</p><p>Your microphone audio goes to Tavus and its media and voice providers under their retention terms. Camera access is disabled. The app does not save a recording or transcript. Ending does not prove provider deletion or final billing.</p><ol><li>Stay on this page in a quiet room. Close other voice calls.</li><li>Press Start once and allow the microphone. Setup counts toward the time limit.</li><li>Say “This is a connection test.” Listen for the neutral reply and watch the avatar.</li><li>Speak again while the avatar is talking. Observe whether it stops; buffered sound may still play.</li><li>Press End. Check that the microphone indicator turns off. Report what you heard and saw.</li></ol><p>Do not refresh, close or switch tabs during the check. Leaving ends it and consumes the sole start. No automatic retry is available.</p><label><input id="consent" type="checkbox"> I understand these limits and consent to sending this test voice and text to the stated providers.</label></section><section><p id="status" role="status" aria-live="polite">Checking availability. No microphone has started.</p><video id="avatar" autoplay playsinline muted aria-label="AI avatar video"></video><audio id="voice" autoplay></audio><div class="actions"><button id="start" disabled>Start connection probe</button><button id="end" disabled>End</button></div></section>`;
const status=root.querySelector<HTMLElement>('#status')!,start=root.querySelector<HTMLButtonElement>('#start')!,end=root.querySelector<HTMLButtonElement>('#end')!,consent=root.querySelector<HTMLInputElement>('#consent')!,video=root.querySelector<HTMLVideoElement>('#avatar')!,audio=root.querySelector<HTMLAudioElement>('#voice')!;
let available=false,used=false,finished=false,ownerToken='',call:DailyCall|null=null,heartbeat:ReturnType<typeof setInterval>|undefined,deadline:ReturnType<typeof setTimeout>|undefined;
const presenter=createProbeMediaPresenter({stream:track=>new MediaStream([track]),active:()=>!finished,failure:kind=>{void stop(kind==='audio'?'Audio playback could not start. The probe stopped.':'Video playback could not start. The probe stopped.',kind==='audio'?'audio-playback-failed':'video-playback-failed');}});
const update=()=>{start.disabled=!available||used||!consent.checked;};consent.addEventListener('change',update);
async function command(path:string,reason:ProbeStopReason='user-ended'){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const response=await fetch('/api/connection-probe/'+path,{method:'POST',headers:{'Content-Type':'application/json',...(ownerToken?{'X-Probe-Owner':ownerToken}:{}),...(path==='end'?{'X-Probe-Stop-Reason':reason}:{})},body:'{}',cache:'no-store',credentials:'same-origin',signal:controller.signal,keepalive:path==='end'});if(!response.ok)throw Error();return await response.json();}finally{clearTimeout(timer);}}
function localOff(){
 presenter.clear();
 clearInterval(heartbeat);clearTimeout(deadline);heartbeat=undefined;deadline=undefined;
 for(const element of [video,audio]){const media=element.srcObject;if(media instanceof MediaStream)for(const track of media.getTracks())track.stop();element.pause();element.srcObject=null;}
 const current=call;call=null;if(current)shutdown(current);
}
function shutdown(current:DailyCall){
 try{const local=current.participants().local;for(const track of [local?.tracks.audio?.persistentTrack,local?.tracks.video?.persistentTrack])track?.stop();current.setLocalAudio(false);}catch{}
 void current.destroy().catch(()=>{});
}
async function stop(message='The probe ended. Check that your microphone indicator is off.',reason:ProbeStopReason='user-ended'){
 if(finished)return;finished=true;end.disabled=true;start.disabled=true;localOff();status.textContent=message;
 if(ownerToken)try{const result=await command('end',reason);status.textContent=probeCleanupMessage(message,result.state==='ended');}catch{status.textContent=probeCleanupMessage(message,false);}
 ownerToken='';
}
function renderRemote(){if(!call||finished)return;for(const participant of Object.values(call.participants())){if(participant.local)continue;const v=participant.tracks.video?.persistentTrack,a=participant.tracks.audio?.persistentTrack;if(v)presenter.present(video,v,'video');if(a)presenter.present(audio,a,'audio');}}
start.addEventListener('click',()=>{void(async()=>{
 if(!available||used||!consent.checked)return;used=true;update();end.disabled=false;consent.disabled=true;status.textContent='Starting the sole probe. Please keep this page visible.';deadline=setTimeout(()=>{void stop(undefined,'deadline-ended');},270000);
 let startupStage:ProbeStopReason='start-request-failed';
 try{
  const result=await command('start');ownerToken=result.ownerToken;
  if(finished){if(ownerToken)try{await command('end');}catch{}ownerToken='';return;}
  if(typeof result.url!=='string'||typeof result.token!=='string'||typeof ownerToken!=='string')throw Error();
  startupStage='daily-join-failed';call=Daily.createCallObject({audioSource:true,videoSource:false});call.on('participant-updated',renderRemote).on('track-started',renderRemote).on('left-meeting',()=>{void stop(undefined,'left-meeting');}).on('error',()=>{void stop('The connection failed. No retry is available.','client-error');});
  heartbeat=setInterval(()=>{void command('heartbeat').catch(()=>{void stop('The connection stopped. No retry is available.','heartbeat-failed');});},5000);
  const joiningCall=call;await joiningCall.join({url:result.url,token:result.token,startVideoOff:true,startAudioOff:false});if(finished||call!==joiningCall){shutdown(joiningCall);return;}status.textContent='Connected. Say “This is a connection test.” The avatar uses fixed neutral replies.';renderRemote();
 }catch{void stop('The connection could not complete. No retry is available.',startupStage);}
})();});
end.addEventListener('click',()=>{void stop();});
document.addEventListener('visibilitychange',()=>{if(used&&document.hidden)void stop('Leaving the page ended the probe. No retry is available.','page-hidden');});
window.addEventListener('pagehide',()=>{if(used)void stop(undefined,'page-left');});
void fetch('/api/connection-probe/status',{cache:'no-store',credentials:'same-origin'}).then(async response=>{if(!response.ok)throw Error();return response.json();}).then(result=>{available=result.available===true;status.textContent=available?'One approved connection-only probe is available. No microphone has started.':'The connection probe is unavailable. No microphone has started.';update();}).catch(()=>{status.textContent='The connection probe is unavailable. No microphone has started.';});
