import {expect,it,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {bindSensitivePageLifecycle,clearSensitiveFieldValues} from '../src/web/sensitive-page-lifecycle.ts';
import {createAccountFlow} from '../src/web/account-flow.ts';
import {createRecoveryFlow} from '../src/web/recovery-flow.ts';
function pageEvent(name:string,persisted=false){return Object.assign(new Event(name),{persisted});}
it('clears on page exit and cached return, not ordinary page load',()=>{const target=new EventTarget(),clear=vi.fn();const stop=bindSensitivePageLifecycle(target,clear);target.dispatchEvent(pageEvent('pageshow'));expect(clear).not.toHaveBeenCalled();target.dispatchEvent(pageEvent('pagehide',true));target.dispatchEvent(pageEvent('pageshow',true));expect(clear).toHaveBeenCalledTimes(2);stop();target.dispatchEvent(pageEvent('pagehide'));expect(clear).toHaveBeenCalledTimes(2);});
it('account exit clears draft credentials and fences a late simulated sign-in',async()=>{
 let resolveReply!:(v:{status:'signedIn';userId:string})=>void;
 const flow=createAccountFlow({submit:()=>new Promise(resolve=>{resolveReply=resolve;}),signOut:async()=>{}});
 let email='sample@example.test',password='SYNTHETIC_PASSWORD';const target=new EventTarget();
 const stop=bindSensitivePageLifecycle(target,()=>{email='';password='';flow.cancel();});
 const pending=flow.submit({method:'signIn',email,password});await Promise.resolve();
 target.dispatchEvent(pageEvent('pagehide',true));resolveReply({status:'signedIn',userId:'11111111-1111-4111-8111-111111111111'});await pending;
 expect([email,password]).toEqual(['','']);expect(flow.snapshot().status).toBe('signedOut');expect(flow.snapshot().userId).toBeNull();stop();
});
it('reset exit clears both drafts and rejects a late completion and reuse',async()=>{
 let resolveReply!:(v:{status:'resetComplete'})=>void;const reset=vi.fn(()=>new Promise<{status:'resetComplete'}>(resolve=>{resolveReply=resolve;}));
 const flow=createRecoveryFlow({reset},Date.now()+60000);const target=new EventTarget();let password='SYNTHETIC_RESET',confirmation=password;
 const stop=bindSensitivePageLifecycle(target,()=>{password='';confirmation='';flow.cancel();});
 const pending=flow.submit(password,confirmation);await Promise.resolve();target.dispatchEvent(pageEvent('pagehide',true));resolveReply({status:'resetComplete'});await pending;
 expect([password,confirmation]).toEqual(['','']);expect(flow.snapshot().status).toBe('canceled');await flow.submit('again','again');expect(reset).toHaveBeenCalledOnce();stop();
});
it('the sample entry dependency graph has no persistence, remote transport, raw console or HTML insertion sinks',()=>{
 const visited=new Set<string>();
 function walk(path:string){if(visited.has(path))return;visited.add(path);const text=readFileSync(path,'utf8');
  for(const sink of [/\b(?:localStorage|sessionStorage|indexedDB)\s*[.\[]/,/\b(?:fetch|WebSocket|XMLHttpRequest|sendBeacon)\s*\(/,/console\s*\.\s*(?:log|error|warn|info|debug)\s*\(/,/dangerouslySetInnerHTML|\.innerHTML\s*=/])expect(text,path).not.toMatch(sink);
  for(const match of text.matchAll(/(?:import|export)\s+(?:[^;'"\n]*?\s+from\s*)?['"]([^'"]+)['"]/g))if(match[1].startsWith('.')&&/\.tsx?$/.test(match[1]))walk(resolve(dirname(path),match[1]));
 }
 walk(fileURLToPath(new URL('../src/web/main.tsx',import.meta.url)));expect(visited.size).toBeGreaterThan(20);
});
it('the synthetic lifecycle controls cannot enter the production build inputs',()=>{const config=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8');expect(config).not.toContain('privacy-lifecycle');expect(config).toContain('preview:"index.html",account:"account.html"');});

it('erases field values synchronously even when a framework commit is paused',()=>{const email={value:'sample@example.test'},password={value:'SYNTHETIC_ONLY'};clearSensitiveFieldValues([email,null,password]);expect([email.value,password.value]).toEqual(['','']);});
