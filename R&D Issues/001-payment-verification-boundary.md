# [P0][Payments][Bug] Require signed, amount-checked verification and isolate read-only return callbacks

**Labels:** bug, security, payments, validation

## Opportunity / problem
`POST /api/payments/callback` (#42) is the publicised gap, but the surrounding verification boundary is still unsafe: `GET /api/payments/callback` mutates payment state, the sandbox callback auto-verifies any payment id, and `verifyPayment` ignores the provider-reported amount/currency. A wrong or replayed callback can mark an unpaid order paid.

## Evidence from the existing code
- `app/api/payments/callback/route.ts:4-15` â€” unauthenticated GET callback mutates state via duplicated `providerReference` lookup.
- `app/api/payments/sandbox/callback/route.ts:14-15` â€” sandbox callback auto-verifies any supplied `paymentId`.
- `features/payments/types.ts:47-54` â€” provider result has `amount`/`currency`; `features/payments/services/payment.service.ts:138-180` ignores them.
- `features/payments/services/payment.service.ts:197-200` â€” signature check is conditional.
- `features/payments/services/payment-state.service.ts:109-152` â€” atomic helper exists but is unused.
- Confidence: High (code-confirmed); runtime provider behaviour Unverified.

## Business rationale
- Affected users: customers, marketplace operations.
- Affected markets: BH and PK.
- Business impact: financial integrity, trust, chargeback risk.
- Why this matters now: checkout is being prepared for real providers (#34-#36); an unsafe boundary would scale the defect.

## Proposed outcome
Only a signed, server-to-server webhook may change payment or order state. Browser return URLs are read-only status pages.

## Recommended solution
Require signature for every state-changing callback; match stored `providerReference`, amount, currency, order id and expected status; use `processWebhookAtomic`; persist a unique provider event id; convert GET/sandbox callbacks to read-only or sandbox-gated handlers.

## MVP scope
- In scope: POST callback hardening, GET return read-only, amount/currency/reference checks, atomic event persistence.
- Out of scope: new payment providers (#34-#36), ledger posting (#31).

## Multi-region considerations
- Currency: BHD 3 decimals, PKR 2 decimals after #8; never compare formatted strings.
- Tax: no change.
- Payment/shipping: none.
- Language: status pages must use existing locale strings.

## Acceptance criteria
- [ ] Unsigned or mismatched callback cannot modify payment/order state.
- [ ] Amount/currency/reference mismatch is rejected and audited.
- [ ] Duplicate provider event id is a no-op.
- [ ] GET return endpoints do not write state.
- [ ] Tests cover success, replay, mismatch and signature failure.

## Success measurement
- Metric: zero state changes from unsigned/mismatched callbacks in integration tests; no duplicate activation.

## Dependencies and risks
- Depends on existing payment abstraction; risk: provider payload shapes must be verified with sandbox credentials.

## Estimate
M â€” service and route hardening plus tests; no schema change beyond event id if needed.

## Research and references
- No external research required. Runtime provider behaviour remains Unverified.

## Product decision
Ready for development. Separate from #42: this covers the full verification boundary, not only the unsigned POST report.
