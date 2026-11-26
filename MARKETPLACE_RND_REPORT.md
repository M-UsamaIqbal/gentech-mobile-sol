# GenTech Marketplace — Business R&D and Multi-Region Readiness Report

## 1. Executive overview

- Repository: `Abubakarstu/gentech`
- Local path: `D:\Shomlie Future Updates\TestProject\gentech`
- Branch/commit inspected: `feat/sf3d-webgpu-generation` @ `25f74a9`
- Marketplace model inferred: mobile-first classifieds marketplace for BH and PK with inspection, dealer storefronts, promotions and trust signals.
- Configured markets: Bahrain (`bh`) and Pakistan (`pk`); locales `en`, `ar`, `ur`; currencies BHD and PKR.
- Main strengths: locale routing, BHD precision, cart/order isolation, inspections, search, and a broad Prisma schema.
- Highest-value gaps: payment verification boundary, authoritative checkout totals, PKR precision, seller/region enforcement, and missing finance/ops records.
- Key unknowns: live provider behaviour, deployed DB data, BH/PK tax and privacy rules, browser RTL verification.

## 2. Existing capability map

| Domain | Status | Evidence | Business impact |
|---|---|---|---|
| Storefront/search | Ready | `features/listings/repositories/listing.repository.ts:374-385`, `app/api/v1/search/*` | Core discovery works; compare regressions already tracked. |
| Cart/checkout | Partial | `features/cart/services/cart.service.ts:84-110`, `app/api/checkout/calculate/route.ts:5-21` | Totals/address gaps threaten conversion and trust. |
| Orders/fulfilment | Partial | `features/orders/services/order-status.service.ts:31-41`, `app/admin/shipments/page.tsx:22-31` | Role mismatch and no shipment model. |
| Payments | Partial | `features/payments/services/payment.service.ts:138-219`, `features/payments/providers/index.ts:17-20` | Sandbox-only, unsafe callback boundary, no orchestration. |
| Seller/admin | Partial | `features/listings/actions/create-listing.ts:20-41`, `features/admin/lib/require-admin.ts:6-15` | Eligibility not enforced; RBAC coarse. |
| Inspections/trust | Ready code / Unverified runtime | `features/inspections/actions/*`, `features/phone-intelligence/providers/index.ts:18-33` | Workflow complete; real providers pending. |
| Regional support | Partial | `lib/countries/index.ts:18-27`, `lib/currency.ts:21-24`, `middleware.ts:20-40` | BHD ready; PKR precision and tax fields missing. |
| Ops/observability | Missing | `lib/monitoring.ts:56-87`, `app/api/webhooks/route.ts:30-96`, `.github/workflows/ci.yml:44-51` | Silent failures, no scheduler, CI lacks tests. |

## 3. Multi-region readiness scorecard

| Domain | BH | PK | Evidence / decision |
|---|---|---|---|
| Region config | Partial | Ready | `lib/countries/index.ts:18-27`; GeoIP fallback uses plain HTTP (`lib/countries/detect.ts:36-54`). |
| Locale routing | Ready | Ready | `middleware.ts:20-40,187-217`; runtime deployment still #43. |
| RTL | Ready / visual Unverified | Ready / visual Unverified | `app/layout.tsx:69-75`, `components/direction-setter.tsx:5-9`. |
| Translations | Partial | Partial | Key parity exists; checkout/order strings hardcoded. |
| Currency | Ready for BHD | Missing for 2-dp PKR | `lib/currency.ts:21-24`; `1000.57 -> Rs 1,001`. See issue #79. |
| Exchange/conversion | Missing by design | Missing by design | Admin reports currencies separately; business decision required. |
| Tax/invoicing | Partial | Partial | Empty BH `vatNumber`, placeholder PK tax; see #92. |
| Address/shipping | Partial / data Unverified | Partial / data Unverified | Empty address posted; no code seed for shipping rows; see #81 and #95. |
| Payments | Missing real / Partial sandbox | Partial metadata / Missing real | Provider registry sandbox-only; see #82, #39-#41. |
| Catalog | Ready | Ready | Region-scoped listing filters and seeds. |
| Seller eligibility | Partial | Partial | Authentication only at listing creation; see #80. |
| Privacy/compliance | Missing | Missing | Policy strings not reachable; see #91. |

## 4. Opportunity portfolio

| GitHub | Recommendation | Priority | Effort | Confidence | Success metric |
|---|---|---|---|---|---|
| [#72](https://github.com/usamawta-tech/gentech/issues/72) | [P0][Payments][Bug] Require signed, amount-checked verification and isolate read-only return callbacks | P0 | M | High | No unauthenticated or unsigned callback can change payment/order state; all state changes carry provider event evidence. |
| [#73](https://github.com/usamawta-tech/gentech/issues/73) | [P1][Checkout][Bug] Make checkout totals authoritative and persist the quoted discount | P1 | M | High | Displayed total, persisted order total and charged amount are identical in BH/PK regression tests. |
| [#74](https://github.com/usamawta-tech/gentech/issues/74) | [P1][Inventory][Feature] Enforce atomic listing availability and cart quantity limits | P1 | M | High | No order can exceed available stock or sell an already sold unique listing under concurrent checkout. |
| [#75](https://github.com/usamawta-tech/gentech/issues/75) | [P1][Payments][Bug] Bind payment initiation to the authenticated order owner | P1 | S | High | No authenticated user can initiate or redirect payment for another customer order. |
| [#76](https://github.com/usamawta-tech/gentech/issues/76) | [P1][Payments][Improvement] Make payment initiation and webhook processing retry-safe | P1 | M | High | Duplicate initiation or webhook retries produce one payment, one state transition and a usable redirect. |
| [#77](https://github.com/usamawta-tech/gentech/issues/77) | [P1][Orders][Bug] Use real order roles and gate fulfilment on paid state | P1 | M | High | Seller, customer and admin transitions behave correctly and fulfilment cannot start before payment. |
| [#78](https://github.com/usamawta-tech/gentech/issues/78) | [P1][Payments][Feature] Add provider-backed partial refunds with cumulative state | P1 | L | High | Refund amounts reconcile with provider records and orders reflect FULL/PARTIAL/NONE refund state. |
| [#79](https://github.com/usamawta-tech/gentech/issues/79) | [P1][Multi-region][Bug] Restore PKR 2-decimal precision across pricing and notifications | P1 | M | High | PKR 1000.57 formats as Rs 1,000.57 and all order/payment/notification totals retain 2 decimals. |
| [#80](https://github.com/usamawta-tech/gentech/issues/80) | [P1][Seller][Bug] Enforce seller approval and route region before listing creation | P1 | M | High | Unapproved sellers cannot list and BH/PK routes create listings in the matching country. |
| [#81](https://github.com/usamawta-tech/gentech/issues/81) | [P1][Checkout][Bug] Capture a validated, zone-aware delivery address | P1 | M | High | Orders cannot be created without a validated address and COD is rejected outside eligible zones. |
| [#82](https://github.com/usamawta-tech/gentech/issues/82) | [P1][Payments][Bug] Align payment configuration with executable providers and wire checkout initiation | P1 | M | High | Every method shown at checkout has an executable provider and checkout actually starts payment. |
| [#83](https://github.com/usamawta-tech/gentech/issues/83) | [P2][Finance][Feature] Record provider settlements, fees, FX and seller payouts | P2 | L | High | Net receipts, fees, FX and payouts are traceable to provider settlements and exception-free after sign-off. |
| [#84](https://github.com/usamawta-tech/gentech/issues/84) | [P2][Orders][Feature] Support per-seller fulfilments and split shipment tracking | P2 | L | High | Each seller can fulfil and track only their items, with independent shipment status. |
| [#85](https://github.com/usamawta-tech/gentech/issues/85) | [P2][Payments][Improvement] Add failed-payment retry and stale-payment reconciler | P2 | M | High | Stale PENDING/PROCESSING payments are reconciled automatically and customers get a working retry path. |
| [#86](https://github.com/usamawta-tech/gentech/issues/86) | [P2][Integrations][Feature] Turn generic /api/webhooks into a signed, durable event pipeline | P2 | L | High | Webhook events are verified, persisted, processed idempotently, retryable and monitored. |
| [#87](https://github.com/usamawta-tech/gentech/issues/87) | [P2][Admin][Feature] Replace single-role admin gate with data-driven permissions | P2 | L | High | Every admin action is authorised by Role x Module x Action rules, including dealer permissions. |
| [#88](https://github.com/usamawta-tech/gentech/issues/88) | [P2][Audit][Bug] Make audit writes failure-safe and cover financial and privilege changes | P2 | M | High | All financially and privilege-sensitive mutations produce durable, authorised audit records or fail the transaction. |
| [#89](https://github.com/usamawta-tech/gentech/issues/89) | [P2][Observability][Feature] Connect structured error logging to an external sink with alerting | P2 | M | High | Production errors reach an external sink with correlation id and trigger defined alerts. |
| [#90](https://github.com/usamawta-tech/gentech/issues/90) | [P2][Operations][Feature] Add a scheduled job runner with run history and retries | P2 | L | High | Maintenance jobs run on schedule with recorded outcomes, retries and alerts. |
| [#91](https://github.com/usamawta-tech/gentech/issues/91) | [P2][Privacy][Research] Validate and implement consent, export, erasure and retention workflows | P2 | L | Medium | Approved policy is reflected in reachable pages, consent records and automated retention jobs. |
| [#92](https://github.com/usamawta-tech/gentech/issues/92) | [P2][Multi-region][Research] Validate and model region-specific tax identity and invoice fields | P2 | M | Medium | Approved BH/PK tax identity and invoice requirements are represented in the order/invoice model. |
| [#93](https://github.com/usamawta-tech/gentech/issues/93) | [P2][Localization][Improvement] Translate checkout and order-status UI strings | P2 | M | High | Checkout and order pages render fully in en/ar/ur with correct direction and no hardcoded English. |
| [#94](https://github.com/usamawta-tech/gentech/issues/94) | [P2][Multi-region][Bug] Remove hardcoded PKR defaults outside the known Bahrain CTA | P2 | M | High | No Bahrain surface displays PKR except where a tracked defect explicitly allows it. |
| [#95](https://github.com/usamawta-tech/gentech/issues/95) | [P2][Shipping][Research] Verify or seed region shipping methods and zones | P2 | S | Medium | Both markets return at least one valid shipping method and zone in deployed environments. |
| [#96](https://github.com/usamawta-tech/gentech/issues/96) | [P2][Quality][Improvement] Run unit tests in CI and replace placeholder integration suites | P2 | M | High | CI blocks merge on lint, typecheck, build and tests; no placeholder assertions remain. |
| [#97](https://github.com/usamawta-tech/gentech/issues/97) | [P2][Authentication][Research] Harden or retire the simulated OTP subsystem before production use | P2 | M | Medium | No production path can use in-memory OTP, Math.random codes, console-logged codes or unthrottled verification. |

## 5. GitHub issues created

All issues are local Markdown files under `R&D Issues\` and published at https://github.com/Abubakarstu/gentech/issues

| GitHub | Title | Labels | Priority / stage | Market |
|---|---|---|---|---|
| [#72](https://github.com/usamawta-tech/gentech/issues/72) | [P0][Payments][Bug] Require signed, amount-checked verification and isolate read-only return callbacks | bug, security, payments, validation | P0 / Ready for development | BH + PK (general) |
| [#73](https://github.com/usamawta-tech/gentech/issues/73) | [P1][Checkout][Bug] Make checkout totals authoritative and persist the quoted discount | bug, finance, currency, validation | P1 / Ready for development | BH + PK (general) |
| [#74](https://github.com/usamawta-tech/gentech/issues/74) | [P1][Inventory][Feature] Enforce atomic listing availability and cart quantity limits | enhancement, data-quality | P1 / Ready for development | BH + PK (general) |
| [#75](https://github.com/usamawta-tech/gentech/issues/75) | [P1][Payments][Bug] Bind payment initiation to the authenticated order owner | bug, security, payments, validation | P1 / Ready for development | BH + PK (general) |
| [#76](https://github.com/usamawta-tech/gentech/issues/76) | [P1][Payments][Improvement] Make payment initiation and webhook processing retry-safe | enhancement, payments, integration, data-quality | P1 / Ready for development | BH + PK (general) |
| [#77](https://github.com/usamawta-tech/gentech/issues/77) | [P1][Orders][Bug] Use real order roles and gate fulfilment on paid state | bug, data-quality, validation | P1 / Ready for development | BH + PK (general) |
| [#78](https://github.com/usamawta-tech/gentech/issues/78) | [P1][Payments][Feature] Add provider-backed partial refunds with cumulative state | enhancement, payments, finance | P1 / Ready for development | BH + PK (general) |
| [#79](https://github.com/usamawta-tech/gentech/issues/79) | [P1][Multi-region][Bug] Restore PKR 2-decimal precision across pricing and notifications | bug, currency, pakistan-market, qa | P1 / Ready for development | PK |
| [#80](https://github.com/usamawta-tech/gentech/issues/80) | [P1][Seller][Bug] Enforce seller approval and route region before listing creation | bug, validation, pakistan-market, bahrain-market | P1 / Ready for development | BH + PK |
| [#81](https://github.com/usamawta-tech/gentech/issues/81) | [P1][Checkout][Bug] Capture a validated, zone-aware delivery address | bug, validation, delivery, pakistan-market, bahrain-market | P1 / Ready for development | BH + PK |
| [#82](https://github.com/usamawta-tech/gentech/issues/82) | [P1][Payments][Bug] Align payment configuration with executable providers and wire checkout initiation | bug, integration, payments, ux | P1 / Ready for development | BH + PK (general) |
| [#83](https://github.com/usamawta-tech/gentech/issues/83) | [P2][Finance][Feature] Record provider settlements, fees, FX and seller payouts | enhancement, finance, payments, reconciliation | P2 / Needs business validation | BH + PK (general) |
| [#84](https://github.com/usamawta-tech/gentech/issues/84) | [P2][Orders][Feature] Support per-seller fulfilments and split shipment tracking | enhancement, delivery, ux | P2 / Ready for development | BH + PK (general) |
| [#85](https://github.com/usamawta-tech/gentech/issues/85) | [P2][Payments][Improvement] Add failed-payment retry and stale-payment reconciler | enhancement, payments, devops | P2 / Ready for development | BH + PK (general) |
| [#86](https://github.com/usamawta-tech/gentech/issues/86) | [P2][Integrations][Feature] Turn generic /api/webhooks into a signed, durable event pipeline | enhancement, integration, security, devops | P2 / Ready for development | BH + PK (general) |
| [#87](https://github.com/usamawta-tech/gentech/issues/87) | [P2][Admin][Feature] Replace single-role admin gate with data-driven permissions | enhancement, security, ux | P2 / Needs business validation | BH + PK (general) |
| [#88](https://github.com/usamawta-tech/gentech/issues/88) | [P2][Audit][Bug] Make audit writes failure-safe and cover financial and privilege changes | bug, security, finance, data-quality | P2 / Ready for development | BH + PK (general) |
| [#89](https://github.com/usamawta-tech/gentech/issues/89) | [P2][Observability][Feature] Connect structured error logging to an external sink with alerting | enhancement, devops, integration | P2 / Ready for development | BH + PK (general) |
| [#90](https://github.com/usamawta-tech/gentech/issues/90) | [P2][Operations][Feature] Add a scheduled job runner with run history and retries | enhancement, devops, integration | P2 / Ready for development | BH + PK (general) |
| [#91](https://github.com/usamawta-tech/gentech/issues/91) | [P2][Privacy][Research] Validate and implement consent, export, erasure and retention workflows | investigation, legal, pakistan-market, bahrain-market | P2 / Research required | BH + PK |
| [#92](https://github.com/usamawta-tech/gentech/issues/92) | [P2][Multi-region][Research] Validate and model region-specific tax identity and invoice fields | investigation, finance, vat, sales-tax, pakistan-market, bahrain-market | P2 / Research required | BH + PK |
| [#93](https://github.com/usamawta-tech/gentech/issues/93) | [P2][Localization][Improvement] Translate checkout and order-status UI strings | enhancement, localization, pakistan-market, bahrain-market | P2 / Ready for development | BH + PK |
| [#94](https://github.com/usamawta-tech/gentech/issues/94) | [P2][Multi-region][Bug] Remove hardcoded PKR defaults outside the known Bahrain CTA | bug, currency, pakistan-market | P2 / Ready for development | PK |
| [#95](https://github.com/usamawta-tech/gentech/issues/95) | [P2][Shipping][Research] Verify or seed region shipping methods and zones | investigation, delivery, devops, pakistan-market, bahrain-market | P2 / Research required | BH + PK |
| [#96](https://github.com/usamawta-tech/gentech/issues/96) | [P2][Quality][Improvement] Run unit tests in CI and replace placeholder integration suites | enhancement, test, devops | P2 / Ready for development | BH + PK (general) |
| [#97](https://github.com/usamawta-tech/gentech/issues/97) | [P2][Authentication][Research] Harden or retire the simulated OTP subsystem before production use | investigation, security, devops | P2 / Research required | BH + PK (general) |

### Additional task and feature issues (#98–#102)

Filed after dedupe from the five previously unfiled recommendations. Labels `task` and `feature` were created in the repository for work-type filtering.

| GitHub | Title | Labels |
|---|---|---|
| [#98](https://github.com/usamawta-tech/gentech/issues/98) | [Task][P1][Seller] Wire verification form to upload API and JSON submit contract | task, bug, security, validation, bahrain-market, pakistan-market |
| [#99](https://github.com/usamawta-tech/gentech/issues/99) | [Feature][P2][Trust] Add buyer-facing review creation for completed listings | feature, enhancement, ux, bahrain-market, pakistan-market |
| [#100](https://github.com/usamawta-tech/gentech/issues/100) | [Task][P1][Promotions] Add /dashboard/promotions/new route | task, enhancement, ux, payments |
| [#101](https://github.com/usamawta-tech/gentech/issues/101) | [Task][P2][Bahrain] Make WhatsApp number normalization region-aware | task, bug, localization, bahrain-market |
| [#102](https://github.com/usamawta-tech/gentech/issues/102) | [Feature][P2][Admin] Replace static readiness panels with evidence-backed launch-gate register | feature, enhancement, devops, security, documentation |

## 6. Existing issues reused / not duplicated

- #31 Bahrain CTA PKR price; #94 removes other PKR defaults but explicitly excludes #31.
- #36 ledger/invoice generation; #83 supplies settlement source data and #92 supplies tax identity fields.
- #39-#41 live provider enablement; #82 covers orchestration/config only.
- #42 private dealer documents; #80 uses existing seller eligibility rules and does not redesign storage.
- #47 unsigned POST callback; #72 covers the wider verification boundary and supersedes it for implementation.
- #48/#49 FCM endpoints; #88-#90 cover audit, logging, and job infrastructure, not token persistence.
- #50-#71 Access report audit; no Access-report work was re-filed.

## 7. Needs validation

- BH VAT categories, zero-rating/exemptions, TRN and invoice content (#92, #68).
- Pakistan federal/provincial tax treatment and required identifiers (#92, #64).
- Deployed shipping methods/zones and COD policy (#95, #81).
- Live provider credentials, callback semantics and refund capability (#39-#41, #72, #78, #85).
- BH/PK privacy, consent, retention and cross-border transfer obligations (#91).
- Visual RTL rendering and browser checkout flow (#69, #93, #43).
- Role matrix for delegated finance/support/content/admin permissions (#87).

## 8. Roadmap dependencies

- Protect: #47, #48, #72, #75, #86, #88.
- Foundation: #13, #31, #36, #37, #79, #87, #89, #90, #91, #92, #96, #97.
- Core marketplace: #73, #74, #76, #77, #78, #81, #82, #84, #85.
- Regional expansion: #39-#41, #80, #83, #93, #94, #95.
- Growth: #99 user review creation and #100 promotion creation route filed; promotion completion remains paused pending product decision and #39.
- Optimization: #44, #46, #93, #96.

## 9. Coverage and limitations

- Four read-only agents inspected architecture/capabilities, payments/finance, multi-region readiness, and ops/quality.
- Evidence is code-level at commit `25f74a9`; no browser, database, provider credentials or live runtime checks were performed.
- No external market research was performed; regulatory/provider facts are marked Research required or Needs business validation.
- Pre-existing working-tree changes (`AGENTS.md`, `docs/PROGRESS_CHECKLIST.md`, untracked skill files) were left untouched.
- Existing labels were used for #72–#97; `task` and `feature` were created for #98–#102 work-type filtering.
- Previously unfiled recommendations are now #98–#102: seller-verification form/upload mismatch, review creation, promotions route, BH WhatsApp normalization, and launch-gate register.

Counts: opportunities discovered 31; issues created/published 31; existing issues matched 12+; recommendations not filed 0; items needing validation 8.
