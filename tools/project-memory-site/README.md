# AI Stylist Project Memory website

A private, responsive companion to the agreed Markdown documents. Four tabs: Product Spec, Design Spec, Tech Spec and Plan. No framework, external font, tracking script or CDN is required. The customer MVP remains hosted on Supabase + Render.

## Source of truth

`content/documents.json` retains the complete Markdown and readable HTML snapshot, with source paths and commit. Curated cards and accessible SVG diagrams introduce the documents without replacing their detail. Diagrams describe the proposed customer app, not a completed deployment.

Import updated documents from a development checkout:

```sh
python3 scripts/sync-docs.py /absolute/path/to/AI-Stylist
bash scripts/build.sh
node --test scripts/check.mjs
node scripts/validate-artifact.mjs
```

The importer reads `Project Memory/product-spec.md`, `Project Memory/design.md`, `Project Memory/tech-spec.md` and `docs/progress.md`. Review curated summaries and diagrams when decisions change. Republish through the Sites source workflow after importing. The snapshot does not automatically pull from GitHub.

## Shared task status and AI tools

Plan updates are saved as one JSON record in the private Site's provisioned R2 binding `BUCKET`. Conditional writes and a monotonic revision prevent concurrent overwrites. Missing storage disables saves. Nothing is stored in browser localStorage. Only task status, a short evidence note, source hash and update timestamp are retained. Never include credentials or private customer records in evidence.

The site is owner-private. Sites authenticates requests; record routes require its site-scoped identity header. Browser writes require the same origin. Do not expose the Worker directly outside Sites or weaken its private access.

The published Site exposes two MCP tools:

- `list_plan_tasks`: read tasks, evidence, source alignment and record revision.
- `update_plan_task`: supply `id`, Boolean `done`, `evidence` and `expectedRevision`. Read the latest record first. Save only verified outcomes. On conflicts, read and review before retrying.

**Development workflow:** update the canonical `docs/progress.md` and shared Site task record in the same task. The MCP tool updates the website record, not the repository. The UI explicitly flags differences from the imported Markdown snapshot. Republish the document snapshot to reconcile it. Overrides whose task text changes are ignored rather than silently applied to a changed requirement. Existing record evidence remains in storage but is not shown against the changed task.

Install or connect the private plugin provisioned by Sites to expose these tools in future Codex sessions. Do not create a second connector or put credentials in the repository.

## Local verification

`node scripts/preview.mjs` serves a loopback-only preview on port 4330. It uses synthetic identity and memory-only status, separate from production. Never deploy that preview server. The build contains only the generated Worker and hosting manifest.

Automated coverage: assets, complete sources, auth, same-origin writes, required evidence, unknown tasks, revision conflicts, concurrent saves, changed source hashes, unavailable storage, malformed/oversized requests, and MCP discovery/read/write behavior.

Manual checks: switch all four tabs with mouse and keyboard; inspect all 13 swatches; verify table scrolling and both diagrams at phone/desktop widths; search/filter tasks; cancel a change; save a synthetic preview update and reload; verify the changed task and source difference are shown; inspect automated and manual phase checks. Synthetic preview updates are never copied into production.

The Tech Spec current-evidence banner is imported from the first paragraph of the Plan Summary during snapshot synchronization. It does not maintain an independent hardcoded test count.

## Local document refresh integrity

Run `python3 scripts/sync-docs.py /absolute/path/to/the/current/workspace` from this directory. Omitting the workspace path uses the repository containing this script. Sync imports the documents and rebuilds the generated local Worker, without deploying it. The displayed snapshot date is the date of its recorded source commit. Run `node scripts/check.mjs` afterward; checks compare the served documents with the complete imported JSON, in addition to validating the visible Summary and task access rules. Restart an already-running local preview when needed so it loads the rebuilt Worker. Hosted publication remains a separate authorized action.
