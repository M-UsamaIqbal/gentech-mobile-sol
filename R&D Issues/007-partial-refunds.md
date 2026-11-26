# [P1][Payments][Feature] Add provider-backed partial refunds with cumulative state

**Labels:** enhancement, payments, finance

## Opportunity / problem
`refundPayment` accepts an arbitrary amount, never calls `provider.refund()`, and does not update the order. Only one `refundAmount` field exists, so cumulative partial refunds cannot be represented.

## Evidence from the existing code
- `features/payments/services/payment-state.service.ts:7-14` â€” only `SUCCEEDED -> REFUNDED`.
- `features/payments/services/payment.service.ts:157-185` â€” no provider call, no order update.
- `features/payments/providers/sandbox.provider.ts:41-46` â€” refund method unused.
- `prisma/schema.prisma:1595-1600` â€” single `refundAmount`.
- Confidence: High (code-confirmed); provider behaviour Unverified.

## Business rationale
- Affected users: customers, finance, support.
- Affected markets: BH and PK.
- Business impact: refund disputes, incorrect revenue, manual provider work.
- Why this matters now: payments are being enabled; refunds are unavoidable.

## Proposed outcome
Refunds are recorded, provider-authorised and reflected on the order.

## Recommended solution
Add refund records with amount, currency, reason, provider reference and status; allow cumulative partial refunds bounded by captured amount; call provider refund API; add `PARTIALLY_REFUNDED` payment/order state; audit every refund.

## MVP scope
- In scope: refund records, partial state, provider call, order sync, audit.
- Out of scope: refund UX policy and dispute automation.

## Multi-region considerations
- Currency/refund: refund in original transaction currency; record FX if provider settles differently (#12).
- Tax: credit-note requirements need validation (#21).

## Acceptance criteria
- [ ] Partial refunds accumulate without exceeding captured amount.
- [ ] Provider refund reference is persisted.
- [ ] Order state reflects full/partial refund.
- [ ] Failed refunds remain retryable and audited.
- [ ] BHD 3-decimal and PKR 2-decimal tests pass.

## Success measurement
- Metric: refund totals match provider settlement records in reconciliation tests.

## Dependencies and risks
- Depends on provider APIs (#34-#36) and #8/#12; risk: provider-specific refund eligibility.

## Estimate
L â€” schema, state machine, provider integration and tests.

## Research and references
- Provider refund capability must be verified during #34-#36; no external research performed here.

## Product decision
Ready for development after provider capability confirmation.
