# [P2][Payments][Improvement] Add failed-payment retry and stale-payment reconciler

**Labels:** enhancement, payments, devops

## Opportunity / problem
Provider init failure marks a payment FAILED, `FAILED -> PENDING` exists but has no caller, result pages are static, and no reconciliation job checks stale payments. The cart is already cleared at order creation, so a failed payment can leave the buyer without a clear recovery path.

## Evidence from the existing code
- `features/payments/services/payment.service.ts:108-112` â€” init failure marks FAILED.
- `features/payments/services/payment-state.service.ts:11` â€” retry transition unused.
- `dashboard/payment/success/page.tsx:17-32` â€” static result page.
- `features/orders/services/order.service.ts:168-170` â€” cart cleared at order creation.
- Confidence: High (code-confirmed); job runtime Unverified.

## Business rationale
- Affected users: customers, support.
- Affected markets: BH and PK.
- Business impact: abandoned orders, manual support, lost conversion.
- Why this matters now: providers are not yet live; recovery should be designed before enablement.

## Proposed outcome
Failed and stale payments move through a deterministic recovery flow.

## Recommended solution
Add a scheduled reconciler using #19 that queries provider status for stale PENDING/PROCESSING payments, applies idempotent state transitions, restores cart/order eligibility where appropriate, and renders actionable retry/failure pages.

## MVP scope
- In scope: stale-payment query, provider status check, retry UX hook.
- Out of scope: full cart restoration policy and dunning.

## Multi-region considerations
- Currency: reconciliation must use original transaction currency.
- Payments: provider status semantics need verification per provider.

## Acceptance criteria
- [ ] Stale payments are picked up by the job.
- [ ] Provider status maps deterministically to local state.
- [ ] Retry does not duplicate payment (#5).
- [ ] Customer sees correct status for success/failure.
- [ ] Job failures are logged and retried.

## Success measurement
- Metric: no payment remains PENDING beyond the agreed stale window without reconciliation.

## Dependencies and risks
- Depends on #5 and #19; risk: provider lookup capability.

## Estimate
M â€” job, service hooks and status UI.

## Research and references
- Needs provider status-query capability confirmation during #34-#36.

## Product decision
Ready for development after #5/#19.
