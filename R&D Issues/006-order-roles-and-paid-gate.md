# [P1][Orders][Bug] Use real order roles and gate fulfilment on paid state

**Labels:** bug, data-quality, validation

## Opportunity / problem
The order transition matrix uses `CUSTOMER`, `SELLER` and `SYSTEM`, but the issued role enum contains only `USER`, `INSPECTOR` and `ADMIN`. Seller/customer transitions are therefore unreachable, and fulfilment is not gated on payment state.

## Evidence from the existing code
- `lib/constants.ts:53-57` and `prisma/schema.prisma:18-22` â€” roles are `USER/INSPECTOR/ADMIN`.
- `features/orders/services/order-status.service.ts:31-41` â€” transitions expect `CUSTOMER/SELLER/SYSTEM`.
- `app/api/orders/status/route.ts:19-25` â€” passes actual session role.
- `dashboard/seller/orders/page.tsx:84` â€” UI asks for `SELLER` transitions.
- `features/orders/services/order-status.service.ts:71-79` â€” pre-read lacks `paymentStatus`.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: buyers, sellers, operations.
- Affected markets: BH and PK.
- Business impact: fulfilment stalls, inconsistent order state, manual intervention.
- Why this matters now: core order workflow is otherwise implemented.

## Proposed outcome
Order roles map to actual account roles and paid status controls fulfilment.

## Recommended solution
Map order actors to real roles plus ownership; add compare-and-set transitions in one transaction; require `PAID` before fulfilment states; preserve tracking as a dedicated field/record rather than overwriting notes; scope seller actions to that seller's items.

## MVP scope
- In scope: role mapping, ownership, paid gate, note preservation.
- Out of scope: full split shipments (#13).

## Multi-region considerations
- No region-specific transition rules; currency isolation already exists in order creation.

## Acceptance criteria
- [ ] Seller can transition only own items.
- [ ] Customer can transition only own order where allowed.
- [ ] Unpaid orders cannot enter fulfilment states.
- [ ] Notes are not overwritten by tracking updates.
- [ ] Authorisation tests pass for all three real roles.

## Success measurement
- Metric: zero unreachable or unauthorised transitions in order-state tests.

## Dependencies and risks
- Depends on payment state accuracy (#1/#5); risk: legacy rows with old actor tokens need migration mapping.

## Estimate
M â€” status service, API and tests.

## Research and references
- No external research required.

## Product decision
Ready for development.
