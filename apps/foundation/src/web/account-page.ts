export type AccountPage=Readonly<{page:'account';notice:'none'|'canceled'|'busy'|'unavailable'}>|Readonly<{page:'reset';requiresServerPermission:true}>|Readonly<{page:'other'|'invalid'}>;
/** Presentation routing only. Never derives authentication or reset authority from the URL.
 * Callback query data must be consumed on the server, never passed into browser account state. */
export function resolveAccountPage(origin:string,href:string):AccountPage{
 const base=new URL(origin);if(base.protocol!=='https:'||base.origin!==origin)throw Error('Account page unavailable');
 let url:URL;try{url=new URL(href,origin);}catch{return {page:'invalid'};}
 if(url.origin!==origin||url.username||url.password)return {page:'invalid'};
 if(url.pathname==='/account/reset')return url.search||url.hash?{page:'invalid'}:{page:'reset',requiresServerPermission:true};
 if(url.pathname==='/account'){
  if(url.hash)return {page:'invalid'};
  const keys=Array.from(url.searchParams.keys());if(keys.length===0)return {page:'account',notice:'none'};
  const status=url.searchParams.get('status');
  if(keys.join(',')!=='status'||!['canceled','busy','unavailable'].includes(status??''))return {page:'invalid'};
  return {page:'account',notice:status as 'canceled'|'busy'|'unavailable'};
 }
 if(url.pathname.startsWith('/auth/callback/'))return {page:'invalid'};
 return {page:'other'};
}
