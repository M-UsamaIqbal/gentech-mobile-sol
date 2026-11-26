# [P1][Seller][Bug] Enforce seller approval and route region before listing creation

**Labels:** bug, validation, pakistan-market, bahrain-market

## Opportunity / problem
Listing creation checks authentication but not seller verification approval, and listing region is taken from `user.region` rather than the route country. A seller can list before approval or create a PK listing while browsing a BH route.

## Evidence from the existing code
- `features/listings/actions/create-listing.ts:20-41` â€” auth only.
- `features/seller-verification/services/seller-verification.service.ts:55-69,90-105` â€” approval workflow exists.
- `features/listings/repositories/listing.repository.ts:737-745,797` â€” region from `user.region`.
- `features/localization/repositories/user-preferences.repository.ts:50-53` â€” saves only `preferredCountry`.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: buyers, sellers, moderators.
- Affected markets: BH and PK.
- Business impact: unverified sellers, wrong-region catalog, trust and compliance risk.
- Why this matters now: verification workflow exists but is not enforced at the point of value creation.

## Proposed outcome
Listing creation requires market-specific seller approval and uses the resolved route country.

## Recommended solution
Add a server-side eligibility check against `SellerVerification` status for the resolved country; derive listing region from route country or synchronise `user.region` with `preferredCountry`; return a clear approval-required error; add tests for both markets.

## MVP scope
- In scope: approval gate and region resolution.
- Out of scope: document storage (#37), new verification rules.

## Multi-region considerations
- Seller eligibility: may differ by market; rules must be data-driven.
- Catalog: region-scoped filtering already exists and must remain intact.

## Acceptance criteria
- [ ] Unapproved seller cannot create a listing.
- [ ] Approved seller can list only in approved country.
- [ ] BH route creates BH listing; PK route creates PK listing.
- [ ] Existing approved sellers are not blocked.

## Success measurement
- Metric: zero listings created from unapproved or mismatched-region sellers in tests.

## Dependencies and risks
- Depends on completed verification workflow; risk: migration of existing `user.region` values.

## Estimate
M â€” action/repository guards and tests.

## Research and references
- No external research required; market eligibility policy needs business confirmation.

## Product decision
Ready for development after eligibility policy confirmation.
