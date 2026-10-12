import type {IncomingMessage,RequestListener} from 'node:http';
/** Deployment transport boundary. Forwarded headers never establish proxy trust on their own.
 * A proxy capability must verify the immediate peer through separately configured infrastructure. */
export function createAccountTransport(origin:string,listener:RequestListener,trustProxy?:(request:IncomingMessage)=>boolean):RequestListener{
 const base=new URL(origin);if(base.protocol!=='https:'||base.origin!==origin||typeof listener!=='function'||(trustProxy!==undefined&&typeof trustProxy!=='function'))throw Error('Account transport unavailable');
 return (request,response)=>{
  try{
   const seen=new Set<string>();
   for(let index=0;index<request.rawHeaders.length;index+=2){const name=request.rawHeaders[index]!.toLowerCase();if(['host','origin','cookie','authorization','x-forwarded-proto','x-forwarded-host','forwarded'].includes(name)){if(seen.has(name))throw Error();seen.add(name);}}
   if(request.headers.host!==base.host)throw Error();
   const encrypted=(request.socket as typeof request.socket&{encrypted?:boolean}).encrypted===true;
   if(!encrypted){
    if(!trustProxy||trustProxy(request)!==true||request.headers['x-forwarded-proto']!=='https')throw Error();
    const forwardedHost=request.headers['x-forwarded-host'];if(forwardedHost!==undefined&&forwardedHost!==base.host)throw Error();
    // Do not interpret competing RFC Forwarded chains or comma-separated scheme claims.
    if(request.headers.forwarded!==undefined)throw Error();
   }
   listener(request,response);
  }catch{
   if(!response.headersSent&&!response.destroyed){response.writeHead(400,{'cache-control':'no-store','content-type':'application/json'});response.end('{"status":"unavailable"}');}
   else if(!response.destroyed)response.destroy();
  }
 };
}
