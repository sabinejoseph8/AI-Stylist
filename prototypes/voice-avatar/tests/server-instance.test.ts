import { describe, expect, it } from 'vitest';
import { serverChanged } from '../src/server-instance.ts';
describe('server restart detection',()=>{
  it('does not treat first contact or repeated polling as a restart',()=>{expect(serverChanged('','first')).toBe(false);expect(serverChanged('first','first')).toBe(false);});
  it('detects replacement and rejects missing server identity',()=>{expect(serverChanged('first','second')).toBe(true);expect(()=>serverChanged('first',null)).toThrow();});
});
