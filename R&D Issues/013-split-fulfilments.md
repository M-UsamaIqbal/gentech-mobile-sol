# [P2][Orders][Feature] Support per-seller fulfilments and split shipment tracking

**Labels:** enhancement, delivery, ux

## Opportunity / problem
An order has one shipping method/address and sellers see order-wide controls. There is no shipment model, tracking field or partial delivery state; admin shipments page states no order/carrier integration.

## Evidence from the existing code
- `components/checkout/checkout-client.tsx:40-42,71-80` â€” one shipping selection.
- `features/orders/services/order.service.ts:111-121,149-151` â€” one method/address on order.
- `dashboard/seller/orders/page.tsx:33-60,142-147` â€” seller filters items but uses order-wide controls.
- `app/admin/shipments/page.tsx:22-31,54-64` â€” no shipment API/order model connected.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: sellers, buyers, operations.
- Affected markets: BH and PK.
- Business impact: multi-seller orders cannot ship independently; tracking stored in notes.
- Why this matters now: role/state work (#6) should not bake in single-seller assumptions.

## Proposed outcome
Orders contain seller-scoped fulfilments with independent status and tracking.

## Recommended solution
Add fulfilment/sub-order records linked to order items; allocate shipping per fulfilment; scope seller transitions to own fulfilments; store tracking as structured data; expose partial delivery states.

## MVP scope
- In scope: seller fulfilment records, independent status, tracking field.
- Out of scope: carrier label APIs and cross-border customs.

## Multi-region considerations
- Shipping: region-specific methods/zones still apply (#10/#24).
- Currency: shipping fees remain in order currency.

## Acceptance criteria
- [ ] Seller sees and updates only own fulfilments.
- [ ] One fulfilment can be delivered while another remains open.
- [ ] Tracking is not stored in free-text notes.
- [ ] Existing single-seller orders remain correct.

## Success measurement
- Metric: multi-seller split fulfilment tests pass without order-wide side effects.

## Dependencies and risks
- Depends on #6; risk: data migration for existing orders.

## Estimate
L â€” schema, seller UI, services and tests.

## Research and references
- No external research required.

## Product decision
Ready for development after #6.
