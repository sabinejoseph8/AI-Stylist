import {decodeWardrobeSave} from './wardrobe-save.ts';
/** Prepared owned-image subset. Retail snapshots require their own source checks. */
export function decodeOwnedLookSave(input:unknown){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid look');
 const x=input as Record<string,unknown>;
 const keys=['label','items','consent','id','expectedRevision'];
 if(Object.keys(x).length!==keys.length||keys.some(k=>!Object.hasOwn(x,k))||!Array.isArray(x.items)||x.items.length<1||x.items.length>20)throw Error('Invalid look');
 const items=x.items.map(value=>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid component');
  const item=value as Record<string,unknown>;
  if(Object.keys(item).length!==2||!Object.hasOwn(item,'assetId')||!Object.hasOwn(item,'label'))throw Error('Invalid component');
  const validated=decodeWardrobeSave({...item,consent:true,id:null,expectedRevision:0});
  return Object.freeze({assetId:validated.assetId.toLowerCase(),label:validated.label});
 });
 if(new Set(items.map(i=>i.assetId)).size!==items.length)throw Error('Duplicate asset');
 const header=decodeWardrobeSave({assetId:items[0].assetId,label:x.label,consent:x.consent,id:x.id,expectedRevision:x.expectedRevision});
 return Object.freeze({label:header.label,items:Object.freeze(items),consent:header.consent,id:header.id,expectedRevision:header.expectedRevision});
}
