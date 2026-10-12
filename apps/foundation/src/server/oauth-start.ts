import {createAccountCallbacks} from './account-callback.ts';

/** Local preparation only. The caller must provide its protected initiation route. */
export function createOAuthStart(projectUrl:string,callbacks:ReturnType<typeof createAccountCallbacks>){
 const project=new URL(projectUrl);
 if(project.protocol!=='https:'||project.origin!==projectUrl||project.port||!/^[-a-z0-9]+\.supabase\.co$/.test(project.hostname)||project.username||project.password)throw Error('OAuth configuration unavailable');
 return Object.freeze({
  begin(provider:'google'|'apple',returnPath='/'){
   if(provider!=='google'&&provider!=='apple')throw Error('OAuth request unavailable');
   const flow=callbacks.begin(provider,returnPath);
   const url=new URL('/auth/v1/authorize',project);
   url.searchParams.set('provider',provider);
   url.searchParams.set('redirect_to',flow.callbackUrl);
   url.searchParams.set('code_challenge',flow.challenge);
   url.searchParams.set('code_challenge_method',flow.challengeMethod);
   const binding=flow.cookie.split(';')[0]!.slice('__Host-stylist_flow='.length);
   return Object.freeze({url:url.href,setCookies:Object.freeze([flow.cookie]),
    /** Server-only: abandon a transaction whose response could not be delivered. */
    discard(){callbacks.consume(flow.state,binding,provider);return Promise.resolve(true);},
   });
  },
 });
}
