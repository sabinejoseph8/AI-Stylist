# Project memory website

Published: 11 October 2026

Latest local preparation: the Tech Spec evidence banner now imports the canonical Plan Summary instead of maintaining a separate count. Sixteen local website checks pass. The snapshot imports application commit `6e32fff`; this latest refresh is not deployed because the execution approval limit prevents publishing.

Private website: https://ai-stylist-project-memory.idealgnat256.chatgpt.site

Four tabs: Product Spec, Design Spec, Tech Spec and Plan. The complete source Markdown is retained behind readable summaries. The design section includes 13 named color swatches, typography and spacing tables, seven component descriptions and the main screens. Architecture and data-model SVG diagrams have labeled relationships and text descriptions.

## Access and AI updates

Sign in with ChatGPT to view the owner-private site. Sites provisioned the private AI Stylist Project Memory plugin. It is reported installed; its tools may require a new Codex chat to appear. Authenticated browser reads, saves and reload persistence were verified on 11 October 2026.

MCP endpoint: https://ai-stylist-project-memory.idealgnat256.chatgpt.site/mcp

Read `list_plan_tasks` before calling `update_plan_task`. Supply task ID, completion status, evidence and the returned expected revision. Also update canonical docs/progress.md in the same development task. The website does not directly write to GitHub. It visibly flags changes that differ from its imported Markdown snapshot.

Only verified outcomes may be checked off. The initial published snapshot preserves 4 completed tasks out of 41 and eight phases. Task 1b, Task 1c and Phase 1 remain incomplete.

## Source and refresh

Website source is in tools/project-memory-site and the AI stylist folder's Project Memory Website directory. Its original Sites checkout is in the Capstone 2 workspace under sites/ai-stylist-memory. Reuse the project_id in .openai/hosting.json; never create a second Site. No credentials are stored there.

Run scripts/sync-docs.py with the development checkout path, review curated summaries, build, test and republish through the Sites skill. Snapshots do not automatically pull from GitHub. The initial publication recorded application commit `185e40c`. The latest prepared local snapshot references `6e32fff`; inspect the live publication after the execution limit clears before claiming it has that snapshot.

Shared task evidence is stored as a JSON file in the provisioned R2 binding. Saves require private identity, evidence and a matching revision; conflicts cannot silently overwrite another update. A changed task source hash invalidates its old override. Missing storage disables updates. The local preview has synthetic identity and memory-only test data, and is never deployed.

## Verification

The original 15 focused website tests passed at publication. The current 16-test local suite also checks that the visible evidence banner comes from the imported Plan Summary and escapes that text before rendering. Desktop and phone browser checks cover four tabs, 13 swatches, task search/filter, completion dialog, save/reload in the synthetic preview and labeled diagrams. A cramped phone toolbar and diagram label were fixed and checked again. Native Sites confirms successful private deployment with MCP. Authenticated production persistence is verified: Task 1a was temporarily reopened with an explicit verification note, reloaded, restored to its previously approved completed status, and reloaded again. Shared record revision 2 shows 4/41 tasks complete and Aligned. No incomplete application task was accepted.

This website is project tooling. The customer app's approved Supabase + Render hosting, provider limits and acceptance gates are unchanged.


Latest verified deployment: 11 October 2026, document snapshot c657681, Site source b5fefcdb071ddf4ef4f1645e8a8e7a4519c24ece, deployment appgdep_6acc27c1058c819194a7c5ccb2271445. Native status succeeded; owner-private audience and MCP tools retained. Sixteen site checks and artifact validation pass. The subsequent full foundation result is 188 tests and will appear after the next snapshot refresh.

Resource-evidence refresh: 11 October 2026, document snapshot 297e31c and Site source d53970805466b21ffd55e9f99ad4ae7ce92d5d14. Native deployment appgdep_6acc2916d7188191ac1325a2a8e78015 succeeded at the existing private URL with MCP tools retained. The imported overview now reports all 188 foundation checks and six local decoder resource scenarios. Sixteen website checks and artifact validation pass.


Account-bound image refresh: 11 October 2026, document snapshot 96a0b73, Site source 184b43b395e580c69d241b8987b11bbb4902910b. Deployment appgdep_6acc2c90c43481918e1b07dbe2d8489b succeeded with private access and MCP tools retained. Sixteen website checks and artifact validation pass; imported evidence now includes 209 foundation checks and actual local Storage integration.


## Retention checkpoint publication

Document checkpoint 019fbb4 is published to GitHub and byte-verified in the AI stylist folder. Private Memory source cb2c35697e41e4183a51081ed9c686c77e666373 deployed successfully as appgdep_6acc2e8a5e708191a1bb8dc04b973415. All 16 website checks and artifact validation pass; existing private access and MCP tools are retained.


Concurrent-maintenance document checkpoint 299a2e2 is published and copied. Private Memory source dbbe8b403cd60d5ebed8d9cf35fcf55a3e08b2f7 deployed successfully as appgdep_6acc2f327e9081918d489f3cd4572952 with MCP retained; 16 site checks pass.


Single-slot checkpoint df10dc8 is published to GitHub and copied to the AI stylist folder. Storage regression passes with all 15 migrations. Private Memory source 00b2dfc3a33edc027ddc2dfc3424ef04f49e38b3 deployed successfully as appgdep_6acc301929f88191930de39c086f4555; 16 website checks pass and MCP remains available.


Adapter checkpoint b104642 is published and copied. Private Memory source 14efb4ecc19a9d16a0fe175cfb8077529f27857a deployed successfully as appgdep_6acc3106867081918cc07eb02fc4426a, with MCP retained. Sixteen website checks and artifact validation pass.


Recovery checkpoint 99b3669 is published and copied. Private Memory source 2cf60e751cdfcf464927409c84185b2a4e03dc89 deployed successfully as appgdep_6acc31c4b5948191aa1fde57bbfe00df; all 16 website checks pass and MCP is retained.
