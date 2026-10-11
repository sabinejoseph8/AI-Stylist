import {validateCatalogProduct} from '../../../../packages/catalog-contracts/src/index.ts';
import type {CatalogPolicy} from '../../../../packages/catalog-contracts/src/index.ts';
/** Trusted source policy and provider product only, never a customer's asserted facts. */
export function prepareRetailSnapshot(input:unknown,policy:CatalogPolicy,now:number){
 const product=validateCatalogProduct(input,policy,now);
 if(product.synthetic||now-product.checkedAt>policy.maxAgeMs)throw Error('Retail snapshot unavailable');
 return Object.freeze({
  sourceId:product.sourceId,productId:product.productId,variantId:product.variantId,
  name:product.name,category:product.category,size:product.size,
  priceCents:product.priceCents,currency:product.currency,country:product.country,
  productUrl:product.productUrl!,image:Object.freeze({...product.image}),
  checkedAt:product.checkedAt,sourceUpdatedAt:product.sourceUpdatedAt,
  // A dated stored snapshot is history, never a current recommendation permit.
  status:'saved-history' as const,
 });
}
