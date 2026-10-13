import type {Server} from 'node:http';
import {attachSimulatedNoteBridge} from './note-network-bridge.ts';
import {preparePrivateNotesTrialOwner} from './private-notes-trial-owner.ts';
import type {NoteConnectionProbe} from './note-connection-scope.ts';
import {NoteTiming} from './note-timing.ts';
type Options=Parameters<typeof preparePrivateNotesTrialOwner>[0];
type Active=Extract<Awaited<ReturnType<ReturnType<typeof preparePrivateNotesTrialOwner>['start']>>,{status:200}>;
/** Local simulation attachment only. Uses the existing simulation URL and maps
 * its already checked request into the private-trial owner. Fixture consent is
 * not customer consent or live activation. Not imported by server.ts/CLI. */
export function attachPreparedPrivateNotesTrialBridge(server:Server,options:{simulation?:boolean;fixtureConsent?:boolean;preview:Options['preview'];allowance:Options['allowance'];createTransports:(capture:Parameters<Parameters<typeof attachSimulatedNoteBridge>[1]['create']>[1],reservationId:string)=>ReturnType<Options['createTransports']>}){
 if(options.simulation!==true||options.fixtureConsent!==true)throw Error('Private notes trial bridge is disabled.');
 let owner:ReturnType<typeof preparePrivateNotesTrialOwner>|undefined;
 const bridge=attachSimulatedNoteBridge(server,{simulation:true,preview:options.preview,deferReady:true,create:(publish,capture,turnReady,ended,ready,req)=>{
  const abort=new AbortController();let active:Active|undefined,stopping=false,finished=false;
  const settled=()=>{if(finished)return;finished=true;ended();};
  const stop=()=>{stopping=true;abort.abort();if(active)void active.end();};
  owner=preparePrivateNotesTrialOwner({simulation:true,preview:options.preview,allowance:options.allowance,createTransports:reservationId=>options.createTransports(capture,reservationId),publish,turnReady,stopped:settled});
  void owner.start({method:req.method??'',path:'/api/private-notes-trial-preparation',host:req.headers.host??'',origin:req.headers.origin??'',authorization:req.headers.authorization,consent:true,signal:abort.signal}).then(async result=>{
   if(result.status!==200){settled();return;}active=result;if(stopping){await active.end();return;}publish(active.snapshot(),null);ready();
  },()=>{stop();settled();});
  const pending={ended:false,reason:null,capturing:false,acquiring:true,transcription:null,notes:{accepted:0,rejected:0,applied:0,failures:0,extracting:false,queued:false,timing:new NoteTiming().report()},liveEnabled:false as const};
  const facade:NoteConnectionProbe={
   audio:frame=>!stopping&&Boolean(active?.audio(frame)),edit:(...args)=>!stopping&&Boolean(active?.edit(...args)),confirm:(...args)=>!stopping&&Boolean(active?.confirm(...args)),
   beginTurn:async id=>!stopping&&Boolean(await active?.beginTurn(id)),commit:()=>!stopping&&Boolean(active?.commitTurn()),acknowledgeRendered:receipt=>!stopping&&Boolean(active?.acknowledgeRendered(receipt)),
   receive:()=>false,end:stop,disconnected:stop,
   snapshot:()=>({...active?.probeSnapshot()??pending,ended:finished,reason:finished?'cleanup-unverified':active?.probeSnapshot().reason??null}),
  };return facade;
 }});
 return{dispose:bridge.dispose,snapshot:()=>({...bridge.snapshot(),allowanceState:owner?.status().state??'idle'})};
}
