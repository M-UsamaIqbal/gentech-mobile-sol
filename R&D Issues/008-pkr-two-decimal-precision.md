# [P1][Multi-region][Bug] Restore PKR 2-decimal precision across pricing and notifications

**Labels:** bug, currency, pakistan-market, qa

## Opportunity / problem
PKR is configured with `decimals: 0`, so `1000.57` is rounded to `1001` and formatted as `Rs 1,001`. BHD 3-decimal handling is correct, but PKR sub-rupee amounts are lost in web pricing, checkout and notifications.

## Evidence from the existing code
- `lib/currency.ts:21-24` â€” PKR decimals `0`, BHD `3`.
- `utils/format.ts:7-10,33-40` â€” formatter uses currency config.
- `components/checkout/checkout-client.tsx:65` and `checkout-summary.tsx:103` â€” client formatting.
- `features/notifications/services/notification-delivery.service.ts:138` â€” notification formatting.
- `tests/currency/currency-precision.test.ts:65-105` â€” current expectation encodes 0-decimal PKR.
- Confidence: High (direct evaluation of repo formulas); runtime not re-executed.

## Business rationale
- Affected users: Pakistani buyers and sellers.
- Affected markets: Pakistan.
- Business impact: wrong displayed prices, pricing disputes, inaccurate notifications.
- Why this matters now: PKR checkout providers are planned (#36).

## Proposed outcome
PKR uses explicit 2-decimal money handling end to end while BHD remains 3 decimals.

## Recommended solution
Set PKR precision to 2, update formatter expectations and notification templates, ensure DB `Decimal(12,3)` values are rounded with market precision at the boundary, and update golden tests for both currencies.

## MVP scope
- In scope: currency config, formatter, checkout/notification call sites, tests.
- Out of scope: Access report issue #50 (BHD reports), FX conversion.

## Multi-region considerations
- Currency: BHD 3 / PKR 2 must be isolated.
- Tax: BHD VAT and PK tax must continue to round per market.
- Payments: gateway amounts must use market precision.

## Acceptance criteria
- [ ] `1000.57` renders as `Rs 1,000.57`.
- [ ] BHD 3-decimal behaviour unchanged.
- [ ] Order/payment/notification totals agree.
- [ ] Currency precision tests updated and passing.
- [ ] No cross-region currency leakage.

## Success measurement
- Metric: currency precision golden tests pass for BHD and PKR.

## Dependencies and risks
- Related to #2 and #36; risk: historical displayed totals may differ after fix.

## Estimate
M â€” config, call sites and test updates.

## Research and references
- No external research required; business decision needed only if PKR pricing intentionally excludes paisa.

## Product decision
Ready for development, pending product confirmation of PKR 2-decimal policy.
