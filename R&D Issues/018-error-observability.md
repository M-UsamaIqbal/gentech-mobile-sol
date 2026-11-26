# [P2][Observability][Feature] Connect structured error logging to an external sink with alerting

**Labels:** enhancement, devops, integration

## Opportunity / problem
`recordError` builds a record but only calls `console.error`; no external sink is configured and almost no call sites exist. Notification delivery failures are also console-only, while admin integrations shows Monitoring "Not connected".

## Evidence from the existing code
- `lib/monitoring.ts:56-87` â€” console-only recordError; Sentry/Datadog listed as future ideas.
- Repo-wide `recordError(` usage limited to definition and health route.
- `features/notifications/lib/channels.ts:46-50` â€” delivery failure console-only.
- `features/notifications/services/notification.service.ts:49-62` â€” no retry on failed channels.
- `app/admin/integrations/page.tsx:41-45` â€” Monitoring "Not connected".
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: operations, support.
- Affected markets: BH and PK.
- Business impact: silent payment/notification/integration failures.
- Why this matters now: #15 will produce events that need monitoring.

## Proposed outcome
Errors are visible, correlated and alertable outside the application logs.

## Recommended solution
Add a provider-agnostic logger interface with correlation/user/order ids, wire an external sink via env config, add error aggregation and alert rules for payment/webhook/notification/job failures, and expose a redacted admin status.

## MVP scope
- In scope: structured logger, sink adapter, core call sites, alert rules.
- Out of scope: full APM/tracing rollout.

## Multi-region considerations
- Privacy: payload redaction must respect #20.
- Region: errors carry country/locale context for triage.

## Acceptance criteria
- [ ] Errors from payment/webhook/notification paths reach the sink.
- [ ] Correlation id is present and redaction is tested.
- [ ] Alert rule fires in a controlled test.
- [ ] No secrets or sensitive payloads are logged.

## Success measurement
- Metric: controlled error appears in sink and triggers alert.

## Dependencies and risks
- Depends on #15/#19 for event sources; risk: provider selection needs operations decision.

## Estimate
M â€” logger, adapter and alert config.

## Research and references
- No external research required; sink choice is an operations decision.

## Product decision
Ready for development after sink selection.
