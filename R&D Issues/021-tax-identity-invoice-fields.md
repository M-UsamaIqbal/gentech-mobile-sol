# [P2][Multi-region][Research] Validate and model region-specific tax identity and invoice fields

**Labels:** investigation, finance, vat, sales-tax, pakistan-market, bahrain-market

## Opportunity / problem
Bahrain config has an empty `vatNumber`, Pakistan tax config is a placeholder, orders store only tax rate/amount/name, and only a generic dealer tax number exists. There is no TRN/STRN/NTN-specific invoice entity in the web app.

## Evidence from the existing code
- `lib/countries/bh.ts:26-30` â€” VAT 5% config with empty `vatNumber`.
- `lib/countries/pk.ts:26-29` â€” placeholder PK tax config.
- `prisma/schema.prisma:1490-1499` â€” order stores rate/amount/name only.
- `prisma/schema.prisma:864` â€” generic dealer tax number.
- `features/admin/components/admin-finance-workspace.tsx:228-233` â€” advisor-dependent tax warning.
- Confidence: High for technical absence; legal rules Unverified.

## Business rationale
- Affected users: finance, sellers, customers.
- Affected markets: BH and PK.
- Business impact: non-compliant or disputed invoices; #31 has no tax identity source.
- Why this matters now: invoice generation (#31) is already planned and Access report gaps #49/#59 show the same risk in the legacy system.

## Proposed outcome
A validated, market-specific tax identity and invoice field set feeds invoice generation.

## Recommended solution
Obtain qualified BH VAT/TRN and Pakistan tax/NTN/STRN requirements; model tax identity on customer/seller/order; define tax-inclusive/exclusive behaviour, invoice numbering and credit notes; then implement after approval.

## MVP scope
- In scope: requirements register, schema fields, configuration shape.
- Out of scope: final legal determination and filing automation.

## Multi-region considerations
- Tax: BH standard rate, zero-rated/exempt categories; PK federal/provincial treatment.
- Language: invoice labels in en/ar/ur.
- Audit: tax field changes must be logged (#17).

## Acceptance criteria
- [ ] Qualified advisor sign-off recorded per market.
- [ ] Required identifiers are present on order/invoice DTOs.
- [ ] Tax-inclusive/exclusive policy is explicit.
- [ ] Invoice numbering is sequential and audited.
- [ ] Tests cover BH and PK examples.

## Success measurement
- Metric: approved tax field checklist implemented with zero unresolved decisions.

## Dependencies and risks
- Depends on #31 and legal/finance validation; risk: rules may differ by seller/category.

## Estimate
M â€” discovery plus schema/DTO work.

## Research and references
- Needs official/regulator or advisor sources; no external research performed.

## Product decision
Research required.
