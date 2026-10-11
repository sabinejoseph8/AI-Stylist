/** Inspection-only candidate. No socket, credentials or live activation path. */
export const TRANSCRIPTION_CONNECTION_PLAN=Object.freeze({
 version:1,
 url:'wss://api.openai.com/v1/realtime?model=gpt-live-transcribe',
 model:'gpt-live-transcribe',
 authentication:'server-bearer-header',
 startupEvidence:'ai-assisted-support-proposal',
 expectedInitialEvent:'session.created',
 configurationEvent:'session.update',
 readinessEvent:'session.updated',
 delay:'low',
 turnCorrelation:'item_id',
 liveEnabled:false,
 startupVerified:false,
 remoteCleanupVerified:false,
} as const);

export type CloseEvidence=Readonly<{
 transportClosed:boolean;normalCloseObserved:boolean;
 remoteCleanupVerified:false;finalUsageVerified:false;deletionVerified:false;
 mayReleaseAllowance:false;
}>;
/** Local observation only, deliberately incapable of authorizing allowance closure.
 * A close event is neither provider deletion proof nor confirmed final usage.
 * Malformed, wrong-owner, premature and repeated events add no evidence. */
export class PreparedTranscriptionCloseEvidence{
 private connectionId:string;
 private requested=false;
 private observed=false;
 private normal=false;
 constructor(connectionId:string,options:{simulation?:boolean}){
  if(options.simulation!==true)throw Error('Live close observation is disabled.');
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(connectionId))throw Error('Invalid connection identity.');
  this.connectionId=connectionId;
 }
 requestClose(){this.requested=true;}
 observe(value:unknown):boolean{
  if(!this.requested||this.observed||!value||typeof value!=='object'||Array.isArray(value))return false;
  const event=value as Record<string,unknown>;
  if(Object.keys(event).sort().join(',')!=='code,connectionId,type,wasClean'||event.type!=='close'||event.connectionId!==this.connectionId||typeof event.wasClean!=='boolean'||!Number.isInteger(event.code)||Number(event.code)<1000||Number(event.code)>4999)return false;
  this.observed=true;this.normal=event.code===1000&&event.wasClean;
  return true;
 }
 snapshot():CloseEvidence{return Object.freeze({transportClosed:this.observed,normalCloseObserved:this.normal,remoteCleanupVerified:false,finalUsageVerified:false,deletionVerified:false,mayReleaseAllowance:false});}
}
