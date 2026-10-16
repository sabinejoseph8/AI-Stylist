import {expect,it,vi} from 'vitest';
import {createLocalCviViewPort} from '../src/server/local-cvi-view-port.ts';
import {StylingSession} from '../src/session/styling-session.ts';
import {APPROVED_NOTES_RETENTION} from '../src/session/notes-retention-policy.ts';
import {FIELDS} from '../../../packages/style-contracts/src/index.ts';
function fixture(){
 const session=new StylingSession({simulation:true,owner:'sample',clock:()=>0,policy:APPROVED_NOTES_RETENTION});const notes=session.snapshot('sample')!;
 const mapping={occasion:'occasion',season:'timing',color:'color',style:'coverage',budget:'budget',lookType:'lookType',wardrobe:'wardrobe'};
 const current:any={revision:notes.revision,context:{epoch:notes.epoch,nativeRevision:6,inputRevision:2},notes:Object.fromEntries(FIELDS.map(([field])=>[(mapping as any)[field],{text:notes.notes[field].value,confirmed:notes.notes[field].status==='confirmed'}]))};
 const snapshot=vi.fn(async(_r:Request,_s:AbortSignal)=>notes),flow=vi.fn(()=>current),request=new Request('https://app.example.test/notebook',{headers:{authorization:'Bearer captured-sample'}});
 const context:any={snapshot,flow:{snapshot:flow},edit:vi.fn(),clear:vi.fn(),end:vi.fn(),onReset:vi.fn()};return{notes,current,snapshot,flow,request,port:createLocalCviViewPort(context,request)};
}
const signal=()=>new AbortController().signal;
it('observes the complete native/input/note context without exposing identity or release fields',async()=>{
 const x=fixture();expect(await x.port.contextSnapshot(signal())).toEqual({epoch:1,revision:0,nativeRevision:6,inputRevision:2});x.current.context.inputRevision++;x.current.context.nativeRevision++;expect(await x.port.contextSnapshot(signal())).toEqual({epoch:1,revision:0,nativeRevision:7,inputRevision:3});
});
it.each(['epoch','revision','text','confirmed','missing-context','negative-native'] as const)('refuses mismatched or unknown %s without a notes-only fallback',async mode=>{
 const x=fixture();if(mode==='epoch')x.current.context.epoch++;if(mode==='revision')x.current.revision++;if(mode==='text')x.current.notes.occasion.text='Changed';if(mode==='confirmed')x.current.notes.occasion.confirmed=true;if(mode==='missing-context')delete x.current.context;if(mode==='negative-native')x.current.context.nativeRevision=-1;expect(await x.port.contextSnapshot(signal())).toBeNull();
});
it('refuses an unauthenticated or closed note read before inspecting flow state',async()=>{
 const x=fixture();x.snapshot.mockResolvedValueOnce(null as any);expect(await x.port.contextSnapshot(signal())).toBeNull();expect(x.flow).not.toHaveBeenCalled();
});
it('captures the application request rather than reading a later caller-selected identity',async()=>{
 const x=fixture();x.request.headers.set('authorization','Bearer changed');await x.port.contextSnapshot(signal());expect(x.snapshot.mock.calls[0][0].headers.get('authorization')).toBe('Bearer captured-sample');
});
it('cancellation before or during the admitted read cannot return a context version',async()=>{
 const x=fixture(),abort=new AbortController();abort.abort();expect(await x.port.contextSnapshot(abort.signal)).toBeNull();expect(x.snapshot).not.toHaveBeenCalled();const second=new AbortController();x.snapshot.mockImplementationOnce(async()=>{second.abort();return x.notes;});expect(await x.port.contextSnapshot(second.signal)).toBeNull();expect(x.flow).not.toHaveBeenCalled();
});
