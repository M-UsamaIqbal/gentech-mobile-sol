# [P1][Checkout][Bug] Capture a validated, zone-aware delivery address

**Labels:** bug, validation, delivery, pakistan-market, bahrain-market

## Opportunity / problem
Checkout renders address fields but they are uncontrolled; the client posts `deliveryAddress: {}`. Shipping zones and a `codAvailable` flag exist but are not enforced by order creation.

## Evidence from the existing code
- `components/checkout/checkout-client.tsx:71-80,130-157` â€” empty address posted from uncontrolled inputs.
- `app/api/orders/create/route.ts:13-20` â€” only country is checked.
- `features/shipping/services/shipping.service.ts:101,117` â€” `codAvailable` returned but ignored.
- `features/orders/services/order.service.ts:111-122` â€” stores one method/address without validation.
- `prisma/schema.prisma:1614-1673` â€” country/city/area taxonomy exists; no postal field found.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: buyers, sellers, support.
- Affected markets: BH and PK.
- Business impact: undeliverable orders, COD exceptions, support cost.
- Why this matters now: no amount of provider integration fixes an unusable address.

## Proposed outcome
Checkout collects a validated address and resolves it to a shipping zone before order creation.

## Recommended solution
Use controlled fields with country-specific validation, persist structured address lines/city/area/postal where applicable, resolve zone server-side, reject COD when `codAvailable=false`, and bind the validated zone to the order.

## MVP scope
- In scope: address capture, validation, zone resolution, COD enforcement.
- Out of scope: carrier label generation and split shipments (#13).

## Multi-region considerations
- Address: PK postal code and BH address conventions require business validation.
- Shipping: region-specific methods/zones must be seeded (#24).
- Payments: COD availability must be enforced at order creation.

## Acceptance criteria
- [ ] Empty address cannot create an order.
- [ ] Invalid city/area/postal values are rejected per country.
- [ ] COD is blocked outside eligible zones.
- [ ] Order stores the validated address and resolved zone.
- [ ] Existing shipping selection remains functional.

## Success measurement
- Metric: zero orders with empty or unresolvable delivery address in tests.

## Dependencies and risks
- Depends on #24 for seeded zone data; risk: address-format policy decisions.

## Estimate
M â€” form, schema/service validation and tests.

## Research and references
- Needs business validation of BH/PK address and postal rules.

## Product decision
Ready for development after address-rule confirmation.
