import {expect,it,vi} from 'vitest';
import {containPhotoDialogTab,focusPrivacyConfirmation} from '../src/web/dialog-focus.ts';
it('contains forward and backward Tab within the single-control photo dialog',()=>{
 for(const shiftKey of [false,true]){const event={key:'Tab',shiftKey,preventDefault:vi.fn()},close={focus:vi.fn()};containPhotoDialogTab(event,close);expect(event.preventDefault).toHaveBeenCalledOnce();expect(close.focus).toHaveBeenCalledOnce();}
});
it('leaves Escape and other keys to native dialog behavior',()=>{
 for(const key of ['Escape','Enter','ArrowDown']){const event={key,preventDefault:vi.fn()},close={focus:vi.fn()};containPhotoDialogTab(event,close);expect(event.preventDefault).not.toHaveBeenCalled();expect(close.focus).not.toHaveBeenCalled();}
});
it('does not prevent Tab when the dialog has no close target',()=>{const event={key:'Tab',preventDefault:vi.fn()};containPhotoDialogTab(event,null);expect(event.preventDefault).not.toHaveBeenCalled();});
it('focuses confirmation context rather than the disabled initiating control',()=>{const heading={focus:vi.fn()},origin={focus:vi.fn()};focusPrivacyConfirmation(true,true,false,heading,origin);expect(heading.focus).toHaveBeenCalledOnce();expect(origin.focus).not.toHaveBeenCalled();});
it('returns focus after cancellation or completion only when requested',()=>{const heading={focus:vi.fn()},origin={focus:vi.fn()};focusPrivacyConfirmation(true,false,true,heading,origin);expect(origin.focus).toHaveBeenCalledOnce();expect(heading.focus).not.toHaveBeenCalled();});
it('ordinary status updates and hidden panels never steal focus',()=>{const heading={focus:vi.fn()},origin={focus:vi.fn()};focusPrivacyConfirmation(true,false,false,heading,origin);focusPrivacyConfirmation(false,true,true,heading,origin);expect(heading.focus).not.toHaveBeenCalled();expect(origin.focus).not.toHaveBeenCalled();});
import {focusExportAction} from '../src/web/dialog-focus.ts';
it('moves an explicit preparation to its enabled Cancel control',()=>{const prepare={focus:vi.fn()},cancel={focus:vi.fn()};focusExportAction(true,'prepare',true,prepare,cancel);expect(cancel.focus).toHaveBeenCalledOnce();expect(prepare.focus).not.toHaveBeenCalled();});
it('cancellation and failed preparation return to Prepare',()=>{for(const action of ['prepare','cancel'] as const){const prepare={focus:vi.fn()},cancel={focus:vi.fn()};focusExportAction(true,action,false,prepare,cancel);expect(prepare.focus).toHaveBeenCalledOnce();expect(cancel.focus).not.toHaveBeenCalled();}});
it('background export status and hidden panels do not move focus',()=>{const prepare={focus:vi.fn()},cancel={focus:vi.fn()};focusExportAction(true,null,true,prepare,cancel);focusExportAction(false,'prepare',true,prepare,cancel);expect(prepare.focus).not.toHaveBeenCalled();expect(cancel.focus).not.toHaveBeenCalled();});
