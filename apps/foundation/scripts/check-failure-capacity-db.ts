/** Disposable PostgreSQL and existing adapters only. No hosted Auth or provider. */
import {createConsultationSlot} from '../src/server/consultation-slot.ts';
import type {ConsultationLease} from '../src/server/consultation-slot.ts';
import {createAuthSessionAuthority} from '../src/server/auth-session.ts';
const container=process.argv[2],phase=process.argv[3];
if(!/^stylist-capacity-[a-f0-9]{12}$/.test(container??'')||!['before-restart','after-restart'].includes(phase??''))throw Error('Isolated capacity fixture required');
const owner='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
const session='00000000-0000-0000-0000-000000000099';
let checks=0,stage='fixture';
function check(value:unknown){if(!value)throw Error();checks++;}
import {spawn} from 'node:child_process';
async function query(text:string):Promise<string>{return new Promise((resolve,reject)=>{
 const child=spawn('docker',['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});
 let output='',failed=false;const timer=setTimeout(()=>{failed=true;child.kill();reject(Error());},8000);
 child.stdout.setEncoding('utf8');child.stdout.on('data',chunk=>{output+=chunk;if(output.length>100_000){failed=true;child.kill();reject(Error());}});
 child.stderr.resume();child.on('error',()=>{clearTimeout(timer);reject(Error());});child.stdin.on('error',()=>{/* Exit/error handler owns failure. */});
 child.on('close',code=>{clearTimeout(timer);if(!failed&&code===0)resolve(output.trim());else reject(Error());});child.stdin.end(text);
 });}
const literal=(v:unknown)=>v===null?'null':typeof v==='boolean'||typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
const rpc={async call(name:string,p:Record<string,unknown>){
 const keys=name==='stylist_claim_consultation'?['p_owner','p_session','p_token']:name==='stylist_update_consultation'?['p_owner','p_session','p_token','p_fence','p_action','p_cleanup_verified']:name==='stylist_auth_session_active'?['p_owner','p_session']:null;
 if(!keys||Object.keys(p).sort().join()!==keys.slice().sort().join())throw Error();
 const raw=await query(`set role service_role; select to_jsonb(public.${name}(${keys.map(k=>literal(p[k])).join(',')}));`);return raw?JSON.parse(raw):null;
}};
try{
 if(phase==='before-restart'){
  stage='parallel-admission';
  const requests=Array.from({length:8},(_,i)=>({owner:i%2?other:owner,id:`00000000-0000-0000-0000-${String(100+i).padStart(12,'0')}`}));
  const outcomes=await Promise.all(requests.map(r=>createConsultationSlot(r.owner,rpc).claim(r.id)));
  check(outcomes.filter(Boolean).length===1);const index=outcomes.findIndex(Boolean),lease=outcomes[index]!;
  const trustedOwner=requests[index].owner,slot=createConsultationSlot(trustedOwner,rpc),foreign=createConsultationSlot(trustedOwner===owner?other:owner,rpc);
  check(JSON.stringify(await slot.claim(lease.sessionId,lease.token))===JSON.stringify(lease));
  check(await foreign.claim(lease.sessionId,lease.token)===null);
  check(await slot.claim(lease.sessionId,'00000000-0000-0000-0000-000000000999')===null);
  check(await slot.update({...lease,fence:lease.fence+1},'check')===false);
  stage='lost-start-ack';let submissions=0;
  const lost={async call(name:string,p:Record<string,unknown>){submissions++;await rpc.call(name,p);throw Error('synthetic-lost-ack');}};
  let rejected=false;try{await createConsultationSlot(trustedOwner,lost).update(lease,'provider');}catch{rejected=true;}check(rejected&&submissions===1);
  check(await slot.update(lease,'provider')===false);check((await slot.claim(lease.sessionId,lease.token))?.state==='provider');
  stage='provider-expiry-hold';await query("update stylist_private.consultation_slot set expires_at=clock_timestamp()-interval '1 second';");
  check(await slot.update(lease,'check')===false);check(await slot.update(lease,'heartbeat')===false);
  check(await slot.update(lease,'end')===false);check(await foreign.claim(session)===null);
  check(await query("select state from stylist_private.consultation_slot;")==='provider');
 }else{
  stage='restart-hold';
  const row=JSON.parse(await query('select to_jsonb(s) from stylist_private.consultation_slot s;'));
  check(row.state==='provider');const lease:ConsultationLease={sessionId:row.session_id,token:row.token,fence:Number(row.fence),state:'provider',expiresAt:row.expires_at};
  const slot=createConsultationSlot(row.owner_id,rpc),newOwner=row.owner_id===owner?other:owner,foreign=createConsultationSlot(newOwner,rpc);
  check(await slot.update(lease,'check')===false);check(await foreign.claim(session)===null);check(await slot.claim(lease.sessionId,lease.token)===null);
  check(await slot.update(lease,'end')===false);check(await slot.update(lease,'end',true)===true);
  const replacement=await foreign.claim(session);check(!!replacement&&replacement.fence>lease.fence);
  check(await slot.update(lease,'end',true)===false);check(await slot.update(lease,'heartbeat')===false);
  check(await foreign.update(replacement!,'end')===true);
  stage='lost-reservation-ack';let submitted=0;
  const lost={async call(name:string,p:Record<string,unknown>){submitted++;await rpc.call(name,p);throw Error('synthetic-lost-ack');}};
  let rejected=false;try{await createConsultationSlot(owner,lost).claim(session);}catch{rejected=true;}check(rejected&&submitted===1);
  check(await foreign.claim(session)===null);
  const held=JSON.parse(await query('select to_jsonb(s) from stylist_private.consultation_slot s;'));
  check(held.state==='reserved');await query("update stylist_private.consultation_slot set expires_at=clock_timestamp()-interval '1 second';");
  const recovered=await foreign.claim(session);check(!!recovered&&recovered.fence>Number(held.fence)&&recovered.token!==held.token);
  check(await createConsultationSlot(owner,rpc).update({sessionId:held.session_id,token:held.token,fence:Number(held.fence),state:'reserved',expiresAt:held.expires_at},'end')===false);
  stage='lost-end-ack';submitted=0;rejected=false;
  try{await createConsultationSlot(newOwner,lost).update(recovered!,'end');}catch{rejected=true;}check(rejected&&submitted===1);
  check(await query('select state from stylist_private.consultation_slot;')==='free');
  check(await foreign.claim(session,recovered!.token)===null);
  stage='auth-expiry';
  await query(`insert into auth.sessions(id,user_id,not_after) values ('${session}','${owner}',clock_timestamp()+interval '1 hour');`);
  const authority=createAuthSessionAuthority(rpc),signal=new AbortController().signal;
  check(await authority.active(owner,session,signal)===true);check(await authority.active(other,session,signal)===false);
  await query(`update auth.sessions set not_after=clock_timestamp()-interval '1 second' where id='${session}';`);
  check(await authority.active(owner,session,signal)===false);
  const offline=createAuthSessionAuthority({call:async()=>{throw Error('synthetic-outage');}});check(await offline.active(owner,session,signal)===false);
 }
 console.log(JSON.stringify({status:'passed',phase,checks,parallelClaims:phase==='before-restart'?8:0,scope:'synthetic database/adapters only'}));
}catch{console.log(JSON.stringify({status:'failed',phase,stage}));process.exitCode=1;}
