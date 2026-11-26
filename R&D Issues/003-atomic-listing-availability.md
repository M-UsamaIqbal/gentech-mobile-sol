# [P1][Inventory][Feature] Enforce atomic listing availability and cart quantity limits

**Labels:** enhancement, data-quality

## Opportunity / problem
Cart accepts unbounded quantities and order creation does not decrement `DealerInventory.stockCount` or mark unique listings as sold. Two buyers can pay for the same item.

## Evidence from the existing code
- `features/cart/services/cart.service.ts:84-110` â€” validates active listing but not stock ceiling.
- `app/api/cart/route.ts:28-35,69-84` â€” quantity updates lack availability checks.
- `prisma/schema.prisma:243-322` â€” listing has `status`/`soldAt` but no stock quantity.
- `prisma/schema.prisma:950-971` â€” `DealerInventory.stockCount` exists but is not consumed.
- `features/orders/services/order.service.ts:134-173` â€” order transaction does not reserve or deduct stock.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: buyers, dealers, support.
- Affected markets: BH and PK.
- Business impact: overselling, refunds, seller trust.
- Why this matters now: order flow is otherwise transactional; inventory is the missing atomic step.

## Proposed outcome
Availability is enforced at add-to-cart and again atomically at paid-order conversion.

## Recommended solution
Add a stock/reservation rule per listing type; cap cart quantity; perform compare-and-set stock decrement or unique `SOLD` transition inside the order transaction; release reservations on failed/abandoned payment.

## MVP scope
- In scope: quantity cap, atomic paid-order conversion, dealer stock decrement, sold state for unique listings.
- Out of scope: warehouse transfers and supplier replenishment.

## Multi-region considerations
- No region-specific rule; applies to BH and PK sellers.

## Acceptance criteria
- [ ] Concurrent checkout tests cannot oversell.
- [ ] Dealer stockCount decrements for linked listings.
- [ ] Failed payment releases any reservation.
- [ ] Existing cart behaviour remains correct for in-stock items.

## Success measurement
- Metric: zero oversell outcomes in concurrency tests.

## Dependencies and risks
- Depends on payment state (#1/#5) for release timing; risk: listing schema change if stock rules are attached directly.

## Estimate
M â€” schema/service changes plus concurrency tests.

## Research and references
- No external research required.

## Product decision
Ready for development.
