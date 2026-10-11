import {it,expect,vi} from 'vitest';
import {saveMixedLook} from '../src/server/mixed-look-save.ts';
import type {CatalogAdapter,CatalogPolicy,CatalogProduct} from '../../../packages/catalog-contracts/src/index.ts';

const owner='aaaaaaaa-0000-0000-0000-000000000001';
const assetId='bbbbbbbb-0000-0000-0000-000000000002';
const policy:CatalogPolicy={sourceId:'fixture',synthetic:false,permittedHosts:['shop.example'],imageHosts:['images.example'],
 rightsReferences:['test-license'],maxAgeMs:1000,capabilities:{externalCheckout:true,embeddedCheckout:false,cartTransfer:false,orderTracking:false}};
const product:CatalogProduct={sourceId:'fixture',productId:'dress',variantId:'m',name:'Dress',category:'dress',colors:['Blue'],size:'M',
 priceCents:35000,currency:'USD',country:'US',availability:'available',delivery:{status:'eligible',destination:'US'},
 image:{url:'https://images.example/dress.jpg',rightsReference:'test-license'},productUrl:'https://shop.example/dress',
 checkedAt:1000,sourceUpdatedAt:900,synthetic:false};
function setup(){
 const get=vi.fn(async()=>product);
 const adapter:CatalogAdapter={policy,search:async()=>[],get};
 const save=vi.fn(async(_owner:string,_label:string,_items:readonly unknown[],_consent:true,_id:string|null,_revision:number)=>({id:owner,revision:1}));
 const request={label:' Wedding ',consent:true,id:null,expectedRevision:0,items:[
  {kind:'owned',assetId,label:'Jacket'},
  {kind:'retail',sourceId:'fixture',productId:'dress',variantId:'m',label:'Dress'}]};
 return{get,save,request,adapters:new Map<string,CatalogAdapter>([['fixture',adapter]])};
}
it('resolves source facts before passing a mixed look to atomic storage',async()=>{
 const s=setup();const result=await saveMixedLook({save:s.save},s.adapters,owner,s.request,1100);
 expect(result.revision).toBe(1);
 expect(s.get).toHaveBeenCalledWith('dress','m');
 expect(s.save).toHaveBeenCalledOnce();
 const items=s.save.mock.calls[0][2];
 expect(items[0]).toMatchObject({kind:'owned',assetId});
 expect(items[1]).toMatchObject({kind:'retail',snapshot:{productId:'dress',status:'saved-history'}});
 expect(items[1]).not.toHaveProperty('productUrl');
});
it('rejects customer product facts, duplicate items and missing consent before source access',async()=>{
 const s=setup();
 for(const request of [{...s.request,items:[{...s.request.items[1],priceCents:1}]},
  {...s.request,items:[s.request.items[0],s.request.items[0]]},{...s.request,consent:false}])
  await expect(saveMixedLook({save:s.save},s.adapters,owner,request,1100)).rejects.toThrow();
 expect(s.get).not.toHaveBeenCalled();expect(s.save).not.toHaveBeenCalled();
});
it('holds a stale or mismatched source response before storage',async()=>{
 const s=setup();s.get.mockResolvedValueOnce({...product,productId:'wrong'});
 await expect(saveMixedLook({save:s.save},s.adapters,owner,s.request,1100)).rejects.toThrow();
 s.get.mockResolvedValueOnce({...product,checkedAt:1});
 await expect(saveMixedLook({save:s.save},s.adapters,owner,s.request,1100)).rejects.toThrow();
 expect(s.save).not.toHaveBeenCalled();
});
