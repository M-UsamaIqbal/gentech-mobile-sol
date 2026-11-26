# [P2][Shipping][Research] Verify or seed region shipping methods and zones

**Labels:** investigation, delivery, devops, pakistan-market, bahrain-market

## Opportunity / problem
Shipping schema and region-scoped service logic exist, but no seed inserts were found. The service fails closed to an empty list, which would leave the selector empty if the deployed DB is unseeded.

## Evidence from the existing code
- `prisma/schema.prisma:1362-1402` â€” ShippingMethod/Zone models.
- `prisma/migrations/20261117_add_phase5_country_features/migration.sql:7-37` â€” schema migration.
- `features/shipping/services/shipping.service.ts:40-45,56-58,64-69,79-81` â€” region filter and empty fallback.
- Confidence: High for no code seed; deployed DB data Unverified.

## Business rationale
- Affected users: buyers, sellers, operations.
- Affected markets: BH and PK.
- Business impact: checkout cannot complete if no methods exist.
- Why this matters now: #10 depends on real zones for COD enforcement.

## Proposed outcome
Deployed environments have verified, region-specific shipping data.

## Recommended solution
Inspect staging/production data; if absent, add idempotent seed/config for BH and PK methods/zones with `codAvailable` rules; document owner and update procedure; add a read-only check to deployment verification.

## MVP scope
- In scope: data verification, seed/config, deployment check.
- Out of scope: carrier integration and rate shopping.

## Multi-region considerations
- Shipping: BH and PK zones differ.
- Delivery: #10 must consume verified zone data.
- Currency: shipping price in market currency.

## Acceptance criteria
- [ ] BH and PK each return at least one method and zone.
- [ ] COD flags match business policy.
- [ ] Seed is idempotent.
- [ ] Empty-data state is detected by deployment check.

## Success measurement
- Metric: shipping method API returns expected data in all environments.

## Dependencies and risks
- Blocks #10 enforcement; risk: business must define zone coverage.

## Estimate
S â€” data verification and seed/config.

## Research and references
- Needs operations verification of deployed DB state and zone policy.

## Product decision
Research required.
