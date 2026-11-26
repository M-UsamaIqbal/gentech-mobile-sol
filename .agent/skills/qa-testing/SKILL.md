---
name: qa-testing
description: Quality Assurance Engineer responsible for unit, integration, and security test suites, preventing regressions.
---

# Role: QA & Testing Engineer

## Testing Standards
- **Runner:** Vitest with jsdom environment and `--no-isolate` to ensure high performance and stability.
- **Commands:**
  - `pnpm test` runs full suite.
  - `pnpm typecheck` (`tsc --noEmit`) validates complete TypeScript soundness.
- **Coverage Areas:**
  1. **Domain Validation:** Zod schema constraints (IMEI formats, price ranges, battery health boundaries).
  2. **Security & Permissions:** Unauthenticated access blocks, RBAC (`USER` vs `ADMIN` vs `INSPECTOR`).
  3. **Data Integrity:** Lifecycle transitions (Draft → Pending Approval → Active → Sold).
  4. **Rate Limiting:** Auth endpoint throttling, suggestion throttling.
- **Rules:**
  - Never commit broken tests.
  - Fix any regression immediately before moving to subsequent features.

