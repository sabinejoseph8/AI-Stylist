/** Prepared server-only reconciliation. No storage transport is connected. */
export interface MediaReconcilePort {
 read(id:string,ownerId:string):Promise<unknown>;
 inspect(key:string):Promise<Readonly<{state:'absent'|'unknown'}|{state:'present';checksum:string}>>;
 commit(id:string,ownerId:string,checksum:string):Promise<void>;
 remove(key:string):Promise<void>;
 finishDelete(id:string,ownerId:string,token:string):Promise<void>;
}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
/** Storage inspect must hash actual bytes or use equivalently verified evidence. */
export async function reconcileMedia(port:MediaReconcilePort,ownerId:string,id:string):Promise<'ready'|'deleted'|'pending'>{
 if(typeof ownerId!=='string'||typeof id!=='string'||!uuid.test(ownerId)||!uuid.test(id))throw Error('Verified identity required');
 const owner=ownerId.toLowerCase();const asset=id.toLowerCase();
 try{
  const value=await port.read(asset,owner);
  if(!value||typeof value!=='object'||Array.isArray(value))return 'pending';
  const x=value as Record<string,unknown>;
  const keys=['id','ownerId','key','checksum','state','deletionToken'];
  if(Object.keys(x).length!==keys.length||keys.some(k=>!Object.hasOwn(x,k))||x.id!==asset||x.ownerId!==owner||x.key!==`${owner}/${asset}.webp`)return 'pending';
  if(x.state==='deleted'&&x.checksum===null&&typeof x.deletionToken==='string'&&uuid.test(x.deletionToken))return 'deleted';
  if(typeof x.checksum!=='string'||!/^[a-f0-9]{64}$/.test(x.checksum))return 'pending';
  if(x.state==='ready'&&x.deletionToken===null)return 'ready';
  if(x.state!=='staged'&&x.state!=='deleting')return 'pending';
  if(x.state==='staged'&&x.deletionToken!==null)return 'pending';
  if(x.state==='deleting'&&(typeof x.deletionToken!=='string'||!uuid.test(x.deletionToken)))return 'pending';
  const evidence=await port.inspect(x.key);
  if(x.state==='staged'){
   if(evidence.state!=='present'||evidence.checksum!==x.checksum)return 'pending';
   await port.commit(asset,owner,x.checksum);return 'ready';
  }
  if(evidence.state==='unknown')return 'pending';
  if(evidence.state==='present')await port.remove(x.key);
  else if(evidence.state!=='absent')return 'pending';
  await port.finishDelete(asset,owner,x.deletionToken as string);return 'deleted';
 }catch{return 'pending';}
}
