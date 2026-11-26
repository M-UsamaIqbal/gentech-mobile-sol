# [P2][Quality][Improvement] Run unit tests in CI and replace placeholder integration suites

**Labels:** enhancement, test, devops

## Opportunity / problem
CI runs lint, typecheck and build only, while integration test files are placeholders asserting `true`. The status document claims passing tests, but CI does not execute them.

## Evidence from the existing code
- `.github/workflows/ci.yml:10-11,44-51` â€” no `pnpm test` step.
- `tests/integration/listing-lifecycle.test.ts:4-29` â€” placeholder `expect(true).toBe(true)`.
- `tests/integration/messaging-leads.test.ts:4-32` â€” same pattern.
- `docs/PROGRESS_CHECKLIST.md:32-35` â€” 446 passing tests documented locally.
- Confidence: High (code-confirmed).

## Business rationale
- Affected users: all roles.
- Affected markets: BH and PK.
- Business impact: regressions reach production; claimed coverage is misleading.
- Why this matters now: this review adds many new test expectations (#1-#24).

## Proposed outcome
CI enforces the tests that protect payment, RBAC and regional behaviour.

## Recommended solution
Add `pnpm test` to CI; replace placeholders with real integration tests or explicitly skip with a tracked reason; add contract tests for webhook idempotency, RBAC, seller verification and currency precision.

## MVP scope
- In scope: CI step, placeholder replacement/skip markers, priority contract tests.
- Out of scope: full Testcontainers rollout if infrastructure is unavailable.

## Multi-region considerations
- Tests must cover BHD 3 decimals and PKR 2 decimals.
- Region routing and locale assertions should be included.

## Acceptance criteria
- [ ] CI runs tests and fails on test failures.
- [ ] No `expect(true)` placeholders remain untracked.
- [ ] Priority contract tests exist for payment/RBAC/currency.
- [ ] Build remains green.

## Success measurement
- Metric: CI test step present and passing on a clean run.

## Dependencies and risks
- Risk: test runtime and DB availability in CI.

## Estimate
M â€” workflow plus test replacements.

## Research and references
- No external research required.

## Product decision
Ready for development.
