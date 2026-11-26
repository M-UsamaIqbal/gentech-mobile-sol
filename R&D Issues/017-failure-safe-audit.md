# [P2][Audit][Bug] Make audit writes failure-safe and cover financial and privilege changes

**Labels:** bug, security, finance, data-quality

## Opportunity / problem
Audit logging exists for catalog/location/admin actions and order status, but write failures are swallowed with `console.warn`, the viewer calls the repository directly, and payment/webhook/privilege/config changes are not audited.

## Evidence from the existing code
- `prisma/schema.prisma:811-830` â€” AuditLog model exists.
- `features/audit/services/audit.service.ts:15-27` â€” failures swallowed.
- `features/audit/repositories/audit.repository.ts:45-68` â€” no internal authorisation.
- `app/admin/audit/page.tsx:4,23` â€” direct repository call.
- `features/payments/services/payment.service.ts:160-178,204-219` â€” no audit writes.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: finance, operations, compliance.
- Affected markets: BH and PK.
- Business impact: unprovable financial actions, weak dispute handling.
- Why this matters now: #1/#7/#12/#16 add more sensitive mutations.

## Proposed outcome
Audit records are append-only, failure-safe and comprehensive for high-risk actions.

## Recommended solution
Use outbox or transactional audit writes that fail the business transaction on failure; enforce authorisation at data layer; add audit events for payment verification, refunds, webhook processing, permission changes and config changes; add retention/anonymisation hooks (#20).

## MVP scope
- In scope: failure-safe writes, high-risk event coverage, data-layer auth.
- Out of scope: tamper-evident hashing and full SIEM export.

## Multi-region considerations
- Data/privacy: audit retention differs by market and needs #20 validation.
- Currency: before/after JSON must preserve currency identity.

## Acceptance criteria
- [ ] Failed audit write rolls back the business change.
- [ ] Payment/refund/webhook/permission events are audited.
- [ ] Viewer uses authorised service, not raw repository.
- [ ] Tests cover success and audit-failure cases.

## Success measurement
- Metric: 100% of defined high-risk actions have audit records in tests.

## Dependencies and risks
- Depends on #16 for permission context; risk: write amplification on hot paths.

## Estimate
M â€” service changes and event coverage.

## Research and references
- No external research required.

## Product decision
Ready for development.
