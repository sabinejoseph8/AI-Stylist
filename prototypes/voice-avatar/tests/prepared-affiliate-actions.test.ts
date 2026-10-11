import {describe,it,expect,vi} from 'vitest';
import {prepareAffiliateLinks} from '../src/prepared-affiliate-links.ts';
import {prepareAffiliateActions} from '../src/prepared-affiliate-actions.ts';
import {NotebookState} from '../src/notebook-state.ts';
import {LookRelease} from '../src/look-release.ts';
import type {CatalogProduct,CatalogPolicy} from '../src/catalog-contract.ts';
function fixture(){
 const catalog:CatalogPolicy={sourceId:'fixture',synthetic:false,permittedHosts:['retailer.invalid'],imageHosts:['images.invalid'],rightsReferences:['fixture_rights'],maxAgeMs:1000,capabilities:{externalCheckout:true,embeddedCheckout:false,cartTransfer:false,orderTracking:false}};
 const product:CatalogProduct={sourceId:'fixture',productId:'dress',variantId:'blue_m',name:'Fixture dress',category:'dress',colors:['blue'],size:'M',priceCents:10000,currency:'USD',country:'US',availability:'available',delivery:{status:'eligible',destination:'US-test'},image:{url:'https://images.invalid/dress.jpg',rightsReference:'fixture_rights'},productUrl:'https://retailer.invalid/dress?variant=blue_m',checkedAt:1000,sourceUpdatedAt:1000,synthetic:false};
 const policy={sourceId:'fixture',programReference:'fixture_program',trackingHosts:['affiliate.invalid'],requiredParameters:{publisher:'fixture_publisher'}};
 const offer={sourceId:'fixture',productId:'dress',variantId:'blue_m',productUrl:product.productUrl!,affiliateUrl:'https://affiliate.invalid/approved?publisher=fixture_publisher&item=dress',programReference:'fixture_program'};
 const options={simulation:true,catalog,policy,offers:[offer]};const request={size:'M',destination:'US-test'};
 return{options,product,request,offer,policy,catalog};
}

function actionFixture(){
 const s=fixture();let revision=1,product:CatalogProduct|null=s.product;
 const notebook=new NotebookState(),release=new LookRelease(notebook);
 const ticket=release.begin({id:'fixture_look',description:'Synthetic checked blue dress.'}),look=release.complete(ticket,{outcome:'passed',reason:'Fixture checker only.'})!;
 const allowed=vi.fn(()=>release.visual(look)!==null),readCurrent=vi.fn(()=>product?{revision,product}:null);
 const options={simulation:true,links:prepareAffiliateLinks(s.options),allowed,readCurrent};const actions=prepareAffiliateActions(options);
 return{...s,options,actions,notebook,release,allowed,readCurrent,replace:(next:CatalogProduct|null)=>{revision++;product=next;},mutate:(next:CatalogProduct)=>{product=next;}};
}
describe('disabled catalog, look gate and affiliate action composition',()=>{
 it('requires explicit simulation',()=>{const s=actionFixture();expect(()=>prepareAffiliateActions({...s.options,simulation:false})).toThrow('disabled');s.release.dispose();});
 it('resolves matching current checked selection once with its disclosure',()=>{const s=actionFixture(),permit=s.actions.issue(1000,s.request)!;expect(permit).not.toBeNull();const result=s.actions.resolve(permit,1000);expect(result?.affiliateUrl).toBe(s.offer.affiliateUrl);expect(result?.disclosure).toContain('qualifying purchases');expect(s.actions.resolve(permit,1000)).toBeNull();s.release.dispose();});
 it.each(['unavailable','variant','url','price','removed'])('revokes old action after %s refresh',kind=>{const s=actionFixture(),permit=s.actions.issue(1000,s.request)!;const next=structuredClone(s.product);if(kind==='unavailable')next.availability='unavailable';if(kind==='variant')next.variantId='other';if(kind==='url')next.productUrl='https://retailer.invalid/other';if(kind==='price')next.priceCents=20000;s.replace(kind==='removed'?null:next);expect(s.actions.resolve(permit,1000)).toBeNull();if(kind!=='price')expect(s.actions.issue(1000,s.request)).toBeNull();s.release.dispose();});
 it('rejects changed product even if a source fails to increment revision',()=>{const s=actionFixture(),permit=s.actions.issue(1000,s.request)!;s.mutate({...s.product,priceCents:20000});expect(s.actions.resolve(permit,1000)).toBeNull();s.release.dispose();});
 it('requires a new action after an eligible refresh',()=>{const s=actionFixture(),old=s.actions.issue(1000,s.request)!;s.replace({...s.product,checkedAt:1100,sourceUpdatedAt:1100});expect(s.actions.resolve(old,1100)).toBeNull();expect(s.actions.resolve(s.actions.issue(1100,s.request)!,1100)?.affiliateUrl).toBe(s.offer.affiliateUrl);s.release.dispose();});
 it('rechecks freshness at resolution',()=>{const s=actionFixture(),permit=s.actions.issue(1000,s.request)!;expect(s.actions.resolve(permit,2001)).toBeNull();s.release.dispose();});
 it.each(['color','budget','saved-preferences','end-look'])('cannot override %s invalidation',kind=>{const s=actionFixture(),permit=s.actions.issue(1000,s.request)!;if(kind==='color')s.notebook.edit('color','green');if(kind==='budget')s.notebook.edit('budget','USD 50 maximum');if(kind==='saved-preferences')s.notebook.preferencesChanged();if(kind==='end-look')s.release.end();expect(s.actions.resolve(permit,1000)).toBeNull();expect(s.actions.issue(1000,s.request)).toBeNull();s.release.dispose();});
 it('new action invalidates the prior capability and forged objects are refused',()=>{const s=actionFixture(),old=s.actions.issue(1000,s.request)!,newer=s.actions.issue(1000,s.request)!;expect(s.actions.resolve(old,1000)).toBeNull();expect(s.actions.resolve({},1000)).toBeNull();expect(s.actions.resolve(newer,1000)).not.toBeNull();s.release.dispose();});
 it('invalidation and end cannot restore existing capabilities',()=>{const s=actionFixture(),old=s.actions.issue(1000,s.request)!;s.actions.invalidate();expect(s.actions.resolve(old,1000)).toBeNull();const latest=s.actions.issue(1000,s.request)!;s.actions.end();expect(s.actions.resolve(latest,1000)).toBeNull();expect(s.actions.issue(1000,s.request)).toBeNull();s.release.dispose();});
 it.each(['read','allowed'])('holds throwing %s callbacks',kind=>{const s=actionFixture(),permit=s.actions.issue(1000,s.request)!;if(kind==='read')s.readCurrent.mockImplementation(()=>{throw Error('private');});else s.allowed.mockImplementation(()=>{throw Error('private');});expect(s.actions.resolve(permit,1000)).toBeNull();expect(s.actions.issue(1000,s.request)).toBeNull();s.release.dispose();});
 it.each(['issue','resolve'])('refuses reentrant end during %s',stage=>{const s=actionFixture();let permit:object|null=null;if(stage==='resolve')permit=s.actions.issue(1000,s.request);s.readCurrent.mockImplementation(()=>{s.actions.end();return{revision:1,product:s.product};});expect(stage==='issue'?s.actions.issue(1000,s.request):s.actions.resolve(permit!,1000)).toBeNull();s.release.dispose();});
});

describe('affiliate final authorization reentrancy',()=>{
 it.each(['issue','resolve'])('does not release after the final %s authorization ends the owner',stage=>{
  const s=actionFixture();const permit=stage==='resolve'?s.actions.issue(1000,s.request):null;let calls=0;
  s.allowed.mockImplementation(()=>{if(++calls===2)s.actions.end();return true;});
  expect(stage==='issue'?s.actions.issue(1000,s.request):s.actions.resolve(permit!,1000)).toBeNull();s.release.dispose();
 });
});

describe('affiliate selection changes during authorization',()=>{
 it.each(['issue','resolve'])('rejects a selection replacement during final %s authorization',stage=>{
  const s=actionFixture();const permit=stage==='resolve'?s.actions.issue(1000,s.request):null;let calls=0;
  s.allowed.mockImplementation(()=>{if(++calls===2)s.replace({...s.product,priceCents:20000});return true;});
  expect(stage==='issue'?s.actions.issue(1000,s.request):s.actions.resolve(permit!,1000)).toBeNull();s.release.dispose();
 });
 it.each(['issue','resolve'])('rejects an unversioned mutation during final %s authorization',stage=>{
  const s=actionFixture();const permit=stage==='resolve'?s.actions.issue(1000,s.request):null;let calls=0;
  s.allowed.mockImplementation(()=>{if(++calls===2)s.mutate({...s.product,availability:'unavailable'});return true;});
  expect(stage==='issue'?s.actions.issue(1000,s.request):s.actions.resolve(permit!,1000)).toBeNull();s.release.dispose();
 });
});
