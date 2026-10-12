export default {createCallObject(){
 const handlers={},number=++window.recoveryFixture.created;let destroyed=false;
 const participant={local:false,session_id:'pal-'+number,tracks:{audio:{persistentTrack:{id:'a'+number}},video:{persistentTrack:{id:'v'+number}}}};
 return {on(event,handler){handlers[event]=handler;},async join(){handlers['participant-joined']?.({participant});},participants(){return {pal:participant};},sendAppMessage(payload){window.recoveryFixture.messages.push(payload.event_type);},async destroy(){if(number===1 && window.recoveryFixture.messages.at(-1)!=='conversation.interrupt')throw Error('Interrupt was not sent before destruction');window.recoveryFixture.destroyed++;destroyed=true;},isDestroyed(){return destroyed;}};
}};
