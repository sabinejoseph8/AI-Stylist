/** Pure source validator invoked INSIDE a disposable SQLite transaction. */
import {validState,actorValid,domainHistoryHash,domainPolicyHash,projectDomainHistory} from '../../src/server/local-cvi-domain-history.ts';
let raw='';for await(const c of process.stdin)raw+=c;
try{
 const x=JSON.parse(raw);if(!validState(x.snapshot)||!actorValid(x.snapshot,x.actor))throw Error();
 if(x.mode==='project'&&x.actor.role==='observer')throw Error();
 const next=x.mode==='commit'?projectDomainHistory(x.snapshot,x.actor,x.command,x.now):x.snapshot;if(!next)throw Error();
 console.log(JSON.stringify({snapshot:next,head:domainHistoryHash(next),policyDigest:domainPolicyHash(next)}));
}catch{console.log('{"status":"unavailable"}');process.exitCode=2;}
