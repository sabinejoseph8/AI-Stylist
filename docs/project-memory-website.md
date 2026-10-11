# Project memory website

Published: 11 October 2026

Private website: https://ai-stylist-project-memory.idealgnat256.chatgpt.site

Four tabs: Product Spec, Design Spec, Tech Spec and Plan. The complete source Markdown is retained behind readable summaries. The design section includes 13 named color swatches, typography and spacing tables, seven component descriptions and the main screens. Architecture and data-model SVG diagrams have labeled relationships and text descriptions.

## Access and AI updates

Sign in with ChatGPT to view the owner-private site. Sites provisioned the private AI Stylist Project Memory plugin. It is reported installed; its tools may require a new Codex chat to appear. Authenticated browser reads, saves and reload persistence were verified on 11 October 2026.

MCP endpoint: https://ai-stylist-project-memory.idealgnat256.chatgpt.site/mcp

Read `list_plan_tasks` before calling `update_plan_task`. Supply task ID, completion status, evidence and the returned expected revision. Also update canonical docs/progress.md in the same development task. The website does not directly write to GitHub. It visibly flags changes that differ from its imported Markdown snapshot.

Only verified outcomes may be checked off. The initial published snapshot preserves 4 completed tasks out of 41 and eight phases. Task 1b, Task 1c and Phase 1 remain incomplete.

## Source and refresh

Website source is in tools/project-memory-site and the AI stylist folder's Project Memory Website directory. Its original Sites checkout is in the Capstone 2 workspace under sites/ai-stylist-memory. Reuse the project_id in .openai/hosting.json; never create a second Site. No credentials are stored there.

Run scripts/sync-docs.py with the development checkout path, review curated summaries, build, test and republish through the Sites skill. Snapshots do not automatically pull from GitHub. The published snapshot references application commit 37667c2.

Shared task evidence is stored as a JSON file in the provisioned R2 binding. Saves require private identity, evidence and a matching revision; conflicts cannot silently overwrite another update. A changed task source hash invalidates its old override. Missing storage disables updates. The local preview has synthetic identity and memory-only test data, and is never deployed.

## Verification

All 15 focused website tests pass. Desktop and phone browser checks cover four tabs, 13 swatches, task search/filter, completion dialog, save/reload in the synthetic preview and labeled diagrams. A cramped phone toolbar and diagram label were fixed and checked again. Native Sites confirms successful private deployment with MCP. Authenticated production persistence is verified: Task 1a was temporarily reopened with an explicit verification note, reloaded, restored to its previously approved completed status, and reloaded again. Shared record revision 2 shows 4/41 tasks complete and Aligned. No incomplete application task was accepted.

This website is project tooling. The customer app's approved Supabase + Render hosting, provider limits and acceptance gates are unchanged.
