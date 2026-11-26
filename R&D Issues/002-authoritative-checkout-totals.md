# [P1][Checkout][Bug] Make checkout totals authoritative and persist the quoted discount

**Labels:** bug, finance, currency, validation

## Opportunity / problem
The checkout quote accepts client-submitted amounts and subtracts the discount twice, while order creation ignores the discount entirely. A buyer can see one total, be charged another, and receive an order with a third persisted value.

## Evidence from the existing code
- `app/api/checkout/calculate/route.ts:5-21` â€” accepts client `subtotal` and `discount`.
- `features/checkout/services/checkout.service.ts:50-54` â€” discount reduces taxable base.
- `lib/tax.ts:38` â€” discount subtracted again.
- `features/orders/services/order.service.ts:124-129,147` â€” discount input absent; persisted `discount=0`.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: customers, finance, support.
- Affected markets: BH and PK.
- Business impact: revenue leakage, refund disputes, trust erosion.
- Why this matters now: provider integration (#34-#36) will make the wrong amount chargeable.

## Proposed outcome
A server-generated quote is the single source of truth from cart to payment.

## Recommended solution
Derive subtotal from cart, apply discount once, use a shared `roundCurrency` with market precision, persist quote id/subtotal/discount/tax/total on the order, and make `/api/checkout/calculate` ignore client amounts.

## MVP scope
- In scope: recomputation, single discount, quote persistence, currency-safe totals.
- Out of scope: promotion payment completion (M3 paused), new discount products.

## Multi-region considerations
- Currency: BHD 3 decimals, PKR 2 decimals (#8).
- Tax: existing per-country tax rules must remain authoritative.
- Invoicing: quote values feed future invoice work (#21/#31).

## Acceptance criteria
- [ ] Client-submitted amounts cannot influence the quote.
- [ ] Discount is applied exactly once.
- [ ] Quote and order totals match to the currency precision.
- [ ] BHD and PKR boundary tests pass.
- [ ] Existing behaviour in currently supported markets remains correct.

## Success measurement
- Metric: zero total-mismatch cases in checkout integration tests.

## Dependencies and risks
- Depends on #8 for PKR precision; risk: existing promotion flows need regression coverage.

## Estimate
M â€” checkout service, order schema fields and tests.

## Research and references
- No external research required.

## Product decision
Ready for development.
