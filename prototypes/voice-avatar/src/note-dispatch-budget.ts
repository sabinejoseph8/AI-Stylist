/** Server-owned trial accounting. No network, keys, persistence or live enablement.
 * Counts come from a trusted token counter for the exact dispatched request.
 * Reservations are consumed even if dispatch fails; no reset/refund is exposed. */
export function prepareNoteDispatchBudget(options:{simulation?:boolean}){
 if(options.simulation!==true)throw Error('Live dispatch budget is disabled.');
 let attempts=0,inputTokens=0,outputTokens=0,held=false;
 return Object.freeze({
  reserve(countedInputTokens:number,maxOutputTokens:number){
   if(held)throw Error('Notebook dispatch budget held.');
   if(!Number.isSafeInteger(countedInputTokens)||countedInputTokens<=0||!Number.isSafeInteger(maxOutputTokens)||maxOutputTokens<=0||maxOutputTokens>2048||attempts>=64||inputTokens+countedInputTokens>1_000_000){
    held=true;throw Error('Notebook dispatch budget held.');
   }
   attempts++;inputTokens+=countedInputTokens;outputTokens+=maxOutputTokens;
  },
  hold(){held=true;},
  snapshot(){return Object.freeze({attempts,inputTokens,outputTokens,held,liveEnabled:false as const});}
 });
}
