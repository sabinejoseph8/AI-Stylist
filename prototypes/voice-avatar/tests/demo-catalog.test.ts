import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createDemoAdapters} from '../src/demo-catalog.ts';
describe('rights-safe demo catalog',()=>{
 it('provides four distinct fixture items with no shopping capability',async()=>{const adapters=createDemoAdapters(),items=(await Promise.all(adapters.map(a=>a.search({text:'',limit:20})))).flat();expect(new Set(items.map(i=>i.productId)).size).toBe(4);for(const item of items){expect(item.synthetic).toBe(true);expect(item.productUrl).toBeNull();expect(item.availability).toBe('unknown');expect(item.delivery.status).toBe('unknown');expect(item.size).toBeTruthy();expect(Number.isSafeInteger(item.priceCents)).toBe(true);}for(const a of adapters)expect(Object.values(a.policy.capabilities)).toEqual([false,false,false,false]);});
 it.each(['green','blue','shoes','bag'])('finds fixtures using %s',async text=>{const items=(await Promise.all(createDemoAdapters().map(a=>a.search({text,limit:20})))).flat();expect(items).toHaveLength(1);expect(items[0]!.name.toLowerCase()).toContain(text==='green'?'emerald':text);});
 it.each(['dress','shoes','bag','jacket'])('uses original local inert illustration: %s',name=>{const art=readFileSync(new URL(`../public/demo-catalog/${name}.svg`,import.meta.url),'utf8');expect(art).toContain('Original synthetic demo');expect(art).toContain('viewBox="0 0 240 280"');expect(art).not.toMatch(/<script|<image|<foreignObject|href=|onload=/i);expect(art).not.toContain('https://');});
 it('documents image provenance without claiming retailer permission',()=>{const rights=readFileSync(new URL('../public/demo-catalog/RIGHTS.md',import.meta.url),'utf8');expect(rights).toContain('original-demo-illustrations-v1');expect(rights).toContain('not retailer photographs');});
});
