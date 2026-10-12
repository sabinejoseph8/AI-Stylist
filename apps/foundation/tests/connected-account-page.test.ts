import {it,expect,vi} from 'vitest';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ConnectedAccountPage} from '../src/web/connected-account-page.tsx';
const origin='https://stylist.test',projectUrl='https://fixture.supabase.co';
it('renders connected account copy without simulated controls or provider work',()=>{
 const send=vi.fn(),navigate=vi.fn();const html=renderToStaticMarkup(React.createElement(ConnectedAccountPage,{origin,href:origin+'/account',projectUrl,send,navigate}));
 expect(html).toContain('Account access');expect(html).toContain('Create account');expect(html).not.toContain('Simulated account preview');expect(html).not.toContain('Preview sign-in');expect(send).not.toHaveBeenCalled();expect(navigate).not.toHaveBeenCalled();
});
it('renders reset as server-permission loading, never as signed-in state',()=>{
 const send=vi.fn();const html=renderToStaticMarkup(React.createElement(ConnectedAccountPage,{origin,href:origin+'/account/reset',projectUrl,send,navigate:vi.fn()}));expect(html).toContain('Checking recovery permission');expect(html).not.toContain('Sign-in completed');expect(send).not.toHaveBeenCalled();
});
it('shows fixed callback notices and rejects proof-bearing reset routes',()=>{
 const props={origin,projectUrl,send:vi.fn(),navigate:vi.fn()};
 expect(renderToStaticMarkup(React.createElement(ConnectedAccountPage,{...props,href:origin+'/account?status=canceled'}))).toContain('Sign-in was canceled');
 expect(renderToStaticMarkup(React.createElement(ConnectedAccountPage,{...props,href:origin+'/account/reset?token=secret'}))).toContain('This account page is unavailable');
 expect(props.send).not.toHaveBeenCalled();
});
