import {EventEmitter} from 'node:events';
import {spawnSync} from 'node:child_process';
import {expect,it,vi} from 'vitest';
import {startupDiagnosticConfiguration,prepareStartupDiagnosticRuntime} from '../src/notes-startup-diagnostic-main.ts';
import {validatePrivateNotesTrialTransition} from '../src/private-notes-trial-ledger.ts';
const args=['--run-approved-notes-startup-diagnostic'];
const env={NOTES_STARTUP_DIAGNOSTIC_APPROVAL_ID:'notes_startup_diag_synthetic',NOTES_STARTUP_DIAGNOSTIC_FINANCIAL_APPROVED:'true',NOTES_STARTUP_DIAGNOSTIC_SECURITY_APPROVED:'true',NOTES_STARTUP_DIAGNOSTIC_SCOPE:'startup-only',SUPABASE_URL:'https://synthetic.supabase.co'};
it.each(Object.keys(env).filter(k=>k!=='SUPABASE_URL'))('refuses missing operator gate %s',key=>{expect(()=>startupDiagnosticConfiguration(args,{...env,[key]:undefined})).toThrow('review');});
it.each([{value:[]},{value:['--activate-private-notes-trial']},{value:[...args,'extra']}])('refuses other startup arguments %#',({value})=>expect(()=>startupDiagnosticConfiguration(value,env)).toThrow('review'));
it('rejects legacy notes IDs and binds an immutable returned configuration',()=>{expect(()=>startupDiagnosticConfiguration(args,{...env,NOTES_STARTUP_DIAGNOSTIC_APPROVAL_ID:'notes_private_20261013_03'})).toThrow('review');expect(Object.isFrozen(startupDiagnosticConfiguration(args,env))).toBe(true);});
it('rejects forged runtime config before reading credentials',()=>{const loadSecrets=vi.fn();expect(()=>prepareStartupDiagnosticRuntime({approvalId:env.NOTES_STARTUP_DIAGNOSTIC_APPROVAL_ID,supabaseUrl:env.SUPABASE_URL,profile:undefined},{loadSecrets} as any)).toThrow('review');expect(loadSecrets).not.toHaveBeenCalled();});
it('validates the database destination before reading credentials',()=>{const loadSecrets=vi.fn();expect(()=>prepareStartupDiagnosticRuntime(startupDiagnosticConfiguration(args,{...env,SUPABASE_URL:'https://other.example'}),{loadSecrets} as any)).toThrow('configuration');expect(loadSecrets).not.toHaveBeenCalled();});
it('native entry refuses activation without flags in a credential-free child process',()=>{const result=spawnSync(process.execPath,['src/notes-startup-diagnostic-main.ts'],{cwd:process.cwd(),env:{PATH:process.env.PATH??''},encoding:'utf8',timeout:5000});expect(result.status).toBe(1);expect(result.stdout).toBe('');expect(result.stderr).toContain('no retry authorized');});
it.each([false,true])('composes real adapters and a held ledger for minimal profile %s',async minimal=>{
 const selectedEnv=minimal?{...env,NOTES_STARTUP_DIAGNOSTIC_PROFILE:'minimal',NOTES_STARTUP_DIAGNOSTIC_APPROVAL_ID:'notes_startup_diag_minimal_synthetic'}:env;
 const selectedArgs=minimal?['--run-approved-minimal-notes-startup-diagnostic']:args;
 let ledger:any={version:1,purpose:'notes-only-private-trial',approval:{id:selectedEnv.NOTES_STARTUP_DIAGNOSTIC_APPROVAL_ID,cents:200,maxSeconds:85,maxTurns:2,maxExtractions:64,maxInputTokens:1000000,maxOutputTokens:2048},reservation:null};
 const original=structuredClone(ledger),commands:any[]=[],diagnostic=vi.fn();
 const request=vi.fn(async(url:any,init:any)=>{expect(String(url).startsWith(env.SUPABASE_URL+'/rest/v1/rpc/')).toBe(true);expect(init.headers.apikey).toBe('synthetic_supabase_fixture_not_real_1234');const body=JSON.parse(init.body);expect(body.approved_id).toBe(original.approval.id);if(String(url).endsWith('_read_approved'))return Response.json(ledger);expect(String(url).endsWith('_change_approved')).toBe(true);expect(body.expected).toEqual(ledger);validatePrivateNotesTrialTransition(ledger,body.replacement);ledger=structuredClone(body.replacement);return Response.json(true);});
 class Raw extends EventEmitter{readyState=1;bufferedAmount=0;terminate=vi.fn();close=vi.fn();send(value:string){const parsed=JSON.parse(value);commands.push(parsed);queueMicrotask(()=>this.emit('message',Buffer.from(JSON.stringify({type:'error',error:{type:'invalid_request_error',code:'invalid_value',param:'session.type',event_id:parsed.event_id,message:'private sentinel'}})),false));}}
 const connect=vi.fn(()=>{expect(ledger.reservation.state).toBe('reserved');const raw=new Raw();queueMicrotask(()=>{raw.emit('open');raw.emit('message',Buffer.from(JSON.stringify({type:'session.created',session:{id:'synthetic'}})),false);});return raw;});
 const runtime=prepareStartupDiagnosticRuntime(startupDiagnosticConfiguration(selectedArgs,selectedEnv),{loadSecrets:()=>({supabaseKey:'synthetic_supabase_fixture_not_real_1234',openAIKey:'synthetic_openai_fixture_not_real'}),request:request as any,connect:connect as any,diagnostic});
 expect(request).not.toHaveBeenCalled();expect(connect).not.toHaveBeenCalled();const result=await runtime.run(new AbortController().signal);expect(result).toMatchObject({outcomeRecorded:true,result:{outcome:'configuration-rejected',errorCorrelated:true}});expect(ledger.approval).toEqual(original.approval);expect(ledger.reservation.state).toBe('held');expect(connect).toHaveBeenCalledOnce();expect(commands.map(v=>v.type)).toEqual(['session.update']);expect(commands[0].session.audio.input.transcription).toEqual(minimal?{model:'gpt-live-transcribe'}:{model:'gpt-live-transcribe',languages:['en'],delay:'low'});expect(JSON.stringify(result)+JSON.stringify(diagnostic.mock.calls)).not.toContain('sentinel');runtime.end();
});

it.each([
 {args:['--run-approved-minimal-notes-startup-diagnostic'],extra:{}},
 {args:['--run-approved-minimal-notes-startup-diagnostic'],extra:{NOTES_STARTUP_DIAGNOSTIC_PROFILE:'minimal'}},
 {args,extra:{NOTES_STARTUP_DIAGNOSTIC_PROFILE:'minimal'}},
 {args,extra:{NOTES_STARTUP_DIAGNOSTIC_APPROVAL_ID:'notes_startup_diag_minimal_synthetic'}},
])('rejects mismatched minimal operator gates %#',s=>expect(()=>startupDiagnosticConfiguration(s.args,{...env,...s.extra})).toThrow('review'));
