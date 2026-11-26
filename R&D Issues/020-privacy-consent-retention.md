# [P2][Privacy][Research] Validate and implement consent, export, erasure and retention workflows

**Labels:** investigation, legal, pakistan-market, bahrain-market

## Opportunity / problem
Privacy/terms exist only as one-sentence strings in country config, translated footer keys are not rendered, no consent model or export/erasure route exists, and audit/dealer documents have no retention or anonymisation rule.

## Evidence from the existing code
- `lib/countries/bh.ts:37-41` and `lib/countries/pk.ts:36-40` â€” policy strings only.
- `messages/en.json:411-412`, `ar.json:411-412`, `ur.json:411-412` â€” footer keys.
- `components/layout/site-footer.tsx:26-39` â€” no policy links rendered.
- `app/admin/communications/page.tsx:16,22,42` â€” consent reporting unconfigured.
- `prisma/schema.prisma:53,322,811-830` â€” soft delete/AuditLog but no consent or retention fields.
- Confidence: High for technical absence; legal requirements Unverified.

## Business rationale
- Affected users: customers, sellers, operations.
- Affected markets: BH and PK.
- Business impact: policy not user-reachable, no data-subject workflow, retention risk.
- Why this matters now: #15/#17 introduce more personal data in events and audits.

## Proposed outcome
Policies are reachable and technical workflows support the approved retention/consent policy.

## Recommended solution
After qualified legal review, add policy routes/links, purpose-based consent records, account export/erasure requests, and retention/anonymisation jobs for audit logs, verification documents and notifications.

## MVP scope
- In scope: discovery, policy routing, consent model, export/erasure request workflow.
- Out of scope: final legal text and cross-border transfer decisions.

## Multi-region considerations
- Compliance: BH and PK obligations must be validated separately.
- Language: en/ar/ur policy content required.
- Data: retention varies by record type and market.

## Acceptance criteria
- [ ] Policy links are reachable from footer in all locales.
- [ ] Consent is recorded with purpose and timestamp.
- [ ] Export/erasure requests are authenticated and audited.
- [ ] Retention job is idempotent and tested.
- [ ] Legal sign-off is recorded before launch.

## Success measurement
- Metric: approved policy checklist complete and workflow tests passing.

## Dependencies and risks
- Depends on legal/compliance decision; risk: final policy text cannot be inferred from code.

## Estimate
L â€” research, schema, pages and jobs.

## Research and references
- Needs qualified BH/PK legal review; no external research performed.

## Product decision
Research required.
