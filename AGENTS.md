# AI Stylist project

This repository contains the AI Personal Stylist project.

## Project instructions

**Excluded provider**

Sabine excluded ElevenLabs from this project on 9 October 2026. Do not use it for voice, agent services, project SDK/API integration or configured fallbacks. Verify selected voice settings in Tavus against this constraint. OpenAI Realtime and Tavus remain candidates pending the agreed prototype; the exclusion does not approve their integration.


**Where the plan lives**

The approved product and design specifications are in Project Memory/. Sabine approved product-spec.md v1.0 on 8 October 2026 and design.md v1.0 on 9 October 2026. The phased build plan and supporting documents are referenced under docs/. Read the files a task needs before starting it. Project Memory/tech-spec.md is a technical proposal v0.11 updated on 9 October 2026 for Sabine's review. Sabine approved initial delivery as a website designed for phones and email/password with recovery plus Google and Apple sign-in on 9 October 2026. Sabine also confirmed one simultaneous consultation for first launch and approved Supabase for accounts, saved preferences, wardrobe photos and saved looks. Optional Supabase uses and remaining configuration are still under review. tech-spec.md stores technical decisions, system patterns, the proposed extensible secure architecture and critical risks. docs/progress.md is the phased draft plan with automated and manual checks, not evidence of completed implementation. Task 1a research and the initial-experiment cost worksheet are prepared in docs/task-1a-discovery-plan.md. Sabine approved the $25 total initial limit on 9 October 2026: up to $10 OpenAI, $7 hosting and $8 reserve. Sabine approved Supabase + Render for MVP hosting on 9 October 2026: Supabase for approved accounts/data/photos and Render for the website and conversation service. This supersedes the Cloudflare Pages proposal. Sabine reports existing Supabase Pro; account organization, compute credit and incremental charges remain unverified. Sabine approved React + TypeScript for the website and Node.js + TypeScript for the conversation service on 9 October 2026 by replying "1a and 2a." She accepted volatile unsaved session notes only for the private prototype: a server restart loses notes, feedback and unsaved references, with a clear message and cancellation of old recommendations; saved Supabase data remains. Review customer MVP restart recovery before launch. Task 1a planning review is complete. Sabine authorized Task 1b by saying "proceed with 1b" on 9 October 2026. Its local simulation and scripted provider probe are implemented with 116 focused passing checks. Sabine confirmed hearing the repeated fixed sentence and seeing mouth movement. Continuous conversation, remaining privacy/consent preflight, actual billing reconciliation and physical-phone acceptance remain pending. Task 1b stays unchecked and no later task group is approved by this instruction. Do not re-request the same budget approval; verify account entitlements and planned privacy/spend controls before billed work. The expanded trial and production budget remain unapproved. Specific versions/dependencies, additional hosts beyond Supabase + Render, customer MVP recovery and remaining architecture/operational settings are not approved. Do not re-request the approved website/server tools or the private-prototype-only restart limitation. Follow the approved product and design baselines; the technical proposal becomes an agreed baseline only after Sabine approves its decisions.

- docs/progress.md: draft phased build plan v0.8, with tasks, focused automated tests and numbered manual checks. Work from this file after the required group approval. Task 1a planning review is complete; Task 1b is approved and in progress. See docs/task-1b-voice-avatar.md and prototypes/voice-avatar/README.md for actual evidence and pending dependencies. No build group is complete.
- Project Memory/product-spec.md: the approved product baseline v1.0, defining what the app must do.
- Project Memory/design.md: the approved design baseline v1.0, defining colours, type, spacing, components and screens.
- Project Memory/tech-spec.md: technical decision log, system patterns, extensible secure architecture, data model, interfaces, hosting, risks and testing; draft v0.11 under review. Phone website delivery, sign-in methods, one simultaneous launch consultation, the core Supabase roles and Supabase + Render MVP hosting, React + TypeScript website and Node.js + TypeScript service are approved. Volatile notes are accepted only for the private prototype; remaining choices are pending.
- docs/mvp.md: planned for group 1e and not yet created; the MVP scoping document, with the success criteria, risks and decisions behind the plan. Use it for why something was decided, and keep it up to date as the project progresses (see Project memory). If it disagrees with the agreed versions of the four plan files above, those agreed versions win: update the MVP document to match. Drafts require Sabine's approval before they become agreed versions.

If the docs and the code disagree, or a task needs a decision the docs don't make, stop and ask Sabine. Don't change an agreed decision on your own.

**Project memory**

These five project documents are the project memory: the key to understanding the project and continuing it effectively.

- Project Memory/product-spec.md: core requirements and goals.
- Project Memory/design.md: design principles, colour, type and spacing tokens, and component anatomy.
- Project Memory/tech-spec.md: technical proposals and, after approval, agreed decisions and system patterns to stay consistent with.
- docs/progress.md: current focus, recent changes, what's left to build, current status and known issues.
- docs/mvp.md: the MVP scope, success criteria, risks and decisions. Record new or changed decisions, risks, assumptions and spike results here as the project progresses.

Update the project memory:

- when you discover a new project pattern
- after implementing a significant change
- after completing a major phase of work
- when a technical decision is made (record decisions Sabine has made; never change an agreed decision without her)
- when Sabine says "update proj memory"

When Sabine says "update proj memory", review every one of the five files, even if some need no change. Keep them precise and clear: building the project well depends on them.

## Interview Notes

Maintain a file called interview-notes.md.

Keep it written in first person
as if I am telling a PM
interview story. Include:

- Who the app is for and why
- Key decisions and tradeoffs
- Major bugs and how I fixed them
- Significant improvements

Update this file whenever there
is a significant new feature,
a major bug resolved, or a
meaningful design change.

Keep interview-notes.md in the project root. The repository is public, so the notes never include passwords, keys, account email addresses or anyone's health readings.

**How to work with Sabine**

- Sabine is not a developer. Explain what you're doing in plain words and keep updates short.
- Never use em dashes in anything you write for her.
- Work one task group at a time from docs/progress.md (1a, then 1b, then 1c, and so on). Start each group with a plan and wait for her approval before changing files.
- When a step needs her (a dashboard setting, an account, a sign-in, something on her iPhone), say so clearly and give one step at a time.
- Before saying a task group is done, run the automated tests listed for its phase, then walk her through the manual verification steps.
- At the end of each phase (after its last task group), run a code review of everything the phase changed, using the code-review skill. Fix what it finds, re-run the phase's automated tests, then tell Sabine in plain words what was found and what was fixed. Only then tick the phase's code-review task and call the phase done. Anything the review raises that needs a decision goes to Sabine first.
- When a task is done and its checks pass, change its - [ ] to - [x] in docs/progress.md, tick it on the Memory site too, and update the Summary at the top of docs/progress.md.
- Commit small, working changes with clear messages, and push to GitHub at the end of each task group.

**Safety rules**

- The GitHub repository is public. Never commit secrets, .env files or database backups.

## Private device testing clarification, 9 October 2026

Sabine asked to enable camera/microphone while Tavus answers are pending, accepted the unresolved practices for her private test, and explicitly approved the proposed local device check. Do not re-request this approval or treat the earlier private-experiment wait as unchanged. The implemented devices.html page captures only locally, with no provider transport, recording or persistence, and is waiting for browser permission. Customer privacy requirements, provider clarification and Task 1b acceptance remain open. A private two-exchange buffered spoken prototype is implemented; actual human-provider conversation remains unverified.

## Tavus response status, 9 October 2026

Sabine supplied the support reply; do not continue saying a reply is pending. See docs/task-1b-privacy-review.md for the attributed summary and remaining terms/retention risks. Support says self-serve anonymized training has no opt-out; Enterprise no-training, ZDR and DPA are not approved or activated. Existing private prototype authorization remains; customer-launch R07 stays open. No new message, deletion, purchase or human provider call was performed by recording the reply.

## Current Task 1b spoken prototype

Sabine authorized continuing after supplying the Tavus support reply. The buffered spoken prototype and protected local endpoints are implemented, with 112 passing synthetic/mocked checks, type checking and build. The ready spoken.html page is open with microphone off. No actual spoken provider call, room or additional reservation was created during implementation. Guide the manual test one step at a time; preserve the existing lifetime ledger and approved cost controls. This is two buffered exchanges with explicit heard-reply confirmation; continuous streaming, automatic barge-in/resume, phone acceptance and Task 1b completion remain pending. Task 1c has not started.

## Latest experiment allowance status

Four reservations are now closed ($8 and twenty avatar minutes reserved), none unclosed. The four-attempt guard is reached; do not reset the ledger or describe reservations as actual charges. Tavus currently displays 2.9/20 free minutes used. Both test pages now expose the guard and disable Start, with 116 passing focused checks, type checking and build. Reconcile actual usage and obtain an explicit reviewed allowance amendment before any further reserved provider attempt. No customer spoken exchange is accepted yet.

Read-only usage reconciliation: OpenAI AI Stylist Prototype displays $0.03 across three requests (Last 7 days); Tavus displays 2.9/20 free minutes. Dashboards may lag. One further spoken attempt capped at $2/five minutes within the existing experiment allocation is a proposal only. Do not enable a fifth reservation without Sabine's explicit approval; preserve all prior ledger records and the existing account spend controls.

## Approved spoken-test extension

Sabine explicitly answered Yes to one additional spoken test capped at $2/five minutes from the existing allowance. The durable spoken-only extension is applied, with the original four records unchanged. This supersedes the previous proposal-only status and fifth-reservation hold for this one approved spoken attempt. It does not authorize a sixth attempt, extra scripted attempts, funding, account/plan upgrades or changing the monthly spend controls. Failed reservations remain and unresolved cleanup holds. Current focused suite: 119 passing checks, type checking and build.

## Spoken attempt follow-up, 9 October 2026

The fifth, specifically approved spoken attempt connected to the stock avatar, then stopped at Exchange 0 before a human spoken turn was observed. Read-only ledger inspection now shows five closed reservations, none unresolved, $10 and twenty-five minutes conservatively reserved. Closure is recorded only after the existing end-and-status verification. Reservations are not actual charges. Current dashboards show Tavus Free 3.2/20 CVI minutes and OpenAI AI Stylist Prototype $0.03 across three requests for Last 7 days; rounded figures may lag. The exact reason for the fifth stop was not captured and is not inferred.

The spoken test now explains the avatar location, Talk/Send steps, tab visibility requirement and automatic room limit before Start. It shows remaining room time while active. Future server automatic stops distinguish the approximately 85-second local cutoff from a lost heartbeat; leaving the tab shows an explicit local stop message. The 90-second provider limit, immediate stop on hidden tab, microphone privacy, retained reservations and sixth-attempt block are unchanged. No extra attempt, provider call, account funding or upgrade was performed during this follow-up.

120/120 synthetic/mocked tests, type checking and build pass. This includes separate heartbeat-loss and room-expiry checks with verified cleanup. Human spoken acceptance, interruption during a reply and physical-phone checks remain pending; Task 1b stays unchecked. A further attempt requires an explicit allowance amendment after this usage review.

## Approved reserve-funded spoken test, 9 October 2026

Sabine approved exactly one further spoken test capped at $2 and five avatar minutes, moving $2 from the $8 reserve to the OpenAI allocation. Overall initial budget stays $25: OpenAI allocation $12, hosting $7, reserve $6. This does not change account spend settings, fund an account or upgrade a plan. Actual OpenAI project stopping controls remain in place and may stop work before the allocation is spent.

Applied a separate durable reserve-transfer amendment only after all five previous attempts were closed. All five prior records remain unchanged. One sixth spoken attempt is available; scripted tests remain exhausted, a seventh attempt is refused and cleanup holds still block new use. No provider call or reservation was created by applying the amendment. The test must be started by Sabine when she is ready at the visible spoken page, to avoid consuming room time while she locates it.

124/124 synthetic/mocked checks, type checking and build pass, including preservation of earlier records, refusal of early/altered transfers, exclusion of scripted use and the seventh-attempt cap. Human spoken acceptance and Task 1b completion remain pending.

## Actual spoken test evidence, 9 October 2026

The sixth approved test reached Exchange 2 of 2. The notebook displayed a generated response acknowledging a structured look and asking which sleeve length the customer preferred. Sabine explicitly confirmed hearing the reply and seeing the avatar mouth move. This is actual private microphone-to-generated-reply/avatar evidence, not a synthetic test. It does not establish precise lip-sync timing, full conversation quality, phone acceptance or interruption during playback.

The browser then displayed: the test time limit was reached and provider connection closure was checked. The final spoken reply was not explicitly confirmed through the page button before expiry; verbal acceptance is recorded separately. No third exchange is available, and no seventh attempt is approved. Further guidance must not invite another spoken turn in this ended room. Local ledger inspection confirmed six reservations, all closed. Task 1b remains in progress pending remaining manual checks.

## Approved durable prototype ledger preparation

Sabine explicitly approved Supabase for preserving the private prototype's spending/test-limit records across Render restarts. This approves that additional role only, not storing human audio or transcripts, starting another provider test, funding, plan upgrades or a public launch.

Prepared src/supabase-budget.ts as a server-only adapter and supabase/prototype-budget.sql as an unapplied migration. The adapter validates the existing ledger schema, allows only HTTPS Supabase project destinations, bounds request time, refuses redirects, sanitizes failures and makes no automatic retry, seed or local fallback. Writes compare the complete prior ledger under a database row lock. The migration enables RLS, revokes direct table access and limits function execution to the service role. Allowance changes through the hosted adapter are refused. Validation accepts JSON field reordering without relaxing approved amounts.

129/129 synthetic/mocked checks, type checking and build pass. These checks do not prove the SQL runs on Supabase or its live access policies. No Supabase project was selected, no migration applied, no ledger imported and no hosted adapter activated. The existing local server still uses its file ledger. The six closed reservations remain unchanged and no seventh test is approved. Remote private access, production origin/port configuration, durable ledger import/verification, restart/concurrency checks and deployment remain pending. Confirm the dedicated AI Stylist Supabase project before database actions.

Sources reviewed: https://supabase.com/docs/guides/database/functions and https://supabase.com/docs/guides/database/postgres/row-level-security.

## Approved new Supabase project cost

After being told that a new project in her Pro organization adds $10/month, Sabine explicitly said "Create it." This authorizes one AI Stylist project at that displayed recurring charge as a specific exception to the earlier $7 hosting allowance. It does not approve other hosting charges, plan upgrades or another provider attempt. Reconcile the total revised ongoing/experiment budget before any additional charges; do not keep claiming the original $25 ceiling covers all revised allocations.

Prepared the new-project form with name AI Stylist, Micro compute, Americas region, Data API enabled, automatic table exposure disabled and automatic RLS enabled. No project was submitted or created yet. Database password entry and final creation are handed to Sabine because they involve a new credential. Do not read, save, print or echo her database password in chat or project documents. The unrelated existing project remains unchanged.

## AI Stylist Supabase project and live storage verification

Sabine completed project creation herself. The dashboard verifies AI Stylist, Healthy, Micro, West US (Oregon), with no GitHub repository connected. The authorized prototype-budget migration was executed in this project through its SQL editor and returned Success. No other project was modified.

Live privilege checks returned true for RLS enabled, anonymous and authenticated direct-table access blocked, anonymous read-function access blocked, authenticated write-function access blocked, and service-role read/write-function access allowed. The table currently has zero ledger rows: all six existing private reservations still need import, and no reservation was reset or initialized remotely. This verifies schema/privileges only, not the REST adapter, concurrent updates or restart behavior. No provider room/test was started.

Next dependency is a server-only Supabase key saved privately, followed by importing and comparing the existing ledger, live adapter checks, a private remote-access gate and Render configuration. Never paste keys in chat or publish them to GitHub. The optional Supabase ledger role and one project at the displayed $10/month were approved; no seventh provider attempt or further charge is approved.

## Private server-key handoff completed

Sabine could not paste the copied key and explicitly authorized direct transfer into the private configuration file without displaying it. The existing Supabase server key was copied from AI Stylist's Secret keys control and saved to the ignored owner-only prototypes/voice-avatar/.env.supabase file. A private temporary transfer file was removed. No credential value is recorded in documentation or chat.

A bounded, redirect-refusing REST call with the saved key reached the authorized ledger read function and returned PostgreSQL P0002 (no row), consistent with the verified empty ledger table. This confirms authenticated reachability only; import and successful adapter reading are still pending. No ledger was seeded, attempt approved or media/provider call started. Do not confuse the expected missing-row response with a completed durable migration of the six prior reservations.

## Durable history import and private phone preview preparation

Imported the existing six closed reservations into the approved AI Stylist Supabase project using a one-time function that cannot overwrite its singleton row. Compared the full imported ledger with the private original using deep equality; all records and approval metadata match. A new adapter instance read the same state, and reserve('spoken') was rejected at the six-attempt cap before provider work. The import function's execution was then revoked from service_role as well as public/anon/authenticated; a live query returned six historical attempts, six closed attempts and importer_disabled=true. No seventh reservation or media/provider request was made.

Prepared a Render Free private-preview configuration, pinned Node 24.20.0, manual deploys, health check and explicit --preview --spoken startup. Preview mode requires a valid HTTPS onrender.com origin and a strong password, gates both pages and APIs with HTTP Basic access, issues a Secure HttpOnly SameSite owner cookie only after authentication, validates exact Host/Origin and limits failed password guesses with bounded memory. It uses Supabase for the existing ledger with no file fallback or automatic seeding. Local mode remains loopback-only. A detected server replacement stops local media and clears transient conversation context. This is private-prototype access, not the customer account system.

135/135 focused synthetic/mocked checks, type checking and build pass. Render/iPhone operation is unverified; deployment and phone permission/playback checks remain pending. Render-generated password format and nested root-directory settings were checked against https://render.com/docs/blueprint-spec and Node selection against https://render.com/docs/node-version. The GitHub repository was cloned read-only for preparation; the local primary folder is not a Git checkout and GitHub CLI is not authenticated. No code was pushed, Render service created, secret uploaded to Render or additional charge accepted. A GitHub publishing connection is the next dependency.

## GitHub publishing connection verified

Sabine completed GitHub permission review and password confirmation. GitHub CLI authentication succeeded for the repository owner. The prepared publication contains source, tests and project documents only; the credential scan found no private keys or test ledgers. Task 1b remains in progress, with no additional provider attempt or Render secret transfer approved by this connection.

Published the prepared source, tests and project documents to the existing public AI-Stylist repository after Sabine completed authorization. Private configuration, credentials, media and lifetime test ledgers were excluded. Render deployment and physical-phone acceptance remain pending; the six-attempt cap is unchanged.
