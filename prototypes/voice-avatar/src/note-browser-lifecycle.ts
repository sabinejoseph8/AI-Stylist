import type {PreparedBrowserNoteSession} from './note-browser-session.ts';

type Events=Pick<EventTarget,'addEventListener'|'removeEventListener'>;
type Session=Pick<PreparedBrowserNoteSession,'receive'|'hidden'|'disconnected'|'stop'|'status'|'snapshot'>;
/** Explicit simulated binding only. It creates no socket, device or provider.
 * The owner must dispose before replacing a session; no reconnect or replay. */
export function bindSimulatedNoteLifecycle(options:{simulation?:boolean;session:Session;socket:Events;page:Events;visibility:Events&{readonly hidden:boolean};status:(status:ReturnType<Session['status']>)=>void}){
 if(options.simulation!==true)throw Error('Live notebook lifecycle is disabled.');
 const {session,socket,page,visibility,status}=options;
 let disposed=false,last='';
 const listeners:Array<[Events,string,EventListener]>=[];
 let timer:ReturnType<typeof setInterval>|null=null;
 const detach=()=>{
   if(disposed)return;disposed=true;
   if(timer!==null)clearInterval(timer);timer=null;
   for(const [target,type,listener] of listeners)target.removeEventListener(type,listener);
   listeners.length=0;
 };
 const refresh=()=>{
   if(disposed)return;
   const value=session.status(),key=JSON.stringify(value);
   if(key!==last){last=key;try{status(value);}catch{session.stop('display');detach();return;}}
   if(session.snapshot().ended)detach();
 };
 const end=(hidden:boolean)=>{if(disposed)return;if(hidden)session.hidden();else session.disconnected();refresh();};
 const on=(target:Events,type:string,listener:EventListener)=>{target.addEventListener(type,listener);listeners.push([target,type,listener]);};
 try{
   on(socket,'message',event=>{
     if(disposed)return;
     // Browser text frames only. Never log a malformed frame or its contents.
     const data=(event as MessageEvent<unknown>).data;
     if(typeof data!=='string'||data.length>12000){end(false);return;}
     try{session.receive(JSON.parse(data));}catch{end(false);return;}refresh();
   });
   on(socket,'close',()=>end(false));on(socket,'error',()=>end(false));
   on(page,'pagehide',()=>end(true));
   on(visibility,'visibilitychange',()=>{if(visibility.hidden)end(true);});
   // Bounded helper already owns its 85s deadline. Poll only the redacted status
   // to include asynchronous permission results and internal deadline changes.
   timer=setInterval(refresh,50);
   if(visibility.hidden)session.hidden();refresh();
 }catch{
   session.stop();detach();throw Error('Notebook lifecycle setup failed.');
 }
 return{refresh,dispose:()=>{if(disposed)return;session.stop();refresh();detach();}};
}
