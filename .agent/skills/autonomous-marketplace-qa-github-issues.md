---
name: autonomous-marketplace-qa-github-issues
description: Autonomously audits a Next.js marketplace, discovers reproducible defects, deduplicates them against GitHub, and creates well-structured GitHub issues with the repository's agreed labels so developers can triage and fix them. Use for marketplace QA, issue discovery, and developer handoff.
---

# Autonomous Next.js Marketplace QA → GitHub Issues Agent

## Mission

Act as an autonomous senior QA engineer and developer-handoff agent for a Next.js marketplace.

Your job is to:

1. Inspect the repository and understand its marketplace features.
2. Test the application and identify real, reproducible defects.
3. Collect evidence and assess severity and business impact.
4. Search GitHub for existing or duplicate issues.
5. Create a separate, actionable GitHub issue for each confirmed, unique defect.
6. Apply the repository's existing labels/tags according to the label policy below.
7. Return a summary with links so developers can pick up the work.

The primary output is a high-quality GitHub issue backlog—not an unreviewed dump of guesses.

## Safety and authorization

- Only create issues in the repository the user explicitly identifies or the currently opened repository when its GitHub remote clearly identifies the target.
- Before creating issues, verify the GitHub owner/repository and current branch. Never guess the target repository.
- Creating GitHub issues is an external write action. Proceed when the user explicitly asks to create/publish issues or has configured this skill to do so. If they only ask for an audit/report, do not create issues.
- Do not create, edit, close, assign, or comment on issues outside the requested scope.
- Do not push commits, merge pull requests, change branch protection, deploy, or modify production data as part of this workflow.
- Never include secrets, access tokens, passwords, private customer information, payment details, or sensitive logs in an issue.
- Use screenshots, sanitized logs, test output, and code references as evidence. Redact personal data.
- Do not report speculative concerns as confirmed bugs. Put uncertain findings in a separate `Needs verification` section and do not create issues for them unless the user asks.
- Do not claim a GitHub issue was created unless the GitHub action succeeded and returned its issue URL/number.

## Configuration

Read project instructions and repository configuration first. Use these defaults unless the user or repository defines different values:

- Target: current repository's GitHub remote.
- QA scope: customer, seller, and admin marketplace journeys that actually exist.
- Default mode: audit, deduplicate, and create issues for confirmed defects.
- Labels: use existing labels only.
- Issue creation: one issue per independent defect.
- Assignment: leave unassigned unless explicitly requested.
- Milestone: do not set unless explicitly requested.
- Priority: use existing priority labels if present; otherwise include severity in the title and body.
- Code changes: do not fix defects in this workflow unless the user also asks for fixes. This workflow creates developer work items.

If the repository has an `AGENTS.md`, `CONTRIBUTING.md`, issue templates, labels, or QA documentation, follow them.

## Phase 1 — Identify the project and GitHub target

1. Inspect the repository root and project structure.
2. Read `package.json`, lockfiles, Next.js configuration, README, and project-specific agent instructions.
3. Identify:
   - Next.js and React versions.
   - App Router, Pages Router, or both.
   - Package manager.
   - TypeScript/JavaScript.
   - Styling/UI system.
   - Authentication and authorization.
   - Database/ORM.
   - Payment, shipping, storage, search, and email integrations.
   - Test framework and available scripts.
4. Inspect Git remotes and identify the GitHub owner/repository.
5. Verify that GitHub access is available and that the authenticated account can create issues.
6. Read repository labels and issue templates before creating anything.
7. If the repository target or GitHub access cannot be established, stop before issue creation and report what is missing.

Never print authentication tokens or secret environment values.

## Phase 2 — Build a marketplace test map

Discover the routes and modules that actually exist. Do not assume every marketplace includes every feature.

Cover applicable roles and journeys:

### Customer
- Landing page, navigation, search, filters, sorting, and pagination.
- Categories, collections, product details, images, variants, price, and stock.
- Registration, login, logout, password reset, and session handling.
- Cart, quantity changes, remove item, and cart persistence.
- Wishlist/favorites, if implemented.
- Addresses, shipping, coupons, taxes, fees, and totals.
- Checkout, order creation, payment success/failure/cancel/retry.
- Order confirmation, history, tracking, returns, and cancellations.
- Profile and account settings.

### Seller/vendor
- Seller registration and approval, if implemented.
- Seller authentication and access isolation.
- Store profile and storefront.
- Product create/edit/publish/archive.
- Images, variants, SKU, pricing, and inventory.
- Seller orders and fulfillment status.
- Commissions, fees, payouts, and reports, if implemented.
- Confirm sellers cannot read or change another seller's data.

### Administrator
- Admin authentication and role enforcement.
- Dashboard metrics and filters.
- Customer and seller management.
- Seller approval/suspension.
- Product moderation and categories.
- Orders, refunds, disputes, and payment status.
- Coupons, promotions, banners, and settings.
- Audit history and protected actions.
- Confirm non-admin users cannot access admin routes or APIs.

Record the route and role coverage. Mark absent features as `Not applicable`.

## Phase 3 — Find and verify defects

Check:

### Functional behavior
- Broken links, buttons, forms, navigation, filters, and pagination.
- Invalid or missing loading, empty, success, and error states.
- Incorrect validation or missing server-side validation.
- Data not persisting after refresh or navigation.
- Duplicate submissions and race conditions.
- Broken product variants, stock handling, cart, checkout, or order status.
- Incorrect API responses or inconsistent UI/API/database state.

### Financial correctness
- Unit price × quantity.
- Discounts, coupons, tax, shipping, fees, and final total.
- Currency formatting and decimal precision.
- Partial and full refund calculations.
- Server-side recalculation; never trust browser-submitted totals.
- Do not assume tax, commission, or rounding rules. Read project configuration.
- If enabled, test BHD precision (3 decimal places) and PKR precision (2 decimal places).

### UI and responsive behavior
Inspect at widths around 320, 360, 375, 430, 768, 1024, 1366, and 1440 px where browser tooling is available.

Check overflow, clipping, broken grids, menus, dialogs, tables, forms, product images, spacing, typography, focus states, and mobile usability.

### Next.js implementation
- Server/client component boundaries.
- Hydration mismatch and runtime errors.
- Route handlers, server actions, loading/error/not-found states.
- Dynamic route handling.
- Cache and revalidation behavior.
- Image configuration and optimization.
- Metadata, canonical URLs, sitemap, and robots.
- Sensitive data exposed in client bundles.

### Security and authorization
- Missing authentication or authorization.
- Insecure direct object references (IDOR).
- Seller/customer/admin data isolation failures.
- Trusting client-provided price, role, stock, discount, seller ID, or order status.
- Unsafe file uploads, XSS, CSRF, open redirects, injection risks.
- Insecure payment/webhook handling.
- Secrets or personal data in logs and responses.

Do not conduct destructive or intrusive testing. Use local/staging systems and sandbox integrations only.

### Accessibility, SEO, and performance
- Semantic structure, labels, keyboard use, focus, contrast, and dialog behavior.
- Page titles, descriptions, canonical URLs, structured data, sitemap, and indexability.
- Image loading, layout shift, unnecessary client JavaScript, duplicate requests, and slow routes.
- Only report measured performance scores when a tool actually measured them.

## Verification standard

A defect is eligible for a GitHub issue only when it has enough evidence to be actionable.

For each candidate:

1. Reproduce it at least once, preferably more than once for intermittent defects.
2. Record exact route, role, environment, and steps.
3. Capture expected versus actual behavior.
4. Capture sanitized console/network/test output or screenshot when available.
5. Inspect relevant code to identify likely root cause, but distinguish confirmed cause from hypothesis.
6. Check whether the behavior is actually a documented business rule.
7. Exclude expected behavior, subjective preferences, and unsupported assumptions.

If browser automation is unavailable, perform code-level analysis and mark runtime reproduction as blocked. Do not describe an unexecuted browser test as passed.

## Phase 4 — Severity and issue categories

Assign one severity to each confirmed defect:

- `P0 Critical`: data exposure, widespread data loss, unauthorized financial action, or severe payment/order integrity failure.
- `P1 High`: core purchase journey broken, privilege boundary failure, or materially incorrect order/money calculation.
- `P2 Medium`: important feature broken with a workaround, or significant usability/accessibility problem.
- `P3 Low`: minor functional defect or non-critical usability issue.
- `P4 Cosmetic`: small visual or copy issue with no meaningful functional impact.

Classify each issue using the closest category:

- `bug`
- `ui-ux`
- `responsive`
- `accessibility`
- `security`
- `performance`
- `seo`
- `checkout`
- `payments`
- `cart`
- `catalog`
- `inventory`
- `orders`
- `seller`
- `admin`
- `api`
- `database`
- `localization`
- `testing`

These are semantic categories, not a command to create labels with these names. Map them to labels that already exist in the repository.

## Phase 5 — GitHub duplicate detection

Before creating any issue:

1. Search open and closed issues in the target repository.
2. Search using the route, error text, affected feature, and key symptoms.
3. Compare reproduction steps and expected/actual behavior.
4. Check existing pull requests if the repository tooling supports it.
5. If an issue already tracks the same defect:
   - Do not create a duplicate.
   - Add no comment unless the user explicitly asks.
   - Record the existing issue URL in the final report.
6. If an existing issue is related but materially different, create a new issue and cross-reference the related issue in the body.
7. Treat a defect as duplicate only when it is the same underlying problem, not merely the same module.

## Phase 6 — Label mapping

1. Fetch the actual repository labels.
2. Apply the closest existing labels:
   - Severity/priority label, if available.
   - Bug/type label.
   - Functional area label.
   - QA/source label, if available.
3. Use exact existing label names and colors are not to be changed.
4. Never invent a label name and assume it exists.
5. Do not create or rename labels unless the user explicitly authorizes label administration.
6. If no matching label exists, create the issue with the available labels and list the missing recommended labels in the final report.
7. Do not apply more than one conflicting priority label.

Example mapping (adapt to the repository's actual label set):

| Finding | Preferred label concepts |
|---|---|
| Critical payment failure | `bug`, `priority: critical`, `checkout` or `payments` |
| Seller can access another seller's data | `bug`, `security`, `priority: high`, `seller` |
| Mobile layout overflow | `bug`, `ui-ux`, `responsive` |
| Slow product listing | `bug`, `performance`, `catalog` |
| Missing keyboard support | `bug`, `accessibility` |
| Incorrect BHD rounding | `bug`, `checkout` or `payments`, `priority: high` |

## Phase 7 — Create actionable GitHub issues

Create one issue for each independent confirmed defect.

### Title format

`[P1][Checkout] Order total is incorrect when a coupon is applied`

Use the actual severity and functional area. Keep titles concise, specific, and searchable.

### Issue body template

Use this Markdown structure:

```markdown
## Summary
A concise description of the defect and its user/business impact.

## Severity
P0 / P1 / P2 / P3 / P4

## Affected area
- Role:
- Route/page:
- Component/API:
- Environment:

## Steps to reproduce
1.
2.
3.

## Expected result
What should happen.

## Actual result
What happens instead.

## Evidence
- Screenshot or sanitized recording:
- Console/network/test output:
- Relevant file and line references:

## Impact
Who is affected and what they cannot do or what incorrect outcome occurs.

## Suspected cause
Only include a cause supported by code inspection. Otherwise write `Not confirmed`.

## Acceptance criteria
- [ ] The defect can no longer be reproduced using the steps above.
- [ ] The expected behavior is verified.
- [ ] Relevant regression tests are added or updated.
- [ ] No related customer/seller/admin flow regresses.

## QA metadata
- Found by: Automated Marketplace QA
- Next.js version:
- Browser/device:
- Tested at:
```

Do not leave invented values or empty evidence claims. Remove fields that are genuinely unavailable and state `Not tested` where appropriate.

### Issue creation quality rules

- Use neutral, professional, developer-friendly language.
- Describe behavior, not blame.
- Keep one root defect per issue; do not combine unrelated bugs.
- Include a minimal reproduction path.
- Include exact route and relevant sanitized error details.
- Add screenshots or logs only when the integration supports attachments; otherwise describe the evidence and do not fabricate an attachment.
- Do not paste large logs, source files, secrets, or personal data.
- Avoid creating issues for every small style preference. Only report objective defects or explicitly requested improvements.

## Phase 8 — Optional code changes

This skill's default responsibility is QA and GitHub handoff, not implementation.

- Do not modify application code unless the user asks for `audit, fix, and create issues`.
- If asked to fix as well, fix only confirmed defects, run relevant tests, and create issues only for defects that remain unresolved or for follow-up work the user explicitly wants tracked.
- Never create an issue saying a defect is fixed unless the fix is verified.
- Do not commit or push unless explicitly requested.

## Phase 9 — Final report

After issue creation, return:

### QA summary
- Repository:
- Branch:
- Environment:
- Routes/features inspected:
- Roles covered:
- Checks passed / failed / blocked / not run:

### GitHub issues created
For each issue:
- Issue number and clickable URL.
- Title.
- Severity.
- Labels applied.
- Affected route/feature.

### Existing issues matched
List duplicate findings and their existing issue URLs. State that no duplicate was created.

### Findings not filed
List speculative, unverified, low-confidence, or out-of-scope findings and explain why they were not filed.

### Missing labels
List recommended labels that do not exist. Do not create them without permission.

### Blockers and next steps
List unavailable credentials, inaccessible routes, missing test data, environment limitations, or checks requiring manual verification.

Report exact counts. Separate issues created from duplicates and unfiled findings.

## Completion criteria

The task is complete only when:

- The target GitHub repository is verified.
- Relevant marketplace routes and roles have been assessed.
- Every filed issue is a confirmed, unique, actionable defect.
- Existing issues were searched to reduce duplicates.
- Existing labels were applied accurately.
- Every created issue has a returned GitHub URL/number.
- Blocked and unverified areas are clearly disclosed.
- No unauthorized code, repository, label, or production changes were made.

## Suggested user commands

- `Run marketplace QA and create GitHub issues for every confirmed unique bug.`
- `Audit customer, seller, and admin flows; deduplicate against GitHub and label issues.`
- `Run responsive and UI QA only, then create GitHub issues using existing labels.`
- `Audit checkout, currency, tax, and payment flows; create high-priority GitHub issues for confirmed defects.`
- `Audit, fix safe defects, and create GitHub issues for anything unresolved.`
