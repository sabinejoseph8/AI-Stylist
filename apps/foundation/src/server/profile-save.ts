/** Prepared explicit profile contract, independent of transient notebook fields. */
export type ProfilePreferences=Readonly<{preferredColors:readonly string[];excludedColors:readonly string[];styles:readonly string[];excludedCategories:readonly string[];budgetCents:number|null;currency:'USD'}>;
export type ProfileSave=Readonly<{consent:true;expectedRevision:number;preferences:ProfilePreferences}>;
function record(x:unknown,keys:string[]):Record<string,unknown>{
 if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid profile');
 const r=x as Record<string,unknown>;
 if(Object.keys(r).length!==keys.length||keys.some(k=>!Object.hasOwn(r,k)))throw Error('Invalid profile');
 return r;
}
function terms(x:unknown):readonly string[]{
 if(!Array.isArray(x)||x.length>20)throw Error('Invalid preferences');
 const values=x.map(v=>{if(typeof v!=='string'||!v.trim()||v.trim().length>80)throw Error('Invalid preference');return v.trim();});
 if(new Set(values.map(v=>v.toLowerCase())).size!==values.length)throw Error('Duplicate preference');
 return Object.freeze(values);
}
export function decodeProfileSave(input:unknown):ProfileSave{
 const x=record(input,['consent','expectedRevision','preferences']);
 if(x.consent!==true||!Number.isSafeInteger(x.expectedRevision)||Number(x.expectedRevision)<0)throw Error('Invalid save');
 const p=record(x.preferences,['preferredColors','excludedColors','styles','excludedCategories','budgetCents','currency']);
 if(p.currency!=='USD'||(p.budgetCents!==null&&(!Number.isSafeInteger(p.budgetCents)||Number(p.budgetCents)<0)))throw Error('Invalid money');
 const preferences=Object.freeze({preferredColors:terms(p.preferredColors),excludedColors:terms(p.excludedColors),styles:terms(p.styles),excludedCategories:terms(p.excludedCategories),budgetCents:p.budgetCents as number|null,currency:'USD' as const});
 if(preferences.preferredColors.some(c=>preferences.excludedColors.some(e=>e.toLowerCase()===c.toLowerCase())))throw Error('Conflicting colors');
 return Object.freeze({consent:true,expectedRevision:x.expectedRevision as number,preferences});
}
