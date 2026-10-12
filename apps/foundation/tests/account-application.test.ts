import {it,expect,vi} from 'vitest';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareAccountApplication} from '../src/server/account-application.ts';
async function fixture(){const root=await mkdtemp(join(tmpdir(),'stylist-app-'));await mkdir(join(root,'assets'));await writeFile(join(root,'account.html'),'<meta name="stylist-project-origin" content="">');await writeFile(join(root,'assets','account-123.js'),'export {};');return root;}
function options(){return {appOrigin:'https://stylist.test',projectUrl:'https://fixture.supabase.co',serviceKey:'synthetic-service-key-only',fetch:vi.fn(async()=>Response.json(0)),refreshKeyring:new Map([['fixture',new Uint8Array(32).fill(5)]]),activeRefreshKeyId:'fixture',initialExpiry:()=>Date.now()+60000,rotatedExpiry:()=>Date.now()+60000};}
it('prepares complete delivery without network, starts explicitly and closes idempotently',async()=>{
 const root=await fixture(),config=options();try{const app=await prepareAccountApplication(config,root);expect(config.fetch).not.toHaveBeenCalled();expect(app.health().status).toBe('inactive');expect(Object.keys(app).sort()).toEqual(['close','handle','health','maintain','start']);expect(await app.start()).toBe(true);expect(config.fetch).toHaveBeenCalledOnce();expect(app.health().status).toBe('ready');expect(await app.close()).toBe(true);expect(await app.close()).toBe(true);expect(await app.start()).toBe(false);}finally{await rm(root,{recursive:true,force:true});}
});
it('refuses missing/malformed builds before any service work',async()=>{
 const root=await fixture(),config=options();try{await writeFile(join(root,'account.html'),'<html>missing configuration</html>');await expect(prepareAccountApplication(config,root)).rejects.toThrow();expect(config.fetch).not.toHaveBeenCalled();await expect(prepareAccountApplication(config,join(root,'missing'))).rejects.toThrow();expect(config.fetch).not.toHaveBeenCalled();}finally{await rm(root,{recursive:true,force:true});}
});
