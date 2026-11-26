# GenTech Marketplace — Progress Checklist

Last updated: 2026-11-25

Sources: local Git state, `docs/PROJECT_STATUS.md`, `docs/PROJECT_ROADMAP.md`, and GitHub issue #13.

## Repository state

- [x] Advanced product viewing and optional 3D committed as `538e11c`.
- [x] Browser-side SF3D generation committed as `ca651cd`.
- [x] New branch `feat/sf3d-webgpu-generation` created from `main` and pushed.
- [x] `main` fast-forwarded to `ca651cd` (`ca651cda5a472ac21c3c1095788403f15bbea7e9`).
- [x] Working tree clean after the push.
- [x] GitHub Issues enabled in `Abubakarstu/gentech`.
- [x] GitHub issue #13 created: [Clear legal gate before enabling browser-side SF3D generation](https://github.com/usamawta-tech/gentech/issues/13).

## Completed local work

- [x] Seller "Generate 3D" flow added to create-listing and post-publication management.
- [x] WebGPU capability check and explicit seller licence acceptance gate added.
- [x] SF3D producer vendored under `public/sf3d/`; weights remain external, unpinned in source.
- [x] Browser-only inference: no image, prompt, or tensor sent to GenTech or an AI API.
- [x] Finished GLB uploaded through the existing authenticated Cloudinary raw path under `models/${user.id}`.
- [x] `ListingModel` provenance/status fields added by `20261125130000_add_listing_model_generation_provenance`.
- [x] Buyer-facing "AI-generated 3D model" label and approximation notice added in EN/AR/UR.
- [x] Root GLB URL-resolver bug fixed in `lib/model-assets.ts`; unauthorized GLTF asset references remain blocked.
- [x] Localhost buyer 3D flow verified with a temporary GLB fixture: `photos,3d` modes, live R3F canvas, no fallback, rotation/reset/fullscreen controls.
- [x] Temporary fixture, helper scripts, and local DB row removed; `ListingModel` count back to `0`.

## Verification baseline

- [x] `pnpm typecheck` — 0 errors.
- [x] `pnpm test` — 446/446 across 69 files.
- [x] `pnpm lint` — 0 errors, 46 pre-existing non-blocking warnings.
- [x] `pnpm build` — passed, 259 pages generated.
- [x] `npx prisma migrate status` — up to date; no destructive migration run.
- [x] `git diff --check` — no whitespace errors.

## Milestone status

- [x] **M1-F01–M1-F06** — core catalog, approval workflow, taxonomy, and admin analytics verified.
- [x] **M2-F01–M2-F03** — dealer registration, verification queue, branches, and inventory verified.
- [x] **M3-F01** — promotion package management verified.
- [x] **M3-F02** — PayFast inspection payment code verified; live/promotion payments remain paused pending merchant verification.
- [ ] **M3-F03** — automated transaction ledger and invoice generation is not implemented; tracked in issue #36.
- [x] **M4-F01–M4-F03** — filters, messaging, favorites, and saved-search alerts verified.
- [x] **M5-F01, M5-F03, M5-F04** — valuation, spec comparison, and inspection reports verified.
- [ ] **M5-F02** — PTA/CPID simulator and provider abstraction verified; real PTA DIRBS/CPID adapter pending provider credentials.

## Active blockers and next actions

- [ ] Close GitHub issue #13: obtain legal clearance for the SF3D runtime, inference kit, and Stability AI weights; record the outcome in ADR-019 and `docs/SF3D_WEBGPU.md`.
- [ ] If cleared, configure `NEXT_PUBLIC_SF3D_ENABLED`, `NEXT_PUBLIC_SF3D_WEIGHTS_URL`, `NEXT_PUBLIC_SF3D_WEIGHTS_BYTES`, and `NEXT_PUBLIC_SF3D_WEIGHTS_ETAG` in deployment.
- [ ] Run `npx prisma migrate deploy` in each target environment before enabling generation.
- [ ] Verify the seller Generate 3D flow in a WebGPU-capable browser with the pinned weights.
- [ ] If not cleared, disable or remove the generation path while keeping manual GLB/GLTF upload intact.
- [ ] Verify real payment providers (BenefitPay, JazzCash, Easypaisa) with merchant credentials and sandbox tests.
- [ ] Integrate a real PTA DIRBS/CPID adapter for M5-F02.
- [ ] Recheck `/bh/ar` after the next Vercel deployment; the earlier 404 preceded the Prisma build-generation fix.

## Notes

- Generated 3D is explicitly labelled as an approximation; it is not a measured 3D scan.
- Manual seller GLB/GLTF upload remains fully supported when WebGPU or generation is unavailable.
- Honest photo tiers stay `1`, `2–3`, `4–11`, `12–23`, `24–36`; rotation only at `12+`, and `360°` only at `24+`.

## QA finding issues

Closed archive issues — already fixed and verified:

- [#22](https://github.com/usamawta-tech/gentech/issues/22) — Compare preview listing IDs dropped from selection.
- [#23](https://github.com/usamawta-tech/gentech/issues/23) — Compare checkbox hit target was intercepted.
- [#24](https://github.com/usamawta-tech/gentech/issues/24) — Compare selected IDs lost when catalog lookup failed.
- [#25](https://github.com/usamawta-tech/gentech/issues/25) — Removing one of two compare listings cleared the remaining product.
- [#26](https://github.com/usamawta-tech/gentech/issues/26) — Compare metadata had placeholder and duplicated suffix.
- [#27](https://github.com/usamawta-tech/gentech/issues/27) — Compare spec table had blank cells.
- [#28](https://github.com/usamawta-tech/gentech/issues/28) — Compare browser bundle imported Prisma currency helper.

Open tracking issues — still actionable:

- [#29](https://github.com/usamawta-tech/gentech/issues/29) — Admin subpage navigation can stay on loading skeleton.
- [#30](https://github.com/usamawta-tech/gentech/issues/30) — Image upload signing returned 503 without Cloudinary credentials.
- [#31](https://github.com/usamawta-tech/gentech/issues/31) — Bahrain inspection CTA shows PKR price.
- [#32](https://github.com/usamawta-tech/gentech/issues/32) — City and area labels are not localized.
- [#33](https://github.com/usamawta-tech/gentech/issues/33) — Orphaned countries detect helper remains as legacy code.
- [#34](https://github.com/usamawta-tech/gentech/issues/34) — Live Vercel smoke check is manual.
- [#35](https://github.com/usamawta-tech/gentech/issues/35) — Local DB unavailable triggers demo-data fallback.

## Audit-created delivery backlog

New issues created from the full audit. Every issue has labels so a fellow developer can filter by work type:

- [#36](https://github.com/usamawta-tech/gentech/issues/36) — `enhancement, blocked, help wanted` — M3-F03 transaction ledger and invoice generation.
- [#37](https://github.com/usamawta-tech/gentech/issues/37) — `bug, devops, test` — health endpoint uses placeholder DB/Cloudinary checks.
- [#38](https://github.com/usamawta-tech/gentech/issues/38) — `enhancement, integration, blocked` — real PTA DIRBS/CPID adapter for M5-F02.
- [#39](https://github.com/usamawta-tech/gentech/issues/39) — `security, devops, blocked` — live PayFast verification and enablement.
- [#40](https://github.com/usamawta-tech/gentech/issues/40) — `enhancement, integration, blocked` — BenefitPay for Bahrain checkout.
- [#41](https://github.com/usamawta-tech/gentech/issues/41) — `enhancement, integration, blocked` — JazzCash and Easypaisa for Pakistan checkout.
- [#42](https://github.com/usamawta-tech/gentech/issues/42) — `security, enhancement, blocked` — private dealer document storage and upload flow.
- [#43](https://github.com/usamawta-tech/gentech/issues/43) — `bug, localization, qa` — recheck `/bh/ar` and localized child routes after deployment.
- [#44](https://github.com/usamawta-tech/gentech/issues/44) — `refactor, good first issue` — reduce remaining ESLint warnings to zero.
- [#45](https://github.com/usamawta-tech/gentech/issues/45) — `enhancement, blocked` — investigate SF3D fixed 512px image-size limitation.
- [#46](https://github.com/usamawta-tech/gentech/issues/46) — `test, good first issue` — regression coverage for the previous-comparison history branch.

## Marketplace QA audit — 2026-11-25

Created after installing `autonomous-marketplace-qa-github-issues` into `.agent/skills/` and `.agents/skills/`. Findings are code-confirmed at commit `25f74a9`; browser and runtime reproduction were blocked (browser automation disconnected, no local database or FCM credentials).

- [#47](https://github.com/usamawta-tech/gentech/issues/47) — `bug, security`, P0 — unsigned `POST /api/payments/callback` can mark any payment and order as paid.
- [#48](https://github.com/usamawta-tech/gentech/issues/48) — `security, bug`, P1 — unauthenticated `GET /api/fcm/register` relays arbitrary push notifications.
- [#49](https://github.com/usamawta-tech/gentech/issues/49) — `bug`, P2 — `POST /api/fcm/register` reports success but discards the token.

Not filed: `POST /api/webhooks` is a documented placeholder that only logs events; the in-memory OTP store needs serverless runtime verification before it can be called a defect.

## Autonomous software-house orchestrator — 2026-11-25

Installed `autonomous-software-house-orchestrator` in `.agent/skills/` and `.agents/skills/`, registered it in `AGENTS.md`, and applied QA, business R&D, project management, architecture, security, DevOps, board, and investor methods to the existing evidence. Full report: [docs/SOFTWARE_HOUSE_REPORT.md](./SOFTWARE_HOUSE_REPORT.md).

- [x] No duplicate GitHub issue created — findings mapped to #13, #36–#49, or #50–#97; the five previously unfiled recommendations became #98–#102.
- [x] #47 is the narrower QA finding; #72 covers the full payment-verification boundary. Both stay traceable.
- [x] Board and investor reviews remained evidence-only: no minutes, resolutions, investor asks, metrics, or confidential material were published.
- [x] `MARKETPLACE_RND_REPORT.md` issue references reconciled to real issue numbers, not archived PR numbers.

## Published backlog index

- #47–#49 — code-confirmed QA findings: payment callback, FCM relay, discarded FCM token.
- #50–#71 — Access report audit findings created from the repository owner's report inventory: broken references, hard-coded tax/rounding, settlement gaps, localization and delivery gaps.
- #72–#97 — business R&D backlog: payment integrity, checkout totals, inventory atomicity, order roles, refunds, PKR precision, seller/region rules, delivery address, provider config, settlements, observability, RBAC, audit, privacy, tax identity, localization, shipping, CI tests, and OTP hardening.
- #98–#102 — task/feature issues from previously unfiled R&D recommendations: seller-verification form/upload wiring, buyer review creation, promotions creation route, Bahrain WhatsApp normalization, and admin launch-gate register.
- Local issue index for #72–#102 is in [R&D Issues](../R%26D%20Issues/README.md).

## Payment verification hardening — 2026-11-25

- [x] `GET /api/payments/callback` no longer calls `verifyPayment`; browser returns are read-only.
- [x] `POST /api/payments/callback` validates payload shape with Zod, requires a provider signature and fresh timestamp, and rejects sandbox webhooks.
- [x] Payment initiation issues a signed, 15-minute HMAC return token binding payment id, order id and provider reference; the sandbox return accepts only that token.
- [x] `verifyPayment` rejects provider-reference mismatches and provider amount/currency that differs from the stored payment at BHD 3-fils / PKR 2-decimal precision.
- [x] Payment state changes use conditional atomic transitions, preventing duplicate callbacks from overwriting state.
- [x] Verified with 458/458 tests, 0 TypeScript errors, 0 ESLint errors, and a successful 259-page production build.

## Issue hygiene

- Issue #14 was closed as completed after confirming `main` contains the progress checklist and one-by-one status list.
- Labels applied to earlier issues: #13 `legal, blocked`; #15–#21 `documentation`; #22–#28 `bug, qa`; #29 `bug, qa`; #30 `bug, devops`; #31 `bug, localization, qa`; #32 `enhancement, localization`; #33 `refactor, good first issue`; #34 `devops, test`; #35 `documentation, devops`.
- Available repository labels now include `bug`, `documentation`, `enhancement`, `good first issue`, `help wanted`, `security`, `devops`, `test`, `refactor`, `localization`, `integration`, `legal`, `blocked`, `qa`, `task`, and `feature`.
