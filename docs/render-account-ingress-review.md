# Render customer account ingress review

Status: researched, not activated. 12 October 2026.

## Current deployment

The tracked render.yaml still targets prototypes/voice-avatar on the Free instance plan with automatic deployment disabled. It does not run the customer account application. An instance plan does not establish the workspace logging plan. No dashboard setting or account route changed during this review.

## Documented facts

- Render terminates public TLS at its edge and forwards plain HTTP to the process. Web services bind 0.0.0.0 on PORT. The tutorial recommends X-Forwarded-Proto to recover the original scheme: https://render.com/tutorials/web-service-vs-static-site/web-services
- Render provides managed TLS certificates: https://render.com/docs/tls
- Render documents public HTTP request logs for Pro workspaces and higher. The displayed request details include requested URL; application logs are separate. This does not specify whether query strings are retained or redacted: https://render.com/docs/logging

## Unproven deployment requirements

1. Which immediate peer addresses or platform capability reliably identify the Render ingress? Do private-network callers reach the same port? Is direct public bypass possible?
2. Does the edge overwrite client-supplied X-Forwarded-Proto and X-Forwarded-Host, including duplicate/comma-separated values? What happens to RFC Forwarded?
3. Are OAuth code and recovery token_hash query values retained in request logs, diagnostic logs, streams or other platform records on Hobby and Pro workspaces? Can those fields be redacted before storage, and with what retention?
4. What exact Host, forwarded scheme and path reach this service? Can a synthetic diagnostic deployment confirm these without capturing cookies, authorization or request bodies?

The current transport guard requires independently established proxy trust. A private IP or a client-supplied header alone is not sufficient evidence. The reviewed documents do not prove the missing platform guarantees. Application redirection and URL cleanup occur after ingress and cannot erase upstream records already created.

## Prepared support inquiry

Authorized by Sabine and sent by her on 12 October 2026. Sabine confirmed “sent” in chat. Recipient: support@render.com. Awaiting reply; no ticket ID or delivery receipt was supplied. The earlier Mail permission blocker no longer prevents submission because Sabine sent the email herself. Platform guarantees remain unverified until the response and applicable checks are reviewed.

Subject: Account recovery/OAuth URL logging and trusted ingress headers

Hello Render support,

We are preparing a Node.js web service with secure cookie sessions, OAuth callbacks and email password recovery. Before enabling real accounts, could you clarify:

1. How should an application independently identify your immediate ingress proxy? Please include direct/private-network bypass considerations and any supported peer or platform guarantees.
2. Are client-supplied X-Forwarded-Proto and X-Forwarded-Host overwritten rather than appended? How are duplicates, comma-separated values and RFC Forwarded handled?
3. Do request/diagnostic logs or log streams retain URL query values, including OAuth code and recovery token_hash? Please distinguish Hobby and Pro workspaces, redaction before storage and retention.
4. Is there a supported way to verify ingress headers with synthetic traffic without logging request cookies, authorization, bodies or account proof values?

No customer accounts are enabled yet. We do not need to share keys, live callback URLs or user records for this inquiry.

## Acceptance before Render account activation

- Record the verified platform contract and actual selected workspace configuration.
- Exercise synthetic forged/duplicate forwarded-header cases and fixed-host refusal.
- Keep application log output limited to fixed lifecycle states, never raw URLs or errors.
- Establish acceptable handling of proof-bearing URLs at every upstream logging layer before real email/OAuth use.
- Configure only the working exact HTTPS origin and callbacks, without wildcard redirects.
- Preserve existing spending, sender/social credentials, linking-policy and customer/manual acceptance gates.

## Separately prepared direct HTTPS entry

apps/foundation provides npm run start:account:https for an explicitly selected direct TLS environment. It requires ACCOUNT_TLS_KEY_FILE and ACCOUNT_TLS_CERT_FILE in addition to the validated account runtime settings. It is not the Render proxy entry and must not replace Render's start command without resolving the deployment requirements above. No TLS files or credentials belong in GitHub.
