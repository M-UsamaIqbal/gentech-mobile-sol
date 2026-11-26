# [P2][Finance][Feature] Record provider settlements, fees, FX and seller payouts

**Labels:** enhancement, finance, payments, reconciliation

## Opportunity / problem
Payment records store only amount/currency/refund fields. There is no gross/fee/net settlement data, FX rate, provider batch reference, payout eligibility, hold period or approval. Finance pages describe reconciliation but have no connected records.

## Evidence from the existing code
- `prisma/schema.prisma:1571-1612` â€” Payment has amount/currency/refund only.
- `app/admin/finance/page.tsx:93-99` â€” collections show "Not connected".
- `features/admin/components/admin-finance-workspace.tsx:359-376,423-486,653-668` â€” described controls but no records.
- `app/admin/payments/page.tsx:9-10` â€” redirects to finance integrations.
- Confidence: High for absence in code; accounting policy Unverified.

## Business rationale
- Affected users: finance, operations, sellers.
- Affected markets: BH and PK.
- Business impact: no proof of net settlement, payout delays, reconciliation exceptions.
- Why this matters now: #31 will post ledger entries but has no source settlement data to post from.

## Proposed outcome
Provider settlements become the authoritative source for fees, net receipts and seller payouts.

## Recommended solution
Add settlement and payout models with gross, fee, net, settlement currency, FX rate, provider batch/reference, hold window, approval and exception state; build matching/import flow; expose variance queue; post to ledger only from matched records.

## MVP scope
- In scope: settlement record, payout eligibility/approval, basic exception queue.
- Out of scope: bank-file automation and tax filing (#21/#31).

## Multi-region considerations
- Currency: transaction vs settlement currency and rate must be recorded.
- Tax: fees may be taxable in one market only â€” needs validation.
- Payments: provider-specific fee structures need verified statements.

## Acceptance criteria
- [ ] Gross/fee/net reconciles to provider statement.
- [ ] Payout requires delivery/refund hold window and approval.
- [ ] FX rate and timestamp are stored when currencies differ.
- [ ] Variance queue lists unmatched settlements.
- [ ] Finance role restrictions are enforced.

## Success measurement
- Metric: settlement variance count reaches zero before payout approval.

## Dependencies and risks
- Depends on #31 for ledger posting; risk: finance policy and provider statements must be supplied.

## Estimate
L â€” schema, import/matching, approval workflow and tests.

## Research and references
- Needs finance/operations validation of fee, hold and payout rules.

## Product decision
Needs business validation.
