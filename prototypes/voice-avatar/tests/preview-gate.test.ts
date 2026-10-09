import { afterEach, describe, expect, it, vi } from 'vitest';
import { request as httpRequest } from 'node:http';
function request(url: string, options: {method?:string;headers:Record<string,string>}) { return new Promise<Response>((resolve,reject)=>{
 const call=httpRequest(url,options,response=>{const chunks:Buffer[]=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:response.statusCode,headers:response.headers as Record<string,string>})));});
 call.on('error',reject);call.end();
}); }
import { PreviewGate, validatePreview } from '../src/preview-gate.ts';
import { createPrototypeServer } from '../src/server.ts';
const config={origin:'https://fixture.onrender.com',password:'fixture_password_only_for_tests_123456'};
const authorization='Basic '+Buffer.from('stylist:'+config.password).toString('base64');
afterEach(()=>vi.useRealTimers());
describe('private preview access',()=>{
  it('rejects missing, weak or non-HTTPS Render configuration',()=>{
    for(const origin of ['http://fixture.onrender.com','https://evil.example','https://fixture.onrender.com/path','https://user@fixture.onrender.com']) expect(()=>validatePreview({...config,origin})).toThrow();
    expect(()=>validatePreview({...config,password:'weak'})).toThrow();
  });
  it('accepts the base64 format used by Render generated secrets',()=>{expect(()=>validatePreview({...config,password:'abcdEFGH0123+/abcdEFGH0123+/abcdEFGH0123+/ab=='})).not.toThrow();});
  it('requires the correct credentials and bounds failed guesses without locking out the owner',()=>{
    vi.useFakeTimers();const gate=new PreviewGate(config);expect(gate.check(undefined)).toBe(401);
    for(let i=0;i<59;i++) expect(gate.check('Basic bad')).toBe(401);
    expect(gate.check(undefined)).toBe(429);expect(gate.check(authorization)).toBe(200);
    vi.advanceTimersByTime(60000);expect(gate.check(undefined)).toBe(401);
  });
  it('protects pages and owner-cookie issuance, with a minimal public health check',async()=>{
    const server=createPrototypeServer({preview:config});await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    try{
      const address=server.address();if(!address||typeof address==='string')throw new Error();const base=`http://127.0.0.1:${address.port}`;
      const headers={Host:'fixture.onrender.com'};
      for(const path of ['/spoken.html','/api/status','/api/experiment-budget']){
        const response=await request(base+path,{headers});expect(response.status).toBe(401);expect(response.headers.get('set-cookie')).toBeNull();expect(response.headers.get('www-authenticate')).toContain('Basic');
      }
      const response=await request(base+'/api/status',{headers:{...headers,Authorization:authorization}});
      expect(response.status).toBe(200);expect(response.headers.get('set-cookie')).toContain('; Secure');expect(response.headers.get('strict-transport-security')).toBeTruthy();
      const health=await request(base+'/healthz',{headers});expect(await health.json()).toEqual({ok:true});expect(health.headers.get('set-cookie')).toBeNull();
      expect((await request(base+'/api/status',{headers:{Host:'evil.example',Authorization:authorization}})).status).toBe(403);
      const cookie=response.headers.get('set-cookie')!.split(';')[0]!;
      expect((await request(base+'/api/start',{method:'POST',headers:{...headers,Authorization:authorization,Cookie:cookie,Origin:'https://evil.example'}})).status).toBe(403);
      expect((await request(base+'/api/start',{method:'POST',headers:{...headers,Authorization:authorization,Cookie:cookie,Origin:config.origin}})).status).toBe(200);
    }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
  });
});
