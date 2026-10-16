/** Local timing arithmetic only. No activation, renewal or output permission.
 * Caller-owned consultation expiry stays absolute; writer leases stay <=8s.
 * These are requested upper bounds. A verified backend grant may be shorter. */
export function planLocalCviLifetimes(input:Readonly<{
 startedAt:number;issuedAt:number;consultationExpiresAt:number;startupDeadlineMs:number;writerLeaseMs?:number;
}>){
 const int=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
 if(!input||Object.keys(input).some(k=>!['startedAt','issuedAt','consultationExpiresAt','startupDeadlineMs','writerLeaseMs'].includes(k))||!int(input.startedAt)||!int(input.issuedAt)||input.issuedAt<input.startedAt||!int(input.consultationExpiresAt)||!int(input.startupDeadlineMs)||input.startupDeadlineMs<1||input.startupDeadlineMs>8000||input.writerLeaseMs!==undefined&&(!int(input.writerLeaseMs)||input.writerLeaseMs<1||input.writerLeaseMs>8000)||!int(input.startedAt+input.startupDeadlineMs))throw Error('Local lifetime plan unavailable');
 const startupExpiresAt=Math.min(input.consultationExpiresAt,input.startedAt+input.startupDeadlineMs);
 // Omitted configuration retains the original RPC-bound lease behavior.
 const requested=input.writerLeaseMs===undefined?startupExpiresAt:input.issuedAt+input.writerLeaseMs;
 if(!int(requested)||input.issuedAt>=startupExpiresAt||requested<=input.issuedAt)throw Error('Local lifetime plan unavailable');
 const requestedLeaseExpiresAt=Math.min(input.consultationExpiresAt,requested);
 return Object.freeze({startupExpiresAt,requestedLeaseExpiresAt,consultationExpiresAt:input.consultationExpiresAt,renewalRequiredByRequest:requestedLeaseExpiresAt<input.consultationExpiresAt,permissions:Object.freeze({activate:false,renew:false,write:false,sign:false,resume:false})});
}
