import {prepareAffiliateLinks} from '../../../../packages/affiliate-contracts/src/prepared-affiliate-links.ts';
import {prepareAffiliateActions} from '../../../../packages/affiliate-contracts/src/prepared-affiliate-actions.ts';
import {prepareSourceLink} from '../catalog/local-shopping-evidence.ts';
import type {ShopSelection,SourceSnapshot} from '../catalog/local-shopping-evidence.ts';
/** Inert composition of the existing shared contracts. No real program,
 * navigation, customer tracking, link generation, persistence or ranking port. */
export function prepareLocalAffiliatePreview(options:Parameters<typeof prepareAffiliateLinks>[0]&Pick<Parameters<typeof prepareAffiliateActions>[0],'readCurrent'|'allowed'>){
 const links=prepareAffiliateLinks(options),actions=prepareAffiliateActions({simulation:options.simulation,links,readCurrent:options.readCurrent,allowed:options.allowed});
 return Object.freeze({issue:actions.issue,invalidate:actions.invalidate,end:actions.end,resolve(permit:object,now:number){const result=actions.resolve(permit,now);return result?Object.freeze({...result,simulation:true as const,relationship:'affiliate-preview' as const,disclosurePlacement:'adjacent-to-link' as const,navigationEnabled:false as const}):null;}});
}
export function prepareOrdinaryLinkPreview(selection:ShopSelection,sources:readonly SourceSnapshot[],destination:string|null,now:number){const result=prepareSourceLink(selection,sources,destination,now);return Object.freeze({...result,simulation:true as const,relationship:'unattributed-source-preview' as const,affiliateStatus:'not-configured' as const,disclosure:null,earnsCommissionOnClick:false as const});}
