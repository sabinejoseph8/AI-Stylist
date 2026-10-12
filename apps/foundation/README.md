# AI Stylist local foundation

Task 2a app foundation with prepared Task 2b/2c database and account modules. The customer UI defaults to local sample mode. Customer sign-in, email, storage operations and shopping are not activated. The reviewed customer migration chain is installed in the approved Supabase project; see ../../docs/hosted-database-deployment.json for installation evidence and remaining acceptance gates.

Run `npm ci`, then `npm run dev` for http://127.0.0.1:4322/. In another terminal, `npm run dev:server` starts the local health service at http://127.0.0.1:4323/healthz.

Checks: `npm run test:phase-2`, `npm run typecheck`, `npm run build`. Dependencies reuse the already pinned prototype versions. Shared fields live in ../../packages/style-contracts/src/index.ts; approved colors and spacing live in src/web/tokens.css.

APP_MODE accepts development or test only. NODE_ENV=production, other modes and non-loopback HOST values fail before listening. PORT defaults to 4323 and must be an integer from 1 to 65535. No secret is loaded or returned. No customer endpoint can create a session. This scaffold is not the production security or authentication implementation.

Manual review: open the local preview, switch all four destinations, expand/collapse My Styling Notes and verify all seven fields, inspect on a narrow phone viewport and use keyboard focus. Phase 2 account/isolation checks remain for Tasks 2b and 2c.
