/** Prepared boundary only. No live database or HTTP save route. */
export type WardrobeSave=Readonly<{assetId:string;label:string;consent:true;id:string|null;expectedRevision:number}>;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function decodeWardrobeSave(value:unknown):WardrobeSave {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid save');
 const x=value as Record<string,unknown>;
 const keys=['assetId','label','consent','id','expectedRevision'];
 if(Object.keys(x).length!==keys.length||keys.some(k=>!Object.hasOwn(x,k)))throw Error('Invalid save');
 if(typeof x.assetId!=='string'||!uuid.test(x.assetId)||typeof x.label!=='string'||x.label.trim().length<1||x.label.trim().length>120||x.consent!==true)throw Error('Invalid save');
 if(x.id!==null&&(typeof x.id!=='string'||!uuid.test(x.id)))throw Error('Invalid save');
 if(!Number.isSafeInteger(x.expectedRevision)||(x.id===null?x.expectedRevision!==0:Number(x.expectedRevision)<1))throw Error('Invalid revision');
 return Object.freeze({assetId:x.assetId,label:x.label.trim(),consent:true,id:x.id as string|null,expectedRevision:x.expectedRevision as number});
}
