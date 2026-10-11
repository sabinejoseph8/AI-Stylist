import {it,expect,vi} from 'vitest';
import {createMixedLookSupabasePort} from '../src/server/mixed-look-supabase.ts';
it('maps the atomic save RPC into a validated look result',async()=>{
 const fetcher=vi.fn(async(_url:string,_init:RequestInit)=>new Response(JSON.stringify([{id:'aaaaaaaa-0000-0000-0000-000000000001',revision:2}]),{headers:{'content-type':'application/json'}}));
 const port=createMixedLookSupabasePort('https://example.supabase.co','private-server-key-value-123456',fetcher as never);
 const result=await port.save('bbbbbbbb-0000-0000-0000-000000000002','Wedding',[],true,null,0);
 expect(result).toEqual({id:'aaaaaaaa-0000-0000-0000-000000000001',revision:2});
 const init=fetcher.mock.calls[0][1];
 expect(JSON.parse(String(init.body))).toEqual({p_owner:'bbbbbbbb-0000-0000-0000-000000000002',p_label:'Wedding',p_items:[],p_consent:true,p_id:null,p_expected_revision:0});
});
it('rejects malformed RPC results without exposing credentials',async()=>{
 const port=createMixedLookSupabasePort('https://example.supabase.co','private-server-key-value-123456',async()=>new Response('[{"id":"bad","revision":1}]',{headers:{'content-type':'application/json'}}) as never);
 await expect(port.save('bbbbbbbb-0000-0000-0000-000000000002','Wedding',[],true,null,0)).rejects.toThrow('Look save unavailable');
});
