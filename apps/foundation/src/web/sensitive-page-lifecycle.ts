/** Clear volatile form data on exit and again after a cached-page return.
 * No storage, network, remote sign-out or credential revocation occurs here. */
export function bindSensitivePageLifecycle(target:Pick<Window,'addEventListener'|'removeEventListener'>,clear:()=>void){
 const leave=()=>clear();
 const returnToPage=(event:Event)=>{if('persisted' in event&&event.persisted===true)clear();};
 target.addEventListener('pagehide',leave);target.addEventListener('pageshow',returnToPage);
 return()=>{target.removeEventListener('pagehide',leave);target.removeEventListener('pageshow',returnToPage);};
}
/** Page-exit rendering may pause before React commits. Erase visible field
 * values synchronously as well as clearing their controlled state. */
export function clearSensitiveFieldValues(fields:readonly ({value:string}|null)[]){for(const field of fields)if(field)field.value='';}
