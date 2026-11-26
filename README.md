# GenTech Marketplace

A production-grade, mobile-first marketplace platform. Generic by design — the first
vertical is **mobile phones (Pakistan)**.

**Stack:** Next.js 16 (App Router, React 19) · TypeScript (strict) · Tailwind v4 ·
shadcn/ui (Base UI) · Framer Motion · Prisma 7 + Neon PostgreSQL · Better Auth ·
Cloudinary · Google Maps · FCM (later phases).

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the layering and conventions.
Browser-side image-to-3D generation is documented in [`docs/SF3D_WEBGPU.md`](./docs/SF3D_WEBGPU.md); it is disabled unless explicitly configured and legally cleared.

---

## Repository migration — old repo → final repo

The latest code from the old repository was **merged, not copied**, into this final team
repository so both histories remain intact. Old-repo `main` is an ancestor of the merged
source tip, so all old remote `main` commits are contained in final `main`.

| Item | Commit / reference |
| --- | --- |
| Old repo remote | `https://github.com/Abubakarstu/gentech.git` |
| Old repo remote `main` | `d635514ce65a2625a0b7d894d49925313d9e8f4c` |
| Old repo merged source tip | `b35b1ddf06184a9fe8d8f00bf3755f74f4a96097` (`feat/sf3d-webgpu-generation`) |
| Final repo remote | `https://github.com/Abubakarstu/gentech-mobile-sol.git` |
| Final repo base before merge | `ac5a78066ceaab84f4c31f11987274ae0e55a49f` |
| Final repo merge commit | `a2a4bd4ea1c9b45037f0defb1ef968037f03a701` |
| Pre-merge backup branch | `backup/pre-source-port` |

### What changed during the migration

- Source-side changes: 507 files added, 144 modified, 2 deleted; final-side changes: 47 added, 12 modified.
- Final team features preserved: **Sell Your Phone AI quotes**, **phone OTP verification**, **verify-email**, **local uploads**, quote pricing/admin screens, and **Cloudflare/wrangler** configuration.
- Source features ported: localized BH/PK commerce, checkout and payments, orders, dealer workspace, promotions, favorites, compare, saved searches, phone intelligence/history, product viewer, and gated SF3D/WebGPU generation.
- Conflict resolution kept the source baseline while restoring final verify-email files and re-adding final routes, constants, env vars, admin navigation and quote/OTP schema additions.
- The quote price-book model was renamed to `QuotePriceBook` / `quote_price_book` to avoid colliding with the source `PhoneModel`.
- The superseded final initial migration `20261009143143` was removed from the deploy set; idempotent migration `20261126110000_align_report_reason_enum` converges `report.reason` to the canonical enum.
- The accidental source artifact `t --state all` was intentionally not ported.
- Verification: `prisma validate` passed; `pnpm typecheck` 0 errors; `pnpm test` 458/458 across 70 files; `pnpm lint` 0 errors / 46 pre-existing warnings; `SKIP_ENV_VALIDATION=1 next build` exit 0; no duplicate `CREATE TABLE`/`CREATE TYPE` remains across migrations.

### Key commit history

| Commit | Meaning |
| --- | --- |
| `02802df` | Initial final-repo marketplace baseline |
| `311a845` | Phone inspection service added in the final repo |
| `031da8b` | Phone OTP verification added in the final repo |
| `ac5a780` | Sell Your Phone AI quote feature added in the final repo |
| `d635514` | Old repo remote `main` point included by the port |
| `538e11c` | Advanced product viewing and optional 3D models |
| `ca651cd` | Gated browser-side SF3D generation |
| `e873d7b` | Payment callback verification hardening |
| `b35b1dd` | Final old-repo source tip |
| `a2a4bd4` | Merge commit on final `main` containing both histories |

---

## Features, tasks, and issues

The full evidence-based detail lives in [`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md),
[`docs/PROGRESS_CHECKLIST.md`](./docs/PROGRESS_CHECKLIST.md),
[`docs/PROJECT_ROADMAP.md`](./docs/PROJECT_ROADMAP.md), and
[`docs/DECISIONS.md`](./docs/DECISIONS.md). Canonical upstream issues are recorded in the
`usamawta-tech/gentech` tracker; the port did not create duplicate GitHub issues.
The full tracker has been mirrored to
[`M-UsamaIqbal/gentech-mobile-sol`](https://github.com/M-UsamaIqbal/gentech-mobile-sol/issues):
90 issues with labels and source links preserved, of which 74 are open and 16 are closed,
matching the old tracker exactly.

| Area | State |
| --- | --- |
| Core marketplace, catalog, filters, favorites, saved searches, messaging | Implemented and verified (M1/M4 milestones) |
| Dealer registration, review queue, branches, inventory | Implemented and verified (M2 milestone) |
| Multi-country/multi-language BH/PK, BHD 3-fils vs PKR 2-decimal isolation | Implemented and verified |
| Mobile-first app shell, splash, bottom navigation, adaptive layout | Implemented and verified |
| Photo-sequence viewer and optional real GLB/GLTF model display | Implemented and verified |
| Seller Generate 3D (browser-only SF3D/WebGPU) | Code present but **disabled** pending legal clearance; canonical issue #13 |
| Phone inspection service, PTA/IMEI helpers, inspection reports | Implemented; real PTA DIRBS/CPID adapter still blocked (#38) |
| Phone OTP/WhatsApp/SMS verification for inspection booking | Implemented with DEV fallback; Twilio credentials optional |
| Sell Your Phone instant quote, AI grading, admin price book/deductions/pricing | Implemented; Anthropic vision key optional with DEV grader fallback |
| Payment callback hardening and signed return tokens | Implemented; canonical #47 closed, #72 remains open |
| Transaction ledger/invoice generation (#36), live PayFast/BenefitPay/JazzCash/Easypaisa (#39–#41), private dealer documents (#42) | Blocked on approvals, credentials, sandbox access, or storage decision |
| QA/archive #22–#35, audit #36–#46, market QA #47–#49, R&D #50–#102 | Tracked in `docs/PROGRESS_CHECKLIST.md` and [`R&D Issues`](./R%26D%20Issues/README.md) |

No board or investor minutes, attendees, votes, resolutions, metrics, or traction claims were created by this migration.

---

## Prerequisites

- **Node.js** ≥ 20.19 (22.x or newer recommended)
- **pnpm** ≥ 10 — `npm install -g pnpm`
- A **Neon** PostgreSQL database (free tier is fine)

## 1. Install

```bash
pnpm install
```

## 2. Configure environment

Copy the example and replace the database and auth placeholders with real values.
`DATABASE_URL` and `BETTER_AUTH_SECRET` are required in every environment.

```bash
cp .env.example .env
```

There are no demo accounts or demo-mode flags. The first account registered after
deployment becomes `ADMIN` when no administrator exists; later accounts are `USER`.
New accounts are pre-verified and can sign in immediately.

Minimum required to run auth locally:

| Variable             | Where to get it                                             |
| -------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`       | Neon dashboard → Connection Details → **Pooled** connection |
| `DIRECT_URL`         | Neon dashboard → **Direct** connection (used by migrations) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32`                                   |

Vercel automatically detects the origin for production and preview deployments.
Browser sign-in always uses the current page's origin, so no URL environment
variables are required. The current production origin is
`https://gentech-mauve.vercel.app`; staging uses its Vercel Preview URL, and local
development uses `http://localhost:3000`. Set `APP_URL` or `BETTER_AUTH_URL` only
for non-Vercel deployments that need a fixed canonical origin.

Optional (features degrade gracefully until set):

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google sign-in
- `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` — Facebook sign-in
- `RESEND_API_KEY` / `EMAIL_FROM` — password-reset emails
  (without these, reset links are printed to the server console)
- `NEXT_PUBLIC_SF3D_ENABLED` / `NEXT_PUBLIC_SF3D_WEIGHTS_URL` — optional browser-only 3D generation; see [`docs/SF3D_WEBGPU.md`](./docs/SF3D_WEBGPU.md) before enabling
- `PAYFAST_*` — direct PayFast API for cards/JazzCash/Easypaisa; sandbox provider is used when unset
- `ANTHROPIC_API_KEY` / `ANTHROPIC_VISION_MODEL` — Sell Your Phone AI grading; deterministic DEV grader is used when unset
- `CRON_SECRET` — bearer secret for internal cron endpoints such as quote expiry
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` / `TWILIO_OTP_CHANNEL` — real phone OTP delivery; DEV provider logs codes when unset

OAuth redirect URIs (add in each provider's console):

- Google: `http://localhost:3000/api/auth/callback/google`
- Facebook: `http://localhost:3000/api/auth/callback/facebook`

For production OAuth, also register `https://gentech-mauve.vercel.app/api/auth/callback/<provider>`.

## 3. Create the database schema

```bash
pnpm db:migrate      # development database: creates tables + generates the client
```

For staging or production, apply committed migrations explicitly with
`pnpm db:deploy` before deploying the application. Builds do not seed or migrate data;
run `pnpm db:seed` explicitly against the intended database for catalog reference data.

## Accounts

Only real registered accounts can sign in. On a database with no administrator, the
first successful registration is assigned `ADMIN`; every later registration is `USER`.
Email verification is currently not required by Better Auth (`requireEmailVerification: false`),
but the final-repo `/verify-email` page and `sendVerificationEmail` client action are preserved.
Use a separate database for Vercel Preview so preview registrations cannot claim the
production administrator role.

## 4. Run

```bash
pnpm dev             # http://localhost:3000
```

---

## Scripts

| Script            | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `pnpm dev`        | Start the dev server (Turbopack)               |
| `pnpm build`      | Production build                               |
| `pnpm start`      | Run the production build                       |
| `pnpm typecheck`  | `tsc --noEmit`                                 |
| `pnpm lint`       | ESLint                                         |
| `pnpm format`     | Prettier write                                 |
| `pnpm db:migrate` | Create/apply a dev migration + generate client |
| `pnpm db:push`    | Push schema without a migration (prototyping)  |
| `pnpm db:studio`  | Open Prisma Studio                             |
| `pnpm db:seed`    | Seed catalog + 200 image-backed listings       |
| `pnpm db:seed:admin` | Seed a credential-backed ADMIN user (requires `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`) |

> Tip: to run a build without a populated `.env` (CI), prefix with
> `SKIP_ENV_VALIDATION=1`.

## Promoting a user to admin

Roles are not self-assignable. After signing up, promote yourself via Prisma Studio
(`pnpm db:studio` → `user` → set `role` = `ADMIN`) or SQL:

```sql
UPDATE "user" SET role = 'ADMIN' WHERE email = 'you@example.com';
```
