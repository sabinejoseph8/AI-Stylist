import {it,expect} from 'vitest';
import {decodeWardrobeSave} from '../src/server/wardrobe-save.ts';
const id='00000000-0000-0000-0000-000000000001';
const base={assetId:id,label:' Jacket ',consent:true,id:null,expectedRevision:0};
it('copies, trims and freezes a create',()=>{const x=decodeWardrobeSave(base);expect(x.label).toBe('Jacket');expect(Object.isFrozen(x)).toBe(true);expect(x).not.toBe(base);});
it('accepts a versioned edit',()=>expect(decodeWardrobeSave({...base,id,expectedRevision:2}).expectedRevision).toBe(2));
for(const [name,change] of Object.entries({owner:{user_id:id},transcript:{transcript:'private'},notes:{notes:{}},unconfirmed:{consent:false},asset:{assetId:'no'},empty:{label:' '},oversize:{label:'x'.repeat(121)},newStale:{expectedRevision:1},editNoRevision:{id},negative:{expectedRevision:-1},fraction:{expectedRevision:.5},unsafe:{expectedRevision:Number.MAX_SAFE_INTEGER+1}}))it(`rejects ${name}`,()=>expect(()=>decodeWardrobeSave({...base,...change})).toThrow());
it('rejects missing consent',()=>{const {consent,...x}=base;expect(()=>decodeWardrobeSave(x)).toThrow();});
it('rejects nonobjects',()=>{for(const x of [null,[],false,'save'])expect(()=>decodeWardrobeSave(x)).toThrow();});
