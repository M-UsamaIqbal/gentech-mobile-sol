# Production Deployment Checklist

## Deployment Target Analysis

**Repository Configuration:**

- `wrangler.jsonc` present → Cloudflare Workers target
- `open-next.config.ts` present → OpenNext for Cloudflare
- Package scripts: `cf:build`, `preview`, `deploy` for Cloudflare
- No `vercel.json` present

**Current User Deployment:**

- User has been deploying to Vercel (per Phase 6 audit)
- Build script uses `SKIP_ENV_VALIDATION=1` for Vercel compatibility

**Note:** The repository is architected for Cloudflare Workers deployment via OpenNext, but can also be deployed to Vercel. This checklist covers both targets.

## Phase 8 Preparation Status

**Completed Without Staging Infrastructure:**

- ✅ Repository state verified (commit 912ffd4, main branch, clean working tree)
- ✅ Deployment target identified (Cloudflare Workers via OpenNext, Vercel also supported)
- ✅ Environment variable audit completed (ENVIRONMENT_VARIABLES.md created)
- ✅ Environment safety verified (no committed secrets, .gitignore correct)
- ✅ Staging database setup guide created (STAGING_SETUP.md)
- ✅ Migration procedure verified (prisma migrate deploy for production)
- ✅ Seed mechanism confirmed (prisma/seed.ts with categories, brands, listings, inspection plans)

**Requires Staging Infrastructure:**

- ❌ Staging database creation and connection
- ❌ Runtime environment variable configuration
- ❌ Staging deployment (Vercel or Cloudflare Workers)
- ❌ Runtime verification of all user flows
- ❌ Security runtime tests
- ❌ Performance and mobile tests

---

## Pre-Deployment Checklist

### 1. Code Verification

- [ ] All tests passing: `pnpm test`
- [ ] Typecheck passing: `pnpm typecheck`
- [ ] Lint passing: `pnpm lint`
- [ ] Build passing: `pnpm build`
- [ ] Prisma validated: `pnpm prisma validate`
- [ ] No secrets committed (verify with `git log --all --oneline -- .env*`)
- [ ] No debug credentials in code
- [ ] No staging/test data in production paths

### 2. Environment Variables

#### Required (Mandatory for Operation)

- [ ] `DATABASE_URL` - PostgreSQL connection string (pooled for app)
- [ ] `DIRECT_URL` - PostgreSQL direct connection (for migrations)
- [ ] `BETTER_AUTH_SECRET` - Random 32+ character secret (`openssl rand -base64 32`)
Vercel automatically supplies production and preview origins; no app URL environment
variables are required. `APP_URL` and `BETTER_AUTH_URL` are optional for non-Vercel
deployments.

#### Required (Client-Side)
- [ ] `NEXT_PUBLIC_APP_NAME` - Application name

#### Optional (Feature-Specific)

- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- [ ] `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` - Facebook OAuth
- [ ] `RESEND_API_KEY` / `EMAIL_FROM` - Transactional email
- [ ] `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` - Media uploads
- [ ] PayFast merchant ID/key, HTTPS API base, merchant category code, and merchant-issued account/bank configuration (optional)
- [ ] Keep `PAYFAST_MODE=disabled` and `PAYFAST_LIVE_ENABLED=false` until sandbox, 3-D Secure, and compliance checks are complete
- [ ] `PAYMENTS_TEST_MODE` must be `false` on public production; set `true` only on preview/staging to exercise the simulated JazzCash/Easypaisa/card flow
- [ ] `DEVICE_VERIFICATION_TEST_MODE` must be `false` on public production; set `true` only on preview/staging to exercise simulated PTA/CPID results
- [ ] `FCM_PROJECT_ID` / `FCM_CLIENT_EMAIL` / `FCM_PRIVATE_KEY` - Server-only FCM service account; never use `NEXT_PUBLIC_FCM_*`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Maps integration
- [ ] `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_GA4_ID` / `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_MIXPANEL_TOKEN` - Analytics

### 3. Database Preparation

- [ ] Production database created (Neon PostgreSQL recommended)
- [ ] `DATABASE_URL` configured with pooled connection
- [ ] `DIRECT_URL` configured with direct connection
- [ ] Run committed migrations as a separate, controlled step: `pnpm db:deploy`
- [ ] Confirm the environment has the intended database connection; builds seed catalog data
- [ ] Verify all migrations applied successfully
- [ ] Check for schema errors or missing relations
- [ ] Create admin user: Set `role = 'ADMIN'` in `user` table
- [ ] Verify indexes exist for critical queries

### Payment Go-Live Gate

- [ ] Verify PayFast sandbox card and wallet flows, OTP, 3-D Secure, failure, pending, and status polling
- [ ] Confirm payment details are never persisted or logged
- [ ] Complete merchant and PCI/compliance review before enabling live mode
- [ ] Confirm the additive inspection payment-state migration is applied in the target environment
- [ ] Keep promotion checkout disabled until its flow uses server-verified payment results

### 4. Build Configuration

#### For Vercel Deployment

- [ ] Add environment variables in Vercel dashboard
- [ ] Set build command: `pnpm build` (seeds catalog data, but does not migrate)
- [ ] Run `pnpm db:deploy` separately before deployment; do not migrate in the build command
- [ ] Set output directory: `.next`
- [ ] Install command: `pnpm install`
- [ ] Node version: 20.19+ (22.x or newer recommended; required by Prisma 7)
- [ ] Framework preset: Next.js

#### For Cloudflare Workers Deployment

- [ ] Install Wrangler CLI: `pnpm add -g wrangler`
- [ ] Login to Cloudflare: `wrangler login`
- [ ] Configure environment variables in `wrangler.jsonc` or via dashboard
- [ ] Build for Cloudflare: `pnpm cf:build`
- [ ] Deploy: `pnpm deploy` or `wrangler deploy`
- [ ] Verify Cloudflare R2 configured for caching (optional but recommended)

---

## Post-Deployment Verification

### 5. Runtime Verification

- [ ] Application loads at production URL
- [ ] No 500 errors on homepage
- [ ] No console errors in browser
- [ ] Database connectivity verified
- [ ] Better Auth base URL configured correctly

### 6. Authentication Flow

- [ ] User registration works
- [ ] User login works
- [ ] Session persistence works
- [ ] Logout works
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Email verification (if configured) works
- [ ] Password reset (if configured) works
- [ ] OAuth providers (if configured) work

### 7. Buyer Flow

- [ ] Homepage loads
- [ ] Search functionality works
- [ ] Filters work (price, brand, storage, RAM, PTA, CPID, etc.)
- [ ] Listing pages load
- [ ] Listing details display correctly
- [ ] Images load from Cloudinary (if configured)
- [ ] Favorite functionality works
- [ ] Save search functionality works
- [ ] Contact seller creates conversation
- [ ] Messaging interface works

### 8. Seller Flow

- [ ] Create listing form loads
- [ ] Image upload works (if Cloudinary configured)
- [ ] Phone-specific fields validate correctly
- [ ] PTA/CPID status saves correctly
- [ ] Listing submits successfully
- [ ] Listing appears in seller dashboard
- [ ] Listing status transitions work
- [ ] Mark as sold works

### 9. Dealer Flow

- [ ] Dealer registration works
- [ ] Dealer dashboard loads
- [ ] Create branch works
- [ ] Add staff works
- [ ] Add inventory works
- [ ] Dealer listings display correctly
- [ ] Dealer leads appear when buyers contact
- [ ] Dealer A cannot access Dealer B data

### 10. Admin Flow

- [ ] Admin login works
- [ ] Admin dashboard loads statistics
- [ ] User management works
- [ ] Listing management works
- [ ] Report management works
- [ ] Category management works
- [ ] Moderation actions work
- [ ] Audit logs are created

### 11. Security Verification

- [ ] IMEI is masked in public listing pages
- [ ] Full IMEI only accessible to authorized users (inspector/admin)
- [ ] IMEI access is logged in audit log
- [ ] Rate limiting enforced on auth endpoints
- [ ] Rate limiting enforced on search suggestions
- [ ] Rate limiting enforced on messaging
- [ ] Rate limiting enforced on contact seller
- [ ] Authorization checks work on all actions
- [ ] IDOR tests pass (user cannot access other users' resources)
- [ ] Security headers present in HTTP responses
- [ ] CSP configured correctly
- [ ] HTTPS enforced in production

### 12. Data Privacy

- [ ] Private routes (dashboard, admin, auth) have noindex/nofollow
- [ ] No sensitive data in HTML page source
- [ ] No sensitive data in serialized props
- [ ] No sensitive data in metadata
- [ ] No sensitive data in structured data

### 13. Upload Security

- [ ] Only allowed image formats accepted (jpg, jpeg, png, webp)
- [ ] File size limits enforced
- [ ] Upload folder restrictions enforced
- [ ] Cloudinary signature verification works
- [ ] Unauthorized uploads rejected

### 14. SEO Verification

- [ ] Public listing pages are indexable
- [ ] Metadata displays correctly
- [ ] Open Graph tags work
- [ ] Canonical URLs correct
- [ ] Sitemap accessible (if implemented)
- [ ] Robots.txt correct (if implemented)

### 15. Payment Status

- [ ] Payment provider configured OR explicitly disabled
- [ ] If disabled: UI communicates sandbox state clearly
- [ ] If enabled: Webhook endpoint implemented
- [ ] If enabled: Signature verification implemented
- [ ] If enabled: Payment records immutable
- [ ] If enabled: Amount/currency validated server-side
- [ ] If enabled: Promotions only activate after verified payment

### 16. Performance

- [ ] Homepage loads within 3 seconds
- [ ] Search results load within 2 seconds
- [ ] Listing pages load within 2 seconds
- [ ] No obvious N+1 query issues
- [ ] Images optimized
- [ ] No console errors

### 17. Mobile Responsiveness

- [ ] Homepage usable at 320px
- [ ] Search/filter drawer works on mobile
- [ ] Listing pages mobile-friendly
- [ ] Contact seller works on mobile
- [ ] Messaging works on mobile
- [ ] Create listing works on mobile

### 18. Error Monitoring

- [ ] No uncaught exceptions in logs
- [ ] No database errors in logs
- [ ] No auth errors in logs
- [ ] No Cloudinary errors in logs
- [ ] Error pages (404, 500) display correctly
- [ ] Internal errors not exposed to users

---

## Payment Integration Specific

### If Payments are DISABLED (Current State)

- [ ] Promotions UI shows sandbox/disabled state
- [ ] Users cannot initiate real payments
- [ ] Payment flows are clearly marked as testing only
- [ ] No real credit card processing

### If Payments are ENABLED (Future State)

- [ ] Payment provider account created
- [ ] API credentials configured securely
- [ ] Webhook endpoint implemented and tested
- [ ] Signature verification implemented
- [ ] Server-side amount validation
- [ ] Refund handling implemented
- [ ] Payment record immutability enforced
- [ ] Promotion activation only after verified payment
- [ ] Sandbox testing completed
- [ ] Production provider contract in place

---

## Rollback Plan

- [ ] Database backup before deployment
- [ ] Previous deployment tagged/committed
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging

---

## Final Sign-Off

- [ ] All checklist items verified
- [ ] Stakeholder approval obtained
- [ ] Deployment window scheduled
- [ ] Monitoring configured
- [ ] Support team notified

---

## Notes

- The repository is architected for Cloudflare Workers deployment via OpenNext
- Vercel deployment is also supported with current build configuration
- Database must be PostgreSQL (Neon recommended)
- Cloudinary is recommended for media uploads
- Better Auth requires proper secret configuration
- Payments are currently in sandbox state only
