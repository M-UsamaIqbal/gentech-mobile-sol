# [P2][Integrations][Feature] Turn generic /api/webhooks into a signed, durable event pipeline

**Labels:** enhancement, integration, security, devops

## Opportunity / problem
`POST /api/webhooks` is explicitly marked in `docs/PROGRESS_CHECKLIST.md:113` as not filed. It verifies no signature, only console-logs every event type, and returns success without persistence or side effects.

## Evidence from the existing code
- `app/api/webhooks/route.ts:30-36` â€” signature verification placeholder.
- `app/api/webhooks/route.ts:38-96` â€” events only `console.log`.
- `app/api/webhooks/route.ts:98-102` â€” unconditional success response.
- `app/admin/integrations/page.tsx:33-38` â€” Webhooks "Not connected".
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: operations, integrators.
- Affected markets: BH and PK.
- Business impact: no external event automation, silent integration failures.
- Why this matters now: it was deliberately deferred and remains untracked.

## Proposed outcome
A generic webhook endpoint becomes a reliable integration boundary.

## Recommended solution
Require signature verification, persist raw events with unique provider event id, dispatch idempotent handlers, add retry/backoff and dead-letter queue, expose delivery status in admin, and alert on failures via #18.

## MVP scope
- In scope: signed ingestion, durable event store, idempotent dispatch, retry/DLQ, admin status.
- Out of scope: provider-specific business handlers beyond existing payment flow.

## Multi-region considerations
- No region-specific logic; events carry region/currency where relevant.
- Privacy: raw payload retention needs #20 policy.

## Acceptance criteria
- [ ] Unsigned events are rejected.
- [ ] Duplicate event id is a no-op.
- [ ] Failed handlers retry with backoff and land in DLQ.
- [ ] Admin shows delivery state.
- [ ] Tests cover replay, failure and signature mismatch.

## Success measurement
- Metric: zero silently discarded webhook events.

## Dependencies and risks
- Depends on #18/#19 for observability and retries; risk: payload retention policy.

## Estimate
L â€” ingestion, schema, worker and admin UI.

## Research and references
- No external research required.

## Product decision
Ready for development. This is the previously "not filed" item.
