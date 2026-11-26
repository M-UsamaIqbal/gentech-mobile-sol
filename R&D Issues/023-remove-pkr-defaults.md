# [P2][Multi-region][Bug] Remove hardcoded PKR defaults outside the known Bahrain CTA

**Labels:** bug, currency, pakistan-market

## Opportunity / problem
Several modules default to PKR independently of country context: saved-search labels, valuation, promotion plans, inspection plans and inspection payment. These are separate from the Bahrain inspection CTA already tracked in #26.

## Evidence from the existing code
- `features/saved-searches/lib/label.ts:32` â€” hardcoded `Rs`.
- `features/phone-intelligence/services/valuation.service.ts:153,191` â€” PKR defaults.
- `features/promotions/components/admin-promotion-plans.tsx:34,124,221` â€” `Rs` labels.
- `features/inspections/components/admin-plans-manager.tsx:213` â€” `Rs` label.
- `features/inspections/services/payment.service.ts:41-49` â€” PKR default.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: Bahrain buyers/sellers/admin.
- Affected markets: Bahrain primarily; Pakistan indirectly.
- Business impact: wrong price expectations, trust erosion, duplicate support tickets.
- Why this matters now: #26 fixed one surface but the same defect pattern remains elsewhere.

## Proposed outcome
All money rendering derives from market/currency context through one formatter.

## Recommended solution
Replace hardcoded symbols/defaults with `formatMoney(amount, currency)` from the central currency module; add region to relevant DTOs where absent; add a repository-wide lint/test guard for `Rs`/`PKR` literals outside config/tests.

## MVP scope
- In scope: listed modules and guard test.
- Out of scope: #26 CTA and #8 precision changes.

## Multi-region considerations
- Currency: BHD must show BHD; PKR remains correct in PK.
- Language: formatter handles ar/ur numerals where applicable.

## Acceptance criteria
- [ ] Listed modules use market currency from context.
- [ ] BHD surfaces show no PKR symbols.
- [ ] Pakistan surfaces remain unchanged.
- [ ] Guard test fails on new hardcoded `Rs`/`PKR` literals outside config/tests.

## Success measurement
- Metric: zero hardcoded PKR occurrences outside allowed config/tests.

## Dependencies and risks
- Depends on #8 formatter; risk: valuation service may need region context added.

## Estimate
M â€” call-site changes and guard.

## Research and references
- No external research required.

## Product decision
Ready for development.
