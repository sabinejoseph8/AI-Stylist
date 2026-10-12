import {it,expect,vi,afterEach} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createRecoveryFlow} from '../src/web/recovery-flow.ts';
import {RecoveryPanel} from '../src/web/recovery-panel.tsx';
afterEach(()=>vi.useRealTimers());
it('requires matching passwords, clears identity from presentation and permits one dispatch',async()=>{
 const reset=vi.fn(async()=>({status:'resetComplete' as const})),flow=createRecoveryFlow({reset},Date.now()+60000);
 await flow.submit('made-up','different');expect(reset).not.toHaveBeenCalled();expect(flow.snapshot().status).toBe('error');
 await flow.submit('made-up','made-up');expect(flow.snapshot().status).toBe('complete');expect(flow.snapshot().message).toContain('Sign in');expect(JSON.stringify(flow.snapshot())).not.toContain('made-up');await flow.submit('another','another');expect(reset).toHaveBeenCalledTimes(1);
});
it('refuses expired reset permission',async()=>{
 const reset=vi.fn(),flow=createRecoveryFlow({reset},Date.now()-1);await flow.submit('made-up','made-up');expect(flow.snapshot().status).toBe('expired');expect(reset).not.toHaveBeenCalled();
});
it('cancellation discards late completion and prevents retry',async()=>{
 let resolve!:(v:{status:'resetComplete'})=>void;const reset=vi.fn(()=>new Promise<{status:'resetComplete'}>(r=>resolve=r)),flow=createRecoveryFlow({reset},Date.now()+60000);
 const work=flow.submit('made-up','made-up');await Promise.resolve();flow.cancel();resolve({status:'resetComplete'});await work;expect(flow.snapshot().status).toBe('canceled');await flow.submit('again','again');expect(reset).toHaveBeenCalledTimes(1);
});
it('timeout never retries an uncertain change or exposes provider errors',async()=>{
 vi.useFakeTimers();const reset=vi.fn(()=>new Promise<{status:'resetComplete'}>(()=>{})),flow=createRecoveryFlow({reset},Date.now()+60000,20);
 const work=flow.submit('made-up','made-up');await vi.advanceTimersByTimeAsync(21);await work;expect(flow.snapshot().message).toContain('unconfirmed');await flow.submit('again','again');expect(reset).toHaveBeenCalledTimes(1);
});
it('renders labeled reset confirmation and an explicit simulation notice',()=>{
 const html=renderToStaticMarkup(React.createElement(RecoveryPanel,{onClose:()=>{}}));expect(html).toContain('Confirm new password');expect(html).toContain('No recovery link was verified');expect(html).toContain('role="status"');expect(html).not.toContain('type="email"');
});
