# [P2][Admin][Feature] Replace single-role admin gate with data-driven permissions

**Labels:** enhancement, security, ux

## Opportunity / problem
The entire admin area is protected by one `role === ADMIN` check. `DealerPermission` and `hasPermission` exist but have no callers. Finance, support and content roles are described as future in the access page but are not implemented.

## Evidence from the existing code
- `features/admin/lib/require-admin.ts:6-15` â€” single role gate.
- `app/admin/layout.tsx:11-17` â€” layout-level single gate.
- `app/admin/access/page.tsx:27-40,58-74,142-145` â€” documents granular RBAC as not implemented.
- `features/dealer/types.ts:173-229` â€” permission helpers unused.
- `features/auth/repositories/initial-role.repository.ts:11-25` â€” bootstrap is safe but role set is small.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: admin, finance, support, dealers.
- Affected markets: BH and PK.
- Business impact: excessive privilege, no delegated operations, audit ambiguity.
- Why this matters now: #12 and #17 introduce sensitive finance and audit actions.

## Proposed outcome
Permissions are explicit, data-driven and enforced at page, action and API boundaries.

## Recommended solution
Add role/permission models and seed matrix; enforce server-side on every admin action and API; activate dealer permission helper with owner/manager scoping; add unauthorised-request tests; keep first-admin bootstrap intact.

## MVP scope
- In scope: permission model, enforcement points, dealer permission activation.
- Out of scope: MFA and session revocation (documented as pre-invite work).

## Multi-region considerations
- Region: delegated admins may be region-scoped; matrix must support optional country scope.
- Audit: every permission change must be logged (#17).

## Acceptance criteria
- [ ] Finance/support/content roles cannot access unrelated modules.
- [ ] Dealer permissions are enforced in dealer actions.
- [ ] Unauthorised server actions and APIs return errors.
- [ ] Permission changes are audited.
- [ ] Existing ADMIN behaviour remains correct.

## Success measurement
- Metric: zero unauthorised accesses in RBAC test suite.

## Dependencies and risks
- Depends on product definition of roles; risk: migration of existing ADMIN-only workflows.

## Estimate
L â€” schema, guards, UI hooks and tests.

## Research and references
- Needs product approval of role matrix.

## Product decision
Needs business validation.
