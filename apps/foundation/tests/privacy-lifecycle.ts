import '../src/web/main.tsx';
const report=()=>{document.querySelector('#privacy-result')!.textContent=[...document.querySelectorAll<HTMLInputElement>('input[type=password],#account-email')].every(input=>input.value==='')?'Sensitive fields cleared synchronously.':'Sensitive fields remain populated.';};
document.querySelector('#privacy-leave')!.addEventListener('click',()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));report();});
document.querySelector('#privacy-return')!.addEventListener('click',()=>{window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));report();});

document.querySelector('#privacy-storage')!.addEventListener('click',async()=>{let databases:number|'unavailable'='unavailable';try{if(typeof indexedDB.databases==='function')databases=(await indexedDB.databases()).length;}catch{}document.querySelector('#privacy-storage-result')!.textContent=JSON.stringify({localEntries:localStorage.length,sessionEntries:sessionStorage.length,indexedDatabases:databases});});
