import type {IncomingMessage,ServerResponse} from 'node:http';
import type {createAccountHost} from './account-host.ts';
/** Explicit immutable build inputs only. Caller owns reading the build, TLS, listening and shutdown. */
export function createAccountWebsite(origin:string,projectUrl:string,host:Pick<ReturnType<typeof createAccountHost>,'handle'>,accountHtml:string,assets:ReadonlyMap<string,Uint8Array>){
 const app=new URL(origin),project=new URL(projectUrl);
 if(app.protocol!=='https:'||app.origin!==origin||app.username||app.password||project.protocol!=='https:'||project.origin!==projectUrl||project.port||!/^[-a-z0-9]+\.supabase\.co$/.test(project.hostname)||typeof host?.handle!=='function'||typeof accountHtml!=='string'||Buffer.byteLength(accountHtml)>65536||assets.size<1||assets.size>32)throw Error('Account website unavailable');
 const placeholder='<meta name="stylist-project-origin" content="">';
 if(accountHtml.split(placeholder).length!==2)throw Error('Account website configuration unavailable');
 const html=Buffer.from(accountHtml.replace(placeholder,`<meta name="stylist-project-origin" content="${project.origin}">`));
 const files=new Map<string,Buffer>();let size=html.length;
 for(const [path,bytes] of assets){
  if(!/^\/assets\/[A-Za-z0-9_-]+\.(js|css)$/.test(path)||!(bytes instanceof Uint8Array)||bytes.length===0)throw Error('Account asset unavailable');
  size+=bytes.length;if(size>5*1024*1024)throw Error('Account build limit');files.set(path,Buffer.from(bytes));
 }
 const headers={'cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"};
 function refuse(response:ServerResponse,status:number){response.writeHead(status,{...headers,'content-type':'text/plain; charset=utf-8'});response.end('Account page unavailable');}
 return (request:IncomingMessage,response:ServerResponse)=>{
  const hosts=request.rawHeaders.filter((_v,index)=>index%2===0&&request.rawHeaders[index].toLowerCase()==='host');
  if(hosts.length!==1||request.headers.host!==app.host){refuse(response,400);return;}
  const raw=request.url??'';let url:URL;
  try{if(!raw.startsWith('/')||raw.startsWith('//')||raw.includes('#')||raw.includes('\\'))throw Error();url=new URL(raw,origin);if(url.origin!==origin)throw Error();}catch{refuse(response,400);return;}
  const isPage=url.pathname==='/account'||url.pathname==='/account/reset';
  const file=files.get(url.pathname);
  if(!isPage&&!file){void host.handle(request,response);return;}
  if(request.method!=='GET'&&request.method!=='HEAD'){refuse(response,405);return;}
  if(raw.split('?')[0]!==url.pathname){refuse(response,400);return;}
  if(url.search&&(url.pathname!=='/account'||![ '?status=canceled','?status=busy','?status=unavailable'].includes(url.search))){refuse(response,400);return;}
  const data=isPage?html:file!;
  response.writeHead(200,{...headers,'content-type':isPage?'text/html; charset=utf-8':url.pathname.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8','content-length':data.length});
  response.end(request.method==='HEAD'?undefined:data);
 };
}
