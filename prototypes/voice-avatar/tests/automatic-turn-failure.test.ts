import {expect,it} from 'vitest';
import {automaticTurnFailure} from '../src/automatic-turn-failure.ts';
it.each(['request','playback','stream'] as const)('reports only fixed %s-stage detail and no retry',stage=>{
 const message=automaticTurnFailure(stage);
 expect(message).toContain('Microphone and playback are off. Do not retry.');
 expect(message).toContain(stage==='request'?'before playback':stage==='playback'?'browser playback':'avatar audio delivery');
});
