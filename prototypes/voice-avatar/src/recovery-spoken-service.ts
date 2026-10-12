import { randomUUID } from 'node:crypto';
import { ExperimentBudget } from './experiment-budget.ts';
import { ScriptedService } from './scripted-service.ts';
import { ConfirmedConversation } from './confirmed-conversation.ts';
import { generateSpokenReply, validateSpokenAudio } from './scripted-providers.ts';

/** Dedicated approved experiment. Not installed in any HTTP route yet. Browser
 * replacement must additionally wait for verified local renderer destruction. */
export class RecoverySpokenService {
  private room: ScriptedService;
  private budget: ExperimentBudget;
  private key: string;
  private context = new ConfirmedConversation();
  private abort = new AbortController();
  private pair: readonly [string,string] | null = null;
  private phase: 'idle'|'initial'|'replacing'|'replacement'|'ended'|'held' = 'idle';
  private busy = false;
  private sessionId = '';
  private turns = 0;
  private generation = 0;
  constructor(keys: {openai:string;tavus:string}, budget: ExperimentBudget) {
    this.budget=budget;this.key=keys.openai;
    this.room=new ScriptedService(keys,budget,true,()=>{this.abort.abort();this.context.clear();});
  }
  snapshot() { return {...this.room.snapshot(),phase:this.phase,turns:this.turns,awaitingConfirmation:this.context.awaitingConfirmation(),generating:this.busy,turnLimit:3}; }
  heartbeat() { this.room.heartbeat(); }
  private check(id:string) { if (!id || id!==this.sessionId) throw new Error('Stale recovery test.'); }
  async start(id:string) {
    if(this.phase!=='idle'||this.busy||!/^[a-f0-9-]{36}$/.test(id))throw new Error('Recovery test unavailable.');
    this.busy=true;this.sessionId=id;this.phase='initial';
    try { this.pair=await this.budget.reserveRecoveryPair();if(this.phase!=='initial')throw new Error();await this.room.start(this.pair[0]);
      if(this.phase!=='initial'||this.room.snapshot().state!=='ready')throw new Error('Initial room unavailable.');
    } catch {this.phase='held';throw new Error('Recovery preparation stopped; cleanup needs review.');}
    finally {this.busy=false;}
  }
  connect(id:string) {this.check(id);if(!['initial','replacement'].includes(this.phase))throw new Error('Recovery room unavailable.');return this.room.connect();}
  async turn(audio:string,id:string) {
    this.check(id);validateSpokenAudio(audio);
    if(this.busy||!['initial','replacement'].includes(this.phase)||this.room.snapshot().state!=='connected'||this.context.awaitingConfirmation()||this.turns>=3||this.abort.signal.aborted)throw new Error('Recovery turn unavailable.');
    this.busy=true;this.turns++;const generation=this.generation;const revision=this.context.revision();const signal=this.abort.signal;
    try {const reply=await generateSpokenReply(this.key,signal,audio,this.context.history());
      if(signal.aborted||generation!==this.generation||this.room.snapshot().state!=='connected')throw new Error();
      const replyId=randomUUID();this.context.stage(revision,replyId,audio,reply.transcript);
      return {id:replyId,pcm:reply.pcm.toString('base64'),transcript:reply.transcript};
    } catch {if(generation===this.generation)await this.end(id);throw new Error('Recovery reply canceled.');}
    finally {this.busy=false;}
  }
  confirmHeard(replyId:string,id:string) {this.check(id);if(this.abort.signal.aborted||this.room.snapshot().state!=='connected'||!['initial','replacement'].includes(this.phase))throw new Error('Stale confirmation.');this.context.confirm(replyId);return this.snapshot();}
  async replace(id:string) {
    this.check(id);
    if(this.phase!=='initial'||!this.pair||this.busy||!this.context.awaitingConfirmation()||this.room.snapshot().state!=='connected'||this.room.snapshot().remainingSeconds<=0||this.turns<1)throw new Error('Replacement unavailable.');
    this.phase='replacing';this.generation++;this.abort.abort();this.context.discardPending();const confirmed=this.context.capture();
    await this.room.stop();
    if(this.phase!=='replacing'||this.room.snapshot().state!=='ended') {this.phase='held';throw new Error('Old room closure unverified.');}
    this.context=new ConfirmedConversation();
    for(const pair of confirmed.history){const replyId=randomUUID();this.context.stage(this.context.revision(),replyId,pair.audio,pair.reply);this.context.confirm(replyId);}
    this.abort=new AbortController();await this.room.start(this.pair[1]);
    if(this.phase!=='replacing'||this.room.snapshot().state!=='ready'){await this.room.stop();this.context.clear();this.phase='held';throw new Error('Replacement stopped.');}
    this.phase='replacement';
  }
  async end(id:string) {this.check(id);await this.stop();}
  async stop() {this.phase='ended';this.generation++;this.abort.abort();this.context.clear();await this.room.stop();if(this.room.snapshot().state==='held')this.phase='held';}
}
