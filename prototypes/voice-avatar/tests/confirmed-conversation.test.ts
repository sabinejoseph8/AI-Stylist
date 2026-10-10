import { describe, expect, it } from 'vitest';
import { ConfirmedConversation } from '../src/confirmed-conversation.ts';
const AUDIO=Buffer.alloc(9600).toString('base64');
describe('volatile confirmed conversation memory',()=>{
  it('excludes generated and interrupted replies until explicit confirmation',()=>{
    const context=new ConfirmedConversation();context.stage(context.revision(),'first',AUDIO,'Unheard reply');
    expect(context.history()).toEqual([]);expect(context.awaitingConfirmation()).toBe(true);
    context.discardPending();expect(context.capture().history).toEqual([]);expect(()=>context.confirm('first')).toThrow();
  });
  it('preserves only the last confirmed exchange when discarding a pending correction',()=>{
    const context=new ConfirmedConversation();context.stage(context.revision(),'first',AUDIO,'Confirmed reply');context.confirm('first');
    context.stage(context.revision(),'second',AUDIO,'Unheard correction');context.discardPending();
    expect(context.history()).toEqual([{audio:AUDIO,reply:'Confirmed reply'}]);
  });
  it('refuses duplicate, unknown and stale confirmations',()=>{
    const context=new ConfirmedConversation();context.stage(context.revision(),'first',AUDIO,'Reply');
    expect(()=>context.confirm('other')).toThrow();context.confirm('first');expect(()=>context.confirm('first')).toThrow();
    expect(()=>context.stage(context.revision(),'first',AUDIO,'Duplicate')).toThrow();
  });
  it('rejects generation that finishes after its context was invalidated',()=>{
    const context=new ConfirmedConversation(),old=context.revision();context.discardPending();
    expect(()=>context.stage(old,'late',AUDIO,'Late')).toThrow();expect(context.history()).toEqual([]);
  });
  it('exports immutable recovery copies and detects subsequent context changes',()=>{
    const context=new ConfirmedConversation();context.stage(context.revision(),'first',AUDIO,'Reply');context.confirm('first');
    const snapshot=context.capture();expect(context.matches(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot)).toBe(true);expect(Object.isFrozen(snapshot.history)).toBe(true);expect(Object.isFrozen(snapshot.history[0])).toBe(true);
    const copy=context.history();copy[0]!.reply='Altered';expect(context.history()[0]!.reply).toBe('Reply');
    context.clear();expect(context.matches(snapshot)).toBe(false);expect(context.history()).toEqual([]);
  });
  it('bounds the prototype to two staged exchanges and one confirmed history pair',()=>{
    const context=new ConfirmedConversation();for(let i=0;i<2;i++){context.stage(context.revision(),String(i),AUDIO,`Reply ${i}`);context.confirm(String(i));}
    expect(context.history()).toHaveLength(1);expect(()=>context.stage(context.revision(),'third',AUDIO,'Reply')).toThrow();
  });
  it('rejects malformed input and excessive or empty reply text',()=>{
    const context=new ConfirmedConversation();for(const [audio,reply] of [['bad','Reply'],[AUDIO,''],[AUDIO,' '],[AUDIO,'x'.repeat(1001)]])expect(()=>context.stage(context.revision(),'bad',audio!,reply!)).toThrow();
    expect(context.awaitingConfirmation()).toBe(false);
  });
  it('invalidates a recovery snapshot when a new reply becomes pending',()=>{
    const context=new ConfirmedConversation(),snapshot=context.capture();context.stage(context.revision(),'new',AUDIO,'Reply');
    expect(context.matches(snapshot)).toBe(false);
  });
  it('clears all volatile content on end or replacement',()=>{
    const context=new ConfirmedConversation();context.stage(context.revision(),'first',AUDIO,'Reply');context.confirm('first');
    context.stage(context.revision(),'second',AUDIO,'Pending');context.clear();expect(context.capture().history).toEqual([]);expect(context.awaitingConfirmation()).toBe(false);
    expect(new ConfirmedConversation().history()).toEqual([]);
  });
});
