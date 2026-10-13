import {PreparedBrowserNoteSession} from './note-browser-session.ts';
import type {BrowserNoteCapture} from './note-browser-session.ts';
import {bindNoteBrowserLifecycle} from './note-browser-lifecycle.ts';
import type {NoteUpdate} from './note-update-wire.ts';
type Socket=EventTarget&{readyState:number;bufferedAmount:number;send:(value:string|ArrayBuffer)=>void;close:()=>void};
/** Explicit user-started connection only. No default WebSocket or microphone,
 * retries, credentials or persistence. activationEnabled is trusted page setup,
 * not a substitute for server authorization, consent and durable reservation. */
export function preparePrivateNotesTrialBrowser(options:{activationEnabled?:boolean;consent?:boolean;origin:string;connect:(url:string)=>Socket;capture:BrowserNoteCapture;page:EventTarget;visibility:EventTarget&{readonly hidden:boolean};changed:(notes:NoteUpdate|null)=>void;status:(status:ReturnType<PreparedBrowserNoteSession['status']>)=>void}){
 const unavailable=()=>Error('Private notebook connection is disabled.');
 if(options.activationEnabled!==true||options.consent!==true||options.visibility.hidden)throw unavailable();
 let url:URL;try{url=new URL(options.origin);if(url.protocol!=='https:'||!/^[a-z0-9-]+\.onrender\.com$/.test(url.hostname)||url.port||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw unavailable();}catch{throw unavailable();}
 const socket=options.connect(`wss://${url.host}/api/private-notes-trial`);
 let session:PreparedBrowserNoteSession|undefined,binding:ReturnType<typeof bindNoteBrowserLifecycle>|undefined,sent=false,disposed=false;
 const consent=()=>{if(disposed||sent||session?.snapshot().ended)return;sent=true;try{if(socket.readyState!==1||socket.bufferedAmount>65536)throw unavailable();socket.send(JSON.stringify({version:1,type:'consent',noticeVersion:'notes-private-trial-v1',accepted:true}));}catch{session?.disconnected();}};
 const dispose=()=>{if(disposed)return;disposed=true;socket.removeEventListener('open',consent);binding?.dispose();session?.stop();try{socket.close();}catch{/* Local state stays closed; no remote-cleanup claim. */}};
 try{
  session=new PreparedBrowserNoteSession({privateTrial:true,socket,capture:options.capture,changed:options.changed});
  binding=bindNoteBrowserLifecycle({privateTrial:true,session,socket,page:options.page,visibility:options.visibility,status:options.status});
  socket.addEventListener('open',consent,{once:true});if(socket.readyState===1)consent();
  return{session,dispose,snapshot:()=>({consentSent:sent,disposed,session:session!.snapshot()})};
 }catch{dispose();throw unavailable();}
}
