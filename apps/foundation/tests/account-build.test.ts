import {it,expect} from 'vitest';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {loadAccountBuild} from '../src/server/account-build.ts';
async function fixture(){const root=await mkdtemp(join(tmpdir(),'stylist-build-'));await mkdir(join(root,'assets'));await writeFile(join(root,'account.html'),'<html>Account</html>');await writeFile(join(root,'assets','account-123.js'),'export {};');return root;}
it('loads only bounded deployment build inputs',async()=>{
 const root=await fixture();try{const build=await loadAccountBuild(root);expect(build.html).toBe('<html>Account</html>');expect(new TextDecoder().decode(build.assets.get('/assets/account-123.js'))).toBe('export {};');expect(Object.keys(build)).toEqual(['html','assets']);}finally{await rm(root,{recursive:true,force:true});}
});
it('rejects symlinked files and directories',async()=>{
 const root=await fixture();try{await rm(join(root,'account.html'));await symlink(join(root,'assets','account-123.js'),join(root,'account.html'));await expect(loadAccountBuild(root)).rejects.toThrow();await rm(join(root,'account.html'));await writeFile(join(root,'account.html'),'html');await rm(join(root,'assets'),{recursive:true});await mkdir(join(root,'actual'));await symlink(join(root,'actual'),join(root,'assets'));await expect(loadAccountBuild(root)).rejects.toThrow();}finally{await rm(root,{recursive:true,force:true});}
});
it('rejects unexpected assets, invalid UTF-8 and excessive sizes',async()=>{
 const root=await fixture();try{await writeFile(join(root,'assets','secret.env'),'private');await expect(loadAccountBuild(root)).rejects.toThrow();await rm(join(root,'assets','secret.env'));await writeFile(join(root,'account.html'),new Uint8Array([255]));await expect(loadAccountBuild(root)).rejects.toThrow();await writeFile(join(root,'account.html'),'x'.repeat(65537));await expect(loadAccountBuild(root)).rejects.toThrow();await writeFile(join(root,'account.html'),'html');await writeFile(join(root,'assets','account-123.js'),Buffer.alloc(5*1024*1024));await expect(loadAccountBuild(root)).rejects.toThrow();}finally{await rm(root,{recursive:true,force:true});}
});
it('requires an absolute deployment directory',async()=>{await expect(loadAccountBuild('dist')).rejects.toThrow();});
