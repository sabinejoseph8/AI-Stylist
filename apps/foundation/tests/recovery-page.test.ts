import {it,expect,vi} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {prepareRecoveryPage,RecoveryPage} from '../src/web/recovery-page.tsx';
const origin='https://stylist.example';
const configuration=()=>({expiresAt:Date.now()+60000,provider:{reset:async()=>({status:'resetComplete' as const})}});
it('prepares only a clean reset return path without deriving permission from query data',async()=>{
 const load=vi.fn(async()=>configuration());const signal=new AbortController().signal;
 for(const path of ['/account','/account/reset?token=value','/account/reset#grant','https://foreign.example/account/reset'])await expect(prepareRecoveryPage(origin,path,load,signal)).rejects.toThrow();
 expect(load).not.toHaveBeenCalled();expect((await prepareRecoveryPage(origin,'/account/reset',load,signal)).provider.reset).toBeTypeOf('function');
});
it('refuses expired metadata and canceled late preparation',async()=>{
 const controller=new AbortController();
 await expect(prepareRecoveryPage(origin,'/account/reset',async()=>({...configuration(),expiresAt:Date.now()-1}),controller.signal)).rejects.toThrow();
 await expect(prepareRecoveryPage(origin,'/account/reset',async()=>{controller.abort();return configuration();},controller.signal)).rejects.toThrow();
});
it('renders a permission check without starting a request during server rendering or showing password fields',()=>{
 const load=vi.fn(async()=>configuration());const html=renderToStaticMarkup(React.createElement(RecoveryPage,{origin,href:'/account/reset',load,onClose:()=>{}}));
 expect(html).toContain('class="card account-panel"');expect(html).toContain('Checking recovery permission');expect(html).not.toContain('type="password"');expect(load).not.toHaveBeenCalled();
});
