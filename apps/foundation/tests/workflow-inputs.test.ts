import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
/** Existing CI jobs must run when their local source dependencies change. */
it.each(['push','pull_request'])('%s checks include both operations helpers and prototype sources',trigger=>{
 const workflow=readFileSync(new URL('../../../.github/workflows/foundation.yml',import.meta.url),'utf8');
 const block=workflow.match(new RegExp('  '+trigger+':\\n    paths: \\[([^\\n]+)\\]'));
 expect(block,`Missing ${trigger} paths`).not.toBeNull();
 const paths=[...block![1].matchAll(/'([^']+)'/g)].map(match=>match[1]);
 for(const input of ['apps/foundation/**','tools/operations/**','prototypes/voice-avatar/**','packages/style-contracts/**','packages/catalog-contracts/**','supabase/**','.github/workflows/foundation.yml'])expect(paths).toContain(input);
});
