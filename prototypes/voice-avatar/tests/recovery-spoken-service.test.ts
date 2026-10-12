import { beforeEach, describe, expect, it, vi } from 'vitest';
const f=vi.hoisted(()=>({state:'idle',closed:true,starts:[] as string[],stop:vi.fn(),generate:vi.fn()}));
vi.mock('../src/scripted-service.ts',()=>({ScriptedService:class {
 async start(id:string){f.starts.push(id);f.state='ready';}snapshot(){return {state:f.state,remainingSeconds:60};}
 connect(){f.state='connected';return {conversationId:f.starts.at(-1)};}heartbeat(){}
 async stop(){f.stop();f.state=f.closed?'ended':'held';}
}}));
vi.mock('../src/scripted-providers.ts',async importOriginal=>({...await importOriginal<object>(),generateSpokenReply:f.generate}));
import { RecoverySpokenService } from '../src/recovery-spoken-service.ts';
import type { ExperimentBudget } from '../src/experiment-budget.ts';
const id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',audio=Buffer.alloc(9600).toString('base64');
function fixture(){const reserveRecoveryPair=vi.fn(async()=>['first','second'] as const);return {reserveRecoveryPair,service:new RecoverySpokenService({openai:'fake',tavus:'fake'},{reserveRecoveryPair} as unknown as ExperimentBudget)};}
beforeEach(()=>{f.state='idle';f.closed=true;f.starts=[];f.stop.mockReset();f.generate.mockReset().mockResolvedValue({pcm:Buffer.alloc(9600),transcript:'reply',inputTokens:1,outputTokens:1});});
describe('dedicated replacement lifecycle, simulated providers only',()=>{
 it('preserves confirmed history, discards interrupted reply, and admits one replacement',async()=>{
  const {service,reserveRecoveryPair}=fixture();await service.start(id);service.connect(id);const first=await service.turn(audio,id);service.confirmHeard(first.id,id);
  await service.turn(audio,id);await service.replace(id);expect(f.starts).toEqual(['first','second']);expect(reserveRecoveryPair).toHaveBeenCalledOnce();service.connect(id);await service.turn(audio,id);
  expect(f.generate.mock.calls[2]![3]).toEqual([{audio,reply:'reply'}]);await expect(service.replace(id)).rejects.toThrow();await service.end(id);expect(service.snapshot().phase).toBe('ended');
 });
 it('holds without opening a replacement on unverified room closure',async()=>{
  const {service}=fixture();await service.start(id);service.connect(id);await service.turn(audio,id);f.closed=false;
  await expect(service.replace(id)).rejects.toThrow();expect(f.starts).toEqual(['first']);expect(service.snapshot().phase).toBe('held');
 });
 it('refuses stale sessions and replacement after expiry or without pending playback',async()=>{
  const {service}=fixture();await service.start(id);service.connect(id);await expect(service.replace(id)).rejects.toThrow();await expect(service.turn(audio,'stale')).rejects.toThrow();
  await service.turn(audio,id);f.state='ended';await expect(service.replace(id)).rejects.toThrow();expect(f.starts).toEqual(['first']);
 });
 it('does not create a room if end races reservation completion',async()=>{
  let release!:(pair:readonly[string,string])=>void;
  const service=new RecoverySpokenService({openai:'fake',tavus:'fake'},{reserveRecoveryPair:()=>new Promise(resolve=>{release=resolve;})} as unknown as ExperimentBudget);
  const start=service.start(id);const failed=expect(start).rejects.toThrow();await service.end(id);release(['first','second']);await failed;expect(f.starts).toEqual([]);
 });
});
