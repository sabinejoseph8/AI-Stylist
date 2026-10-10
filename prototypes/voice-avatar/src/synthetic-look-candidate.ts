import type {Candidate} from './notebook-state.ts';
import type {LookDraft} from './look-release.ts';
export type SyntheticLookCandidate = Candidate & {id:string};
/** Bounded, immutable fixture data. Derive display/speech text from the same
 * checked attributes. This is not product discovery or a semantic AI validator. */
export function prepareSyntheticLook(value:SyntheticLookCandidate):{draft:LookDraft;candidate:Candidate} {
 const keys=['id','color','style','occasion','lookType','newItemCents','currency','excludedColors'];
 if(!value||typeof value!=='object'||Object.keys(value).length!==keys.length||Object.keys(value).some(key=>!keys.includes(key)))throw Error('Invalid synthetic candidate.');
 if(typeof value.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(value.id))throw Error('Invalid synthetic candidate.');
 for(const field of ['color','style','occasion','lookType'] as const)if(typeof value[field]!=='string'||!value[field].trim()||value[field].length>160)throw Error('Invalid synthetic candidate.');
 if(value.currency!=='USD'||!Number.isSafeInteger(value.newItemCents)||value.newItemCents<0||value.newItemCents>10_000_000||!Array.isArray(value.excludedColors)||value.excludedColors.length>16||value.excludedColors.some(color=>typeof color!=='string'||!color.trim()||color.length>160))throw Error('Invalid synthetic candidate.');
 const candidate:Candidate={color:value.color.trim(),style:value.style.trim(),occasion:value.occasion.trim(),lookType:value.lookType.trim(),newItemCents:value.newItemCents,currency:'USD',excludedColors:[...value.excludedColors]};
 Object.freeze(candidate.excludedColors);Object.freeze(candidate);
 const description=`Synthetic sample: ${candidate.color}, ${candidate.style} ${candidate.lookType} for ${candidate.occasion}. New items: USD ${(candidate.newItemCents/100).toFixed(2)} (items only). No real products or seasonal suitability verified.`;
 return {draft:Object.freeze({id:value.id,description}),candidate};
}
