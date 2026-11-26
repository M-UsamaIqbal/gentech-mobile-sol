# [P1][Payments][Bug] Align payment configuration with executable providers and wire checkout initiation

**Labels:** bug, integration, payments, ux

## Opportunity / problem
`lib/payment-config.ts` advertises methods that have no registered provider, while `features/payments/providers/index.ts` registers only sandbox and defaults to it. Checkout never calls `/api/payments/initiate`, so an order is created as UNPAID and the buyer is sent to order detail instead of a payment handoff.

## Evidence from the existing code
- `lib/payment-config.ts:33-181` â€” region method metadata and disabled defaults.
- `features/payments/providers/index.ts:17-20,32-46` â€” sandbox-only registry/default.
- `components/checkout/checkout-client.tsx:67-86` â€” posts order only; no initiate call.
- `app/api/payment-methods/route.ts:8-9` â€” returns enabled-only methods.
- `app/admin/finance/page.tsx:108-118` â€” explicit boundary that fees/settlements are separate.
- Confidence: High (code-confirmed); live providers remain Unverified.

## Business rationale
- Affected users: customers, operations.
- Affected markets: BH and PK.
- Business impact: failed checkout, misleading payment options, abandoned orders.
- Why this matters now: this is the missing orchestration layer before provider onboarding (#35/#36) can deliver value.

## Proposed outcome
Checkout presents only executable methods and starts the correct provider flow for the order.

## Recommended solution
Create one provider/config source of truth shared by checkout, order payments, admin and inspections; remove disabled defaults; expose capability flags; call initiate after order creation with owner binding (#4); handle redirect/failure states.

## MVP scope
- In scope: config registry alignment, checkout initiation wiring, method filtering.
- Out of scope: implementing BenefitPay/JazzCash/Easypaisa (#35/#36) and live PayFast (#34).

## Multi-region considerations
- Payment: BH methods vs PK methods must be isolated.
- Currency: selected method must match order currency.
- Compliance: production remains fail-closed without credentials.

## Acceptance criteria
- [ ] No method is shown without a registered provider.
- [ ] Checkout initiates payment after order creation.
- [ ] Sandbox cannot be selected in production by default.
- [ ] BH and PK method lists are distinct and correct.
- [ ] Failure redirects to a retryable state.

## Success measurement
- Metric: zero checkout orders left UNPAID because no payment handoff occurred.

## Dependencies and risks
- Depends on #1/#4/#5; risk: provider onboarding remains blocked externally.

## Estimate
M â€” config consolidation and checkout wiring.

## Research and references
- No external research required.

## Product decision
Ready for development.
