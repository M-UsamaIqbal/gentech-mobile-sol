# [P1][Payments][Improvement] Make payment initiation and webhook processing retry-safe

**Labels:** enhancement, payments, integration, data-quality

## Opportunity / problem
The idempotency key is optional and client-supplied, duplicate initiation returns a payment without `redirectUrl`, and webhook idempotency is only a status comparison with no persisted event id.

## Evidence from the existing code
- `app/api/payments/initiate/route.ts:12-19` â€” optional client key.
- `features/payments/services/payment.service.ts:54-64,84-91` â€” check-then-create pattern.
- `features/payments/repositories/payment.repository.ts:120-149` â€” `findPaymentByOrderId` unused.
- `features/payments/services/payment.service.ts:190-220` â€” status-only webhook idempotency.
- `prisma/schema.prisma:1589-1590` â€” unique key only at DB level.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: customers, operations.
- Affected markets: BH and PK.
- Business impact: broken retry UX, duplicate payment rows, inconsistent state.
- Why this matters now: network retries are normal at checkout.

## Proposed outcome
Payment handoff and webhook handling are deterministic under retries and races.

## Recommended solution
Generate the key server-side from order/amount/currency; use atomic create-or-return including stored `redirectUrl`; persist provider event id with a processed marker; route all webhooks through `processWebhookAtomic`; replay events idempotently.

## MVP scope
- In scope: server key, atomic create-or-return, durable webhook events, retry-safe redirect.
- Out of scope: scheduled stale-payment reconciler (#14).

## Multi-region considerations
- Currency: key inputs include currency and amount precision.
- Payment: no provider-specific business rules.

## Acceptance criteria
- [ ] Concurrent duplicate initiation creates one payment.
- [ ] Retry returns the original usable redirect.
- [ ] Duplicate webhook event is a no-op.
- [ ] Out-of-order events cannot regress state.
- [ ] Tests cover race and replay cases.

## Success measurement
- Metric: zero duplicate payments/state regressions under retry tests.

## Dependencies and risks
- Related to #1; risk: schema addition for provider event id.

## Estimate
M â€” service, repository and schema changes.

## Research and references
- No external research required.

## Product decision
Ready for development.
