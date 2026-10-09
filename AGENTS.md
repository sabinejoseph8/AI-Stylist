# AI Stylist project

This repository contains the AI Personal Stylist project.

## Project instructions

**Where the plan lives**

The product and design drafts are in Project Memory/. The phased build plan and supporting documents are referenced under docs/. Read the files a task needs before starting it. Product alignment is pending; create the technical specification only after Sabine agrees to the product spec.

- docs/progress.md: the phased build plan, with tasks, automated tests and manual checks. Work from this file.
- Project Memory/product-spec.md: what the app must do.
- Project Memory/design.md: colours, type, spacing, components and screens.
- docs/tech-spec.md: architecture, data model, interfaces, security, hosting and testing.
- docs/mvp.md: the MVP scoping document, with the success criteria, risks and decisions behind the plan. Use it for why something was decided, and keep it up to date as the project progresses (see Project memory). If it disagrees with the agreed versions of the four plan files above, those agreed versions win: update the MVP document to match. Drafts require Sabine's approval before they become agreed versions.

If the docs and the code disagree, or a task needs a decision the docs don't make, stop and ask Sabine. Don't change an agreed decision on your own.

**Project memory**

These five project documents are the project memory: the key to understanding the project and continuing it effectively.

- Project Memory/product-spec.md: core requirements and goals.
- Project Memory/design.md: design principles, colour, type and spacing tokens, and component anatomy.
- docs/tech-spec.md: key technical decisions and system patterns to stay consistent with.
- docs/progress.md: current focus, recent changes, what's left to build, current status and known issues.
- docs/mvp.md: the MVP scope, success criteria, risks and decisions. Record new or changed decisions, risks, assumptions and spike results here as the project progresses.

Update the project memory:

- when you discover a new project pattern
- after implementing a significant change
- after completing a major phase of work
- when a technical decision is made (record decisions Sabine has made; never change an agreed decision without her)
- when Sabine says "update proj memory"

When Sabine says "update proj memory", review every one of the five files, even if some need no change. Keep them precise and clear: building the project well depends on them.

**Interview notes**

Maintain a file called interview-notes.md (in the project root). Keep it written in the first person, as if Sabine is telling a PM interview story. Include:

- who the app is for and why
- key decisions and tradeoffs
- major bugs and how she fixed them
- significant improvements

Update this file whenever there is a significant new feature, a major bug resolved, or a meaningful design change. The repository is public, so the notes never include passwords, keys, account email addresses or anyone's health readings.

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
