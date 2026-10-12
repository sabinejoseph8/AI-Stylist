import {it,expect} from 'vitest';
import {resolveAccountPage} from '../src/web/account-page.ts';
const origin='https://stylist.example';
it('recognizes only presentation notices and reset pages requiring server permission',()=>{
 expect(resolveAccountPage(origin,'/account')).toEqual({page:'account',notice:'none'});
 for(const status of ['canceled','busy','unavailable'])expect(resolveAccountPage(origin,'/account?status='+status)).toEqual({page:'account',notice:status});
 expect(resolveAccountPage(origin,'/account/reset')).toEqual({page:'reset',requiresServerPermission:true});
});
it('refuses token-like URL data, duplicate statuses, foreign origins and browser callbacks',()=>{
 for(const path of ['/account?status=signedIn','/account?status=busy&status=busy','/account?token=secret','/account/reset?grant=secret','/account/reset#token','/auth/callback/google?code=secret','https://evil.example/account','https://user@stylist.example/account'])expect(resolveAccountPage(origin,path)).toEqual({page:'invalid'});
 expect(resolveAccountPage(origin,'/wardrobe')).toEqual({page:'other'});
});
