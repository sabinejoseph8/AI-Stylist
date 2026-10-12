import {it,expect} from 'vitest';
import {readAccountRuntimeSettings} from '../src/server/account-runtime-settings.ts';
function settings(){return {ACCOUNT_APP_ORIGIN:'https://stylist.test',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SECRET_KEY:'synthetic-service-key-only',ACCOUNT_REFRESH_ACTIVE_KEY_ID:'current',ACCOUNT_REFRESH_KEYS:JSON.stringify({current:Buffer.alloc(32,9).toString('base64url')}),PORT:'4327',ACCOUNT_BUILD_DIRECTORY:'/private/tmp/build'};}
it('parses explicit server configuration and keyring without a session-policy default',()=>{
 const result=readAccountRuntimeSettings(settings());expect(result.bindHost).toBe('127.0.0.1');expect(result.port).toBe(4327);expect(result.refreshKeyring.get('current')).toEqual(Buffer.alloc(32,9));expect(result).not.toHaveProperty('initialExpiry');expect(result).not.toHaveProperty('rotatedExpiry');expect(result).not.toHaveProperty('enabled');
});
it('refuses every missing required setting with a generic error',()=>{
 for(const key of Object.keys(settings())){const env:Record<string,string|undefined>=settings();delete env[key];expect(()=>readAccountRuntimeSettings(env)).toThrow('Account runtime settings unavailable');}
});
it('rejects foreign destinations, unsafe binds and invalid key material without leaking input',()=>{
 for(const patch of [{ACCOUNT_APP_ORIGIN:'http://stylist.test'},{ACCOUNT_APP_ORIGIN:'https://user:secret@stylist.test'},{SUPABASE_URL:'https://foreign.test'},{SUPABASE_SECRET_KEY:'secret private\nvalue'},{PORT:'0'},{HOST:'foreign.test'},{ACCOUNT_BUILD_DIRECTORY:'relative'},{ACCOUNT_REFRESH_KEYS:'private-invalid-json'},{ACCOUNT_REFRESH_ACTIVE_KEY_ID:'missing'},{ACCOUNT_REFRESH_KEYS:JSON.stringify({current:'A'.repeat(42)})},{ACCOUNT_REFRESH_KEYS:JSON.stringify({current:'A'.repeat(42)+'B'})}]){
  try{readAccountRuntimeSettings({...settings(),...patch});throw Error('Unexpected success');}catch(error){expect((error as Error).message).toBe('Account runtime settings unavailable');}
 }
});
it('supports explicit overlap keys without silently selecting a different active key',()=>{
 const result=readAccountRuntimeSettings({...settings(),ACCOUNT_REFRESH_KEYS:JSON.stringify({current:Buffer.alloc(32,1).toString('base64url'),previous:Buffer.alloc(32,2).toString('base64url')}),HOST:'0.0.0.0'});expect(result.refreshKeyring.size).toBe(2);expect(result.activeRefreshKeyId).toBe('current');expect(result.bindHost).toBe('0.0.0.0');
});

it('refuses duplicate key IDs instead of silently accepting the final value',()=>{
 const key=Buffer.alloc(32,9).toString('base64url');expect(()=>readAccountRuntimeSettings({...settings(),ACCOUNT_REFRESH_KEYS:'{"current":"'+key+'","current":"'+key+'"}'})).toThrow('Account runtime settings unavailable');
});
