# Local Task 2b preparation

These versioned migrations have not been applied to Supabase. Do not run them against a remote project as part of this rehearsal.

The first migration adds saved-image metadata with owner-only reads and no customer write privileges. The second creates a private wardrobe bucket with a 10 MiB limit and JPEG/PNG/WebP allowlist. File extensions and MIME headers do not prove safe image content: the eventual server upload interface must decode, bound and strip metadata before saving.

Run `python3 apps/foundation/scripts/check-data-protections.py` from the repository root. This uses the already pinned PostgreSQL 17 image, no network, no host ports, ephemeral memory-backed data and synthetic identity roles. It checks actual PostgreSQL grants and row policies, then removes the container. It does not emulate signed URLs or prove hosted Supabase behavior.

Remaining Task 2b work: strict saved-profile/look/wardrobe schemas, controlled consent/revision mutations, same-owner references, safe image upload/deletion, Storage policy rehearsal, migration upgrade checks and eventual hosted owner-isolation and expired signed-URL acceptance. Keep Task 2b unchecked until applicable checks pass.

The third migration prepares controlled wardrobe saves with explicit consent, identity-derived ownership, same-owner image references and atomic revision checks. The decoder in apps/foundation/src/server/wardrobe-save.ts accepts only the five permitted fields; no live route is connected. Latest local evidence: 40 database checks and 33 foundation tests.

The fifth migration prepares explicit profile saves and private transactional revision events. It is an initial preference subset, not the full profile or a live recommendation invalidation mechanism. Latest isolated database evidence: 74 checks.
