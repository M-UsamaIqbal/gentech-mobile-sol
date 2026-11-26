# [P2][Operations][Feature] Add a scheduled job runner with run history and retries

**Labels:** enhancement, devops, integration

## Opportunity / problem
Promotion expiry helper has no caller, saved-search alerts run only when an admin activates a listing, rate-limit cleanup is process-local, and no cron/trigger config exists. There is no durable run history or retry mechanism.

## Evidence from the existing code
- `features/promotions/repositories/promotion.repository.ts:293-303` â€” cron/on-demand comment.
- `features/promotions/services/promotion.service.ts:339-346` â€” `expirePromotions()` unused.
- `wrangler.jsonc:1-27` â€” no cron trigger; no `vercel.json`.
- `lib/rate-limit.ts:140-143` â€” process-local cleanup.
- `features/saved-searches/services/saved-search.service.ts:21-61` â€” helper exists; triggered from admin activation only.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: sellers, buyers, operations.
- Affected markets: BH and PK.
- Business impact: stale promotions, missed alerts, no automated recovery.
- Why this matters now: #14 and #15 need a retry host.

## Proposed outcome
A durable scheduler runs maintenance and recovery jobs with observability.

## Recommended solution
Add a platform-appropriate cron/queue runner, job registry with idempotency keys, run history, retry/backoff, failure alerting via #18, and initial jobs for promotion expiry, saved-search digests and failed delivery replay.

## MVP scope
- In scope: runner, run history, retries, three initial jobs.
- Out of scope: complex workflow orchestration.

## Multi-region considerations
- Time zone: job windows must be region-aware.
- Currency: promotion/alert content must use market currency.

## Acceptance criteria
- [ ] Jobs run on defined schedules.
- [ ] Run history records success/failure/duration.
- [ ] Failed jobs retry with backoff and alert.
- [ ] Jobs are idempotent under duplicate triggers.
- [ ] Existing admin activation still sends alerts.

## Success measurement
- Metric: scheduled jobs complete with zero silent failures.

## Dependencies and risks
- Depends on hosting platform config; risk: cold-start/limits need runtime verification.

## Estimate
L â€” runner, schema, jobs and tests.

## Research and references
- Needs deployment-platform confirmation for cron/queue choice.

## Product decision
Ready for development after platform choice.
