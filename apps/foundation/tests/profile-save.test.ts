import {it,expect} from 'vitest';
import {decodeProfileSave} from '../src/server/profile-save.ts';
const preferences={preferredColors:['Blue'],excludedColors:['Red'],styles:['Structured'],excludedCategories:[],budgetCents:35000,currency:'USD'};
const base={consent:true,expectedRevision:0,preferences};
it('creates a copied immutable explicit preference selection',()=>{const x=decodeProfileSave(base);expect(x.preferences.budgetCents).toBe(35000);expect(Object.isFrozen(x.preferences.preferredColors)).toBe(true);expect(x.preferences).not.toBe(preferences);});
for(const [name,change] of Object.entries({noConsent:{consent:false},actor:{user_id:'another'},notes:{notes:{}},fraction:{expectedRevision:.5},negative:{expectedRevision:-1}}))it(`rejects ${name}`,()=>expect(()=>decodeProfileSave({...base,...change})).toThrow());
for(const [name,change] of Object.entries({currency:{currency:'EUR'},fractionMoney:{budgetCents:1.5},negativeMoney:{budgetCents:-1},unsafeMoney:{budgetCents:Number.MAX_SAFE_INTEGER+1},transcript:{transcript:'private'},occasion:{occasion:'wedding'},duplicate:{styles:['Structured','structured']},empty:{preferredColors:[' ']},many:{styles:Array(21).fill('Style')},conflict:{excludedColors:['blue']},long:{styles:['x'.repeat(81)]}}))it(`rejects preference ${name}`,()=>expect(()=>decodeProfileSave({...base,preferences:{...preferences,...change}})).toThrow());
it('allows an explicitly unknown budget',()=>expect(decodeProfileSave({...base,preferences:{...preferences,budgetCents:null}}).preferences.budgetCents).toBeNull());
