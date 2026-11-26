# QA Agent Skill — GenTech Marketplace (All Features)

## 0. Activation

This skill is active whenever the task involves verifying, testing, or signing off any GenTech feature — locally, on a Preview deployment, or on Production. Operate as a senior QA engineer: evidence first, no assumptions, no unverified "passing" claims.

Never downgrade to generic chatbot mode. Do not report a feature as working unless you have observed the result (HTTP response, test output, DOM state, or database row).

---

## 1. Environments

| Environment | URL | Auth | Data |
| :--- | :--- | :--- | :--- |
| Local | `http://localhost:3000` | Real accounts only | Local DB (`DATABASE_URL` in `.env`) |
| Preview | Vercel preview URL (per PR) | Real accounts only | Preview DB |
| Production | `https://gentech-mauve.vercel.app` | Real accounts only | Production DB — treat as live customer data |

- Always use the **production alias** above. Direct `*.vercel.app` deployment URLs can return Vercel `Protected deployment` 401.
- QA admin credentials are supplied out-of-band. Read them from `QA_ADMIN_EMAIL` and `QA_ADMIN_PASSWORD` environment variables. **Never commit credentials to this repository.**
- Demo accounts and `DEMO_MODE` were removed. There is no demo login, demo seed, or verify-email flow. Do not reintroduce them for testing.

### Rate limits

- `/api/auth/*`: **5 requests / 15 minutes per IP** (429 with `Retry-After`).
- `/api/auth/*/forgot-password`, `/reset-password`: 3 / hour.
- IMEI check: 10 / minute. Contact seller: 10 / hour.
- Space auth calls. Prefer one browser session over repeated HTTP sign-ins.

---

## 2. Safety rules (non-negotiable)

1. **No destructive operations.** No migrations, resets, `db push`, truncation, or deletion of real rows.
2. **Use labelled QA data.** Prefix created listings/categories with `QA-` and a date, e.g. `QA listing 2026-11-19`.
3. **Never fake a Bahrain listing.** A Bahrain listing must use `country=Bahrain`, a real Bahrain city and area from an official Bahrain/iGA source, `currency=BHD`, and a real phone photograph. Never use Karachi, Lahore, Islamabad, or any other non-Bahrain location for `/bh/*` QA data.
4. **Clean up temporary accounts** created for QA unless the owner explicitly asked for the data to remain (e.g. a requested demo listing).
5. **Never expose secrets** in logs, screenshots, commits, or bug reports. Mask tokens, cookies, and passwords.
6. **Verify authorization server-side**, not by hidden UI: a `USER` must be rejected by the endpoint/layout even if the button was removed from the page.
7. **Fail closed** on third-party integrations (PTA/CPID, payments): a missing provider credential must not produce a fake success.
8. **One change at a time** when diagnosing, then re-test.

---

## 3. Local verification gate (run before any live QA)

```powershell
pnpm typecheck          # must be 0 errors
pnpm test               # must be all passing
pnpm lint               # must be 0 errors (warnings are tracked separately)
pnpm build              # must complete; 257+ pages generated
```

Record exact counts. A build that logs `DYNAMIC_SERVER_USAGE` while static-generating auth/dashboard routes is expected and non-fatal — only the final exit status matters.

---

## 4. Feature QA matrix

### A. Auth & onboarding (cross-cutting)

| ID | Scenario | Expected |
| :--- | :--- | :--- |
| AUTH-01 | First signup on a database with 0 active admins | Account persisted as `ADMIN`, `emailVerified: true`, dashboard badge `ADMIN`, `/admin` opens in the **same** session |
| AUTH-02 | Second and later signups | Persisted as `USER`; `/admin` returns 307 redirect |
| AUTH-03 | Concurrent first signups | Advisory lock guarantees exactly one `ADMIN` |
| AUTH-04 | Email verification | No verification page, toggle, or gate exists; new accounts are pre-verified and can sign in immediately |
| AUTH-05 | Demo removal | No `DEMO_MODE`, demo account, demo panel, or demo-login route; no seeded demo users |
| AUTH-06 | Rate limit | 6th auth request in 15 min returns 429 with `Retry-After` |
| AUTH-07 | Sign-in with valid credentials | 200, session cookie set, role reflected in `getSession` |

### B. Catalog & admin (M1)

| ID | Feature | QA checks |
| :--- | :--- | :--- |
| M1-F01 | Brand management | Create/edit brand, reorder, toggle active; inactive brands disappear from sell form filters |
| M1-F02 | Model & specs manager | CRUD model with display/processor/camera/battery/RAM/storage/colors; variants appear in sell form |
| M1-F03 | Dynamic specs in sell/filter | Changing brand updates model list; storage/RAM/color filters return matching listings |
| M1-F04 | Listing approval workflow | New listing → `PENDING_APPROVAL`; approve → `ACTIVE`; reject with reason → `REJECTED` + audit row; reviewer and timestamp recorded |
| M1-F05 | Location taxonomy | Country → city → area hierarchy created and used by listing form and marketplace filter |
| M1-F06 | Admin analytics | Pending/active/rejected counts and brand distribution match database state |

### C. Dealer & inventory (M2)

| ID | Feature | QA checks |
| :--- | :--- | :--- |
| M2-F01 | Dealer registration | Apply with business details, admin approves, dealer storefront visible |
| M2-F02 | Verification queue | Pending dealer appears in admin queue; approve/reject updates state |
| M2-F03 | Branches & inventory | Add branch, add stock, stock appears under correct dealer/branch and in marketplace filter |

### D. Monetization (M3)

| ID | Feature | QA checks |
| :--- | :--- | :--- |
| M3-F01 | Promotion packages | Create/edit Silver/Gold/Platinum plans with price and duration |
| M3-F02 | Promotion checkout | Pending promotion created → price snapshotted server-side → provider redirect → activation **only** on server-verified `PAID`; seller-submitted outcome rejected |

### E. Discovery & communication (M4)

| ID | Feature | QA checks |
| :--- | :--- | :--- |
| M4-F01 | Multi-attribute filters | Storage, RAM, color, battery health, PTA/CPID, warranty, inspection, verified seller, dealer, price, city — each narrows results correctly |
| M4-F02 | Messaging & WhatsApp | Listing-scoped conversation, text/image send, typing indicator, read receipt, WhatsApp link uses real seller number with prefilled context |
| M4-F03 | Favorites & saved searches | Favorite persists across sessions; saved search notifies once per newly activated listing; pause/resume works |

### F. Trust & phone intelligence (M5)

| ID | Feature | QA checks |
| :--- | :--- | :--- |
| M5-F01 | Valuation | Price estimate derived from active/sold data; BHD 3 dp / PKR 0 dp never cross-converted |
| M5-F02 | IMEI / PTA / CPID | Non-production uses labelled simulator; production fails closed without provider credentials; simulated rows flagged `isSimulated` |
| M5-F03 | Spec comparison | `/bh/en/compare` empty state has no `{country}`; selecting 2 phone model IDs renders 3-column side-by-side table with populated specs, country currency (`BHD`/`PKR`), loaded images, single `Compare Phones · GenTech` title, and no console errors |
| M5-F04 | Inspection workflow | Request → claim → schedule → graded report → payment-gated release; terminal requests cannot be re-claimed; IMEI masked unless authorized + audit logged |

### G. Cross-cutting

| Area | QA checks |
| :--- | :--- |
| Localization | `/bh/{en,ar,ur}` and `/pk/{en,ar,ur}` render correct `lang`/`dir`, currency, cities, and PTA text only on PK |
| SEO | Sitemap, robots, metadata, JSON-LD; no demo or verify-email paths indexed |
| Security | Server-side role enforcement, input validation, rate limits, audit trail on financial/inventory actions |
| Performance | Read paths use `AsNoTracking`/projections, no N+1, list endpoints paginated |
| Authorization | `USER` cannot reach `/admin` or admin actions even when calling the endpoint directly |

---

## 5. Live browser QA procedure

Use the in-app browser. Never drive production QA from curl alone when the feature includes client-side logic.

1. Open `https://gentech-mauve.vercel.app/sign-in`.
2. Sign in with `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD`.
3. Confirm dashboard shows `ADMIN` and `Verified`.
4. Open `/admin` — confirm the Operations workspace renders (not a redirect).
5. Execute the specific feature scenario from the matrix above.
6. Inspect `network.list` for the relevant API call and status code.
7. Inspect `console` level `error` — must be empty for the flow under test.
8. Capture a screenshot for visual regressions when layout is part of the feature.
9. Verify the result in the database **only if** a read-only query is available; never mutate production rows directly.

### First-page Bahrain listing check (on request)

1. As admin, create a category if the listing form requires one: `/admin/categories`. Prefer a live catalog category such as `mobile-phones` unless a dedicated QA category is explicitly required.
2. Add/verify Bahrain cities and areas from official Bahrain/iGA sources via `/admin/locations`. Never reuse Pakistan cities for `/bh/*`.
3. Create the listing through `/bh/en/sell` (admin is also a seller) with `country=Bahrain`, a Bahrain `city` and `area`, `BHD` price, and a real phone photograph.
4. Ensure the listing is `ACTIVE` (approve it from `/admin/listings` if it lands in `PENDING_APPROVAL`).
5. Open `/bh/en` and `/bh/en/marketplace` — confirm the listing appears in the first visible set with `BHD`, the correct Bahrain city/area, and the phone photo.
6. Open the detail page — confirm city/area, price, image, and empty console errors.
7. Report listing ID, slug, category, city/area, image URL, and first-page visibility. Keep the data only if the owner asked for a persistent listing; otherwise remove it.

### Phone comparison check (on request)

1. Open `/bh/en/compare` with no query — confirm localized description, empty state, no `{country}` placeholder, and no console errors.
2. Use two active phone model IDs (create minimal QA reference models through `createModelAction` if production has none). Confirm `?phones=<id1>,<id2>` renders a `table` with `thead th` count of 3 and no empty/`-` spec cells.
3. Verify currency labels use the country currency (`BHD` on `/bh/*`, `PKR` on `/pk/*`), never a hardcoded fallback from the browser bundle.
4. Verify images load (`naturalWidth > 0`) and `document.title` has exactly one `GenTech` suffix.
5. Report model IDs, row/column counts, currency samples, image URLs, and console status. Remove QA models if the owner did not request persistent data.

---

## 6. Bug report format

```md
### BUG — <short title>
- **Severity:** P0 / P1 / P2 / P3
- **Environment:** local / preview / production (+ commit SHA)
- **Feature ID:** AUTH-01, M1-F04, ...
- **Steps:** numbered, minimal reproduction
- **Expected:** ...
- **Actual:** ... (include HTTP status, DOM text, or DB value)
- **Evidence:** request ID, screenshot path, console error — secrets masked
- **Suspected area:** file / module
```

---

## 7. Sign-off checklist

- [ ] Local gate: typecheck / tests / lint / build all green, counts recorded
- [ ] Each in-scope feature ID has an observed PASS/FAIL with evidence
- [ ] Authorization checked from a non-admin account where applicable
- [ ] No rate-limit (429) or console errors during the flow
- [ ] QA-created data handled per the safety rules
- [ ] `docs/PROJECT_STATUS.md` updated with the result
