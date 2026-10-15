/** These photo dialogs contain one interactive control: their Close button. */
export function containPhotoDialogTab(event:{key:string;preventDefault:()=>void},close:{focus:()=>void}|null){
 if(event.key!=='Tab'||!close)return;
 event.preventDefault();close.focus();
}
/** Focus confirmation context on entry, and restore the initiating control on exit. */
export function focusPrivacyConfirmation(visible:boolean,confirming:boolean,returnRequested:boolean,heading:{focus:()=>void}|null,origin:{focus:()=>void}|null){
 if(!visible)return;
 if(confirming)heading?.focus();else if(returnRequested)origin?.focus();
}
/** Only explicit export actions move focus; background status updates do not. */
export function focusExportAction(visible:boolean,action:'prepare'|'cancel'|null,cancelable:boolean,prepare:{focus:()=>void}|null,cancel:{focus:()=>void}|null){
 if(!visible||action===null)return;
 if(action==='prepare'&&cancelable)cancel?.focus();else prepare?.focus();
}
