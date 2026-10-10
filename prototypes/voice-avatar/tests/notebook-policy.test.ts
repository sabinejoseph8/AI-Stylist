import {describe,it,expect} from 'vitest';
import {createPrototypeServer} from '../src/server.ts';
import type {AddressInfo} from 'node:net';
describe('notebook page privacy policy',()=>{
 it.each(['/notebook.html','/notebook.html?review=1'])('blocks network and microphone for %s',async path=>{
  const server=createPrototypeServer();await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  try{const response=await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${path}`);await response.arrayBuffer();expect(response.headers.get('content-security-policy')).toContain("connect-src 'none'");expect(response.headers.get('permissions-policy')).toBe('microphone=(), camera=(self), geolocation=()');expect(response.headers.get('cache-control')).toBe('no-store');}
  finally{await new Promise<void>((r,j)=>server.close(e=>e?j(e):r()));}
 });
});
