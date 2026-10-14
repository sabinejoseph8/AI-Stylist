export const LOCAL_DIAGNOSTIC_CODES=['session-warning','session-disconnected','session-reconnected','session-cleared','session-ended','session-expired','cleanup-complete','cleanup-failed'] as const;
export type LocalDiagnosticCode=typeof LOCAL_DIAGNOSTIC_CODES[number];
/** Bounded counters only, in memory. No timestamps, identifiers, payloads,
 * persistence, console logging, network or arbitrary error-string channel. */
export class LocalDiagnostics {
 private counts=new Map<LocalDiagnosticCode,number>();
 record(code:unknown){if(typeof code!=='string'||!LOCAL_DIAGNOSTIC_CODES.includes(code as LocalDiagnosticCode))return false;const key=code as LocalDiagnosticCode;this.counts.set(key,Math.min(255,(this.counts.get(key)??0)+1));return true;}
 snapshot(){return Object.freeze(Object.fromEntries(LOCAL_DIAGNOSTIC_CODES.map(code=>[code,this.counts.get(code)??0])) as Record<LocalDiagnosticCode,number>);}
 clear(){this.counts.clear();}
}
