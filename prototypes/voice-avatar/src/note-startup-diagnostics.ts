/** Fixed, content-free startup codes. Never accept free-form provider messages,
 * URLs, session IDs, request IDs, credentials or customer content as diagnostics. */
export const NOTE_STARTUP_CODES=[
 'owner-reserved','owner-authorized','owner-transports-ready','owner-ready','owner-reservation-held','owner-startup-held',
 'provider-connecting','provider-open','provider-connect-failed','provider-opening-timeout','provider-transport-error','provider-closed',
 'provider-handshake-400','provider-handshake-401','provider-handshake-403','provider-handshake-404','provider-handshake-429','provider-handshake-500','provider-handshake-other',
 'provider-first-created','provider-first-unexpected','provider-invalid-packet',
 'provider-error-authentication','provider-error-permission','provider-error-rate-limit','provider-error-invalid-request','provider-error-server','provider-error-other',
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
