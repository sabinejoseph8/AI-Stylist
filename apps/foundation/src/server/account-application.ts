import {loadAccountBuild} from './account-build.ts';
import {createSupabaseAccountHost,type SupabaseAccountHostOptions} from './supabase-account-host.ts';
import {createAccountWebsite} from './account-website.ts';
/** Explicit application preparation. No environment lookup, socket, timer or provider call.
 * Deployment owns the build directory, TLS/proxy, listener and graceful network shutdown. */
export async function prepareAccountApplication(options:SupabaseAccountHostOptions,buildDirectory:string){
 const build=await loadAccountBuild(buildDirectory);
 const host=createSupabaseAccountHost(options);
 try{
  const handle=createAccountWebsite(options.appOrigin,options.projectUrl,host,build.html,build.assets);
  return Object.freeze({...host,handle});
 }catch(error){await host.close();throw error;}
}
