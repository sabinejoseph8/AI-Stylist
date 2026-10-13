/** Fixed, content-free startup codes. Never accept free-form provider messages,
 * URLs, session IDs, request IDs, credentials or customer content as diagnostics. */
export const NOTE_STARTUP_CODES=[
 'owner-reserved','owner-authorized','owner-transports-ready','owner-ready','owner-reservation-held','owner-startup-held',
 'provider-connecting','provider-open','provider-connect-failed','provider-opening-timeout','provider-transport-error','provider-closed',
 'provider-handshake-400','provider-handshake-401','provider-handshake-403','provider-handshake-404','provider-handshake-429','provider-handshake-500','provider-handshake-other',
 'provider-first-created','provider-first-unexpected','provider-invalid-packet',
 'provider-error-authentication','provider-error-permission','provider-error-rate-limit','provider-error-invalid-request','provider-error-server','provider-error-other',
 'provider-code-invalid-value','provider-code-invalid-parameter','provider-code-unknown-parameter','provider-code-unsupported-parameter','provider-code-model-not-found',
 'provider-param-session-type','provider-param-session-model','provider-param-audio-input','provider-param-transcription-model','provider-param-transcription-languages','provider-param-transcription-delay','provider-param-turn-detection',
 'provider-param-missing','provider-param-null','provider-param-unrecognized','provider-param-malformed',
 'startup-created','startup-configuring','startup-ready','startup-opening-held','startup-timeout','startup-event-held','startup-configuration-held','startup-canceled','startup-ended','startup-held',
] as const;
export type NoteStartupCode=typeof NOTE_STARTUP_CODES[number];
export type NoteStartupDiagnostic=(code:NoteStartupCode)=>void;
export function boundedNoteStartupDiagnostic(sink?:NoteStartupDiagnostic):NoteStartupDiagnostic{
 let count=0;return code=>{if(count>=64||!NOTE_STARTUP_CODES.includes(code))return;count++;try{sink?.(code);}catch{/* Diagnostics cannot affect cleanup or authorize work. */}};
}
export function providerErrorDiagnostic(value:unknown):NoteStartupCode{
 const error=value&&typeof value==='object'?(value as {error?:unknown}).error:undefined;
 const type=error&&typeof error==='object'?(error as {type?:unknown}).type:undefined;
 switch(type){case 'authentication_error':return 'provider-error-authentication';case 'permission_error':return 'provider-error-permission';case 'rate_limit_error':return 'provider-error-rate-limit';case 'invalid_request_error':return 'provider-error-invalid-request';case 'server_error':return 'provider-error-server';default:return 'provider-error-other';}
}

/** Exact allowlists only. A free-form message/code/parameter is never logged. */
export function providerErrorDetails(value:unknown):NoteStartupCode[]{
 if(!value||typeof value!=='object'||Array.isArray(value))return[];
 const error=(value as {error?:unknown}).error;
 if(!error||typeof error!=='object'||Array.isArray(error))return[];
 const {code,param}=error as {code?:unknown;param?:unknown};
 const codes:Record<string,NoteStartupCode>={'invalid_value':'provider-code-invalid-value','invalid_parameter':'provider-code-invalid-parameter','unknown_parameter':'provider-code-unknown-parameter','unsupported_parameter':'provider-code-unsupported-parameter','model_not_found':'provider-code-model-not-found'};
 const params:Record<string,NoteStartupCode>={'session.type':'provider-param-session-type','session.model':'provider-param-session-model','session.audio.input':'provider-param-audio-input','session.audio.input.transcription.model':'provider-param-transcription-model','session.audio.input.transcription.languages':'provider-param-transcription-languages','session.audio.input.transcription.delay':'provider-param-transcription-delay','session.audio.input.turn_detection':'provider-param-turn-detection'};
 // Preserve only the shape of an unavailable name. Unknown strings and values
 // never leave this function, including their length, spelling or contents.
 const parameter:NoteStartupCode=!Object.hasOwn(error,'param')?'provider-param-missing':param===null?'provider-param-null':typeof param!=='string'?'provider-param-malformed':Object.hasOwn(params,param)?params[param]:'provider-param-unrecognized';
 return[typeof code==='string'&&Object.hasOwn(codes,code)?codes[code]:undefined,parameter].filter((item):item is NoteStartupCode=>item!==undefined);
}
