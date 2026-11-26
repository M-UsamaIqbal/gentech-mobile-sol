# [P1][Payments][Bug] Bind payment initiation to the authenticated order owner

**Labels:** bug, security, payments, validation

## Opportunity / problem
The payment initiation route authenticates the caller but does not pass the user to the service; the service reads `customerId` from the request/order without proving ownership.

## Evidence from the existing code
- `app/api/payments/initiate/route.ts:7-19` â€” session exists but no user identity is forwarded for ownership checks.
- `features/payments/services/payment.service.ts:29-49` â€” reads `customerId` without caller assertion.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: customers, support.
- Affected markets: BH and PK.
- Business impact: unauthorised payment attempts, support disputes, privacy exposure.
- Why this matters now: cheap fix before live providers are enabled.

## Proposed outcome
Payment initiation is authorised against the order owner and selected method.

## Recommended solution
Pass session user id to the service; load the order and require `order.customerId === user.id`; validate method belongs to order country/currency; return 403/404 without order details on mismatch.

## MVP scope
- In scope: ownership assertion and method/country consistency.
- Out of scope: provider onboarding (#35/#36).

## Multi-region considerations
- Currency/region: method must match order country and currency; no BH/PKR or PK/BHD crossing.

## Acceptance criteria
- [ ] Owner can initiate; non-owner cannot.
- [ ] Cross-country/currency method selection is rejected.
- [ ] Unauthorised responses do not leak order data.
- [ ] Tests cover owner, non-owner and unknown order.

## Success measurement
- Metric: zero unauthorised initiation successes in tests.

## Dependencies and risks
- No external dependency; risk: existing sandbox tests may rely on omitted user context.

## Estimate
S â€” route and service guard plus tests.

## Research and references
- No external research required.

## Product decision
Ready for development.
