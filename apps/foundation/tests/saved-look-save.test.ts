import {it,expect} from 'vitest';
import {decodeOwnedLookSave} from '../src/server/saved-look-save.ts';
const assetId='aaaaaaaa-0000-0000-0000-000000000001';
const base={label:' Look ',items:[{assetId,label:' Jacket '}],consent:true,id:null,expectedRevision:0};
it('copies and freezes a whitelisted owned look',()=>{const x=decodeOwnedLookSave(base);expect(x.label).toBe('Look');expect(x.items[0].label).toBe('Jacket');expect(Object.isFrozen(x.items[0])).toBe(true);expect(Object.isFrozen(x.items)).toBe(true);});
for(const [name,change] of Object.entries({noConsent:{consent:false},owner:{user_id:'other'},notes:{notes:{}},empty:{items:[]},tooMany:{items:Array(21).fill(base.items[0])},duplicate:{items:[base.items[0],{...base.items[0],assetId:assetId.toUpperCase()}]},transcript:{items:[{...base.items[0],transcript:'private'}]},retail:{items:[{productId:'unverified',label:'Dress'}]},badAsset:{items:[{assetId:'bad',label:'Dress'}]},staleCreate:{expectedRevision:1}}))it(`rejects ${name}`,()=>expect(()=>decodeOwnedLookSave({...base,...change})).toThrow());
it('accepts a versioned edit',()=>expect(decodeOwnedLookSave({...base,id:assetId,expectedRevision:2}).expectedRevision).toBe(2));
