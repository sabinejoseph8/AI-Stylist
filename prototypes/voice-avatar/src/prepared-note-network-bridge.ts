import type {Server} from 'node:http';
import type {PreviewConfig} from './preview-gate.ts';
import {attachSimulatedNoteBridge} from './note-network-bridge.ts';
import {createPreparedNoteProviderSession} from './prepared-note-provider-session.ts';
import type {SimulatedExtractionFetch} from './note-extraction-transport.ts';
import type {SimulatedTranscriptionSocket} from './transcription-socket-wire.ts';
import {NotebookState} from './notebook-state.ts';
/** Explicit disabled harness attachment. The application server never calls it.
 * Transport creation must supply simulations; no keys, fetch or sockets default. */
export function attachPreparedSimulatedNoteBridge(server:Server,options:{simulation?:boolean;preview:PreviewConfig;createTransports:()=>{socket:SimulatedTranscriptionSocket;fetch:SimulatedExtractionFetch}}){
 if(options.simulation!==true)throw Error('Live prepared notebook bridge is disabled.');
 return attachSimulatedNoteBridge(server,{simulation:true,preview:options.preview,deferReady:true,create:(publish,capture,turnReady,ended,ready)=>{
  const notebook=new NotebookState(),transports=options.createTransports();
  const session=createPreparedNoteProviderSession({simulation:true,...transports,signal:new AbortController().signal,notebook,capture,turnReady,stopped:ended,ready,changed:receipt=>publish(notebook.snapshot(),receipt),invalidated:()=>publish(notebook.snapshot(),null)});
  const probe=session.probe;
  publish(notebook.snapshot(),null);
  return{
   audio:probe.audio.bind(probe),edit:probe.edit.bind(probe),confirm:probe.confirm.bind(probe),beginTurn:probe.beginTurn.bind(probe),commit:probe.commit.bind(probe),acknowledgeRendered:probe.acknowledgeRendered.bind(probe),receive:probe.receive.bind(probe),
   end:session.end,disconnected:session.end,
   // The socket binding owns its own cleanup result. Preserve it in the scope's
   // view so failed cleanup cannot release the single-session lease.
   snapshot:()=>{const snapshot=probe.snapshot();return session.status().cleanupFailed?{...snapshot,reason:'cleanup-unverified'}:snapshot;}
  };
 }});
}
