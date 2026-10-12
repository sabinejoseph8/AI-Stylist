/** Actual disposable PostgreSQL plus the prepared adapter; no hosted Auth/provider. */
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createConsultationSlot} from '../src/server/consultation-slot.ts';
const container=process.argv[2];
if(!/^stylist-data-[a-f0-9]{10}$/.test(container??''))throw Error('Isolated fixture required');
const owner='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002';
const session='00000000-0000-0000-0000-000000000088';
const literal=(v:unknown)=>v===null?'null':typeof v==='boolean'||typeof v==='number'?String(v):"'"+String(v).replaceAll("'","''")+"'";
function sql(query:string){return execFileSync('docker',['exec','-i',container,'psql','-U','postgres','-Atq','-v','ON_ERROR_STOP=1'],
 {input:query,encoding:'utf8',timeout:8000,stdio:['pipe','pipe','pipe']}).trim();}
const rpc={async call(name:string,p:Record<string,unknown>){
 if(name!=='stylist_claim_consultation'&&name!=='stylist_update_consultation')throw Error('Unexpected RPC');
 const keys=name==='stylist_claim_consultation'?['p_owner','p_session','p_token']:['p_owner','p_session','p_token','p_fence','p_action','p_cleanup_verified'];
 assert.deepEqual(Object.keys(p).sort(),keys.slice().sort());
 const raw=sql(`set role service_role; select to_jsonb(public.${name}(${keys.map(k=>literal(p[k])).join(',')}));`);
 return raw?JSON.parse(raw):null;
}};
const slot=createConsultationSlot(owner,rpc),foreign=createConsultationSlot(other,rpc);
const lease=await slot.claim(session);assert.ok(lease);assert.equal(lease.state,'reserved');
assert.deepEqual(await slot.claim(session,lease.token),lease);
assert.equal(await foreign.claim(session,lease.token),null);
assert.equal(await slot.update(lease,'provider'),true);
assert.equal(await slot.update(lease,'provider'),false);
assert.equal(await foreign.update(lease,'check'),false);
assert.equal(await slot.update(lease,'heartbeat'),true);
assert.equal(await slot.update(lease,'end'),false);
assert.equal(await slot.update(lease,'end',true),true);
assert.equal(await slot.update(lease,'check'),false);
console.log('Prepared consultation adapter passes actual local SQL reservation, reconnect, provider fence and cleanup holds');

// Lost replies occur after the database commits. The adapter must not retry.
let submitted=0;
const lost={async call(name:string,p:Record<string,unknown>){submitted++;await rpc.call(name,p);throw Error('simulated lost acknowledgment');}};
await assert.rejects(createConsultationSlot(owner,lost).claim(session),/uncertain/);
assert.equal(submitted,1);assert.equal(await slot.claim(session),null);
// No token was received: retain the unused reservation until its safe expiry.
sql("update stylist_private.consultation_slot set expires_at=now()-interval '1 second';");
const resumed=await slot.claim(session);assert.ok(resumed);
await assert.rejects(createConsultationSlot(owner,lost).update(resumed,'provider'),/uncertain/);
assert.equal(submitted,2);
const afterLostStart=await slot.claim(session,resumed.token);assert.equal(afterLostStart?.state,'provider');
assert.equal(await slot.update(resumed,'provider'),false);assert.equal(await foreign.claim(session),null);
await assert.rejects(createConsultationSlot(owner,lost).update(resumed,'end',true),/uncertain/);
assert.equal(await slot.claim(session,resumed.token),null);
const next=await foreign.claim(session);assert.ok(next);assert.ok(next.fence>resumed.fence);
assert.equal(await slot.update(resumed,'end',true),false);assert.equal(await foreign.update(next,'end'),true);
console.log('Lost reservation/start/end acknowledgments retain safe state without duplicate provider permission');
