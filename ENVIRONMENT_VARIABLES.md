# Environment Variables Reference

## Variable Mapping

| Variable                          | Required? | Build-time? | Runtime? | Client-visible? | Secret? | Purpose                                                                                 |
| --------------------------------- | --------- | ----------- | -------- | --------------- | ------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`                    | YES       | NO          | YES      | NO              | YES     | PostgreSQL pooled connection (application)                                              |
| `DIRECT_URL`                      | OPTIONAL  | NO          | YES      | NO              | YES     | PostgreSQL direct connection (migrations)                                               |
| `BETTER_AUTH_SECRET`              | YES       | NO          | YES      | NO              | YES     | Better Auth session signing key                                                         |
| `BETTER_AUTH_URL`                 | OPTIONAL  | NO          | YES      | NO              | NO      | Auth base URL override (Vercel origin is detected automatically)                        |
| `APP_URL`                         | OPTIONAL  | YES         | YES      | NO              | NO      | Server-side app URL override for non-Vercel deployments                                 |
| `GOOGLE_CLIENT_ID`                | OPTIONAL  | NO          | YES      | NO              | YES     | Google OAuth client ID                                                                  |
| `GOOGLE_CLIENT_SECRET`            | OPTIONAL  | NO          | YES      | NO              | YES     | Google OAuth client secret                                                              |
| `FACEBOOK_CLIENT_ID`              | OPTIONAL  | NO          | YES      | NO              | YES     | Facebook OAuth client ID                                                                |
| `FACEBOOK_CLIENT_SECRET`          | OPTIONAL  | NO          | YES      | NO              | YES     | Facebook OAuth client secret                                                            |
| `RESEND_API_KEY`                  | OPTIONAL  | NO          | YES      | NO              | YES     | Resend email API key                                                                    |
| `EMAIL_FROM`                      | OPTIONAL  | NO          | YES      | NO              | NO      | Transactional email sender address                                                      |
| `CLOUDINARY_CLOUD_NAME`           | OPTIONAL  | NO          | YES      | NO              | YES     | Cloudinary cloud name                                                                   |
| `CLOUDINARY_API_KEY`              | OPTIONAL  | NO          | YES      | NO              | YES     | Cloudinary API key                                                                      |
| `CLOUDINARY_API_SECRET`           | OPTIONAL  | NO          | YES      | NO              | YES     | Cloudinary API secret                                                                   |
| `PAYFAST_MERCHANT_ID`             | OPTIONAL  | NO          | YES      | NO              | YES     | PayFast merchant ID                                                                     |
| `PAYFAST_SECURED_KEY`             | OPTIONAL  | NO          | YES      | NO              | YES     | PayFast secured key                                                                     |
| `PAYFAST_API_BASE`                | OPTIONAL  | NO          | YES      | NO              | NO      | PayFast API base URL                                                                    |
| `PAYMENTS_TEST_MODE`              | OPTIONAL  | NO          | YES      | NO              | NO      | Test-only: allow the built-in simulated gateway in a production build                   |
| `DEVICE_VERIFICATION_TEST_MODE`   | OPTIONAL  | NO          | YES      | NO              | NO      | Test-only: allow simulated PTA/CPID results in a production build                      |
| `FCM_PROJECT_ID`                  | OPTIONAL  | NO          | YES      | NO              | NO      | Firebase project ID for server-side push messaging                                      |
| `FCM_CLIENT_EMAIL`                | OPTIONAL  | NO          | YES      | NO              | YES     | Firebase service-account client email                                                   |
| `FCM_PRIVATE_KEY`                 | OPTIONAL  | NO          | YES      | NO              | YES     | Firebase service-account private key (server-only)                                      |
| `NEXT_PUBLIC_APP_NAME`            | YES       | YES         | YES      | YES             | NO      | Application name (client)                                                               |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | OPTIONAL  | YES         | YES      | YES             | NO      | Google Maps API key                                                                     |
| `NEXT_PUBLIC_GTM_ID`              | OPTIONAL  | YES         | YES      | YES             | NO      | Google Tag Manager container ID                                                         |
| `NEXT_PUBLIC_GA4_ID`              | OPTIONAL  | YES         | YES      | YES             | NO      | Google Analytics 4 measurement ID                                                       |
| `NEXT_PUBLIC_META_PIXEL_ID`       | OPTIONAL  | YES         | YES      | YES             | NO      | Meta Pixel ID                                                                           |
| `NEXT_PUBLIC_MIXPANEL_TOKEN`      | OPTIONAL  | YES         | YES      | YES             | NO      | Mixpanel project token                                                                  |
| `NODE_ENV`                        | OPTIONAL  | NO          | YES      | NO              | NO      | Node environment (development/test/production)                                          |
| `SKIP_ENV_VALIDATION`             | OPTIONAL  | YES         | NO       | NO              | NO      | Skip build-time env validation (NEVER use at runtime)                                   |

## Critical Variables (Mandatory for Operation)

These variables are required for a database-backed application. If both `DATABASE_URL`
and `BETTER_AUTH_SECRET` are missing in production, the app automatically starts in
read-only demo mode and disables database access.

1. **`DATABASE_URL`** - PostgreSQL connection string with pgbouncer
   - Format: `postgresql://user:password@host:port/database?pgbouncer=true`
   - Used by Prisma for all database operations
   - Must use pooled connection for application
   - **Do not use this for migrations**

2. **`DIRECT_URL`** - PostgreSQL direct connection
   - Format: `postgresql://user:password@host:port/database`
   - Used by Prisma migrations only
   - Required for schema changes
   - **Do not use this for application runtime**

3. **`BETTER_AUTH_SECRET`** - Session signing key
   - Must be random, at least 32 characters
   - Generate with: `openssl rand -base64 32`
   - Used to sign and verify session cookies
   - The local placeholder (`local-demo-secret-change-before-deploy-...`) is rejected in Production; demo sessions and real sessions both require a real secret
   - **Rotate this if compromised**

4. **`BETTER_AUTH_URL`** / **`APP_URL`** - Optional URL overrides
   - Vercel production and preview origins are detected automatically and take precedence
   - Set only for non-Vercel deployments that need a fixed canonical origin

5. **`NEXT_PUBLIC_APP_NAME`** - Application name
   - Displayed in UI and metadata
   - Example: `GenTech`

## Optional Variables (Feature-Specific)

### OAuth Providers

- **Google OAuth**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Facebook OAuth**: `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`
- Redirect URIs must be configured in provider console

### Email

- **Resend**: `RESEND_API_KEY`, `EMAIL_FROM`
- Without these, email links are printed to console (dev-only)

### Media Uploads

- **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Required for image uploads
- Server-side signature generation

### Payments

- **PayFast direct API**: Configure the merchant ID/key, HTTPS API base, merchant category code, and the account-type/bank-code values supplied for each enabled method. Keep all values server-side.
- `PAYFAST_MODE` defaults to `disabled`. Use `sandbox` only with PayFast-issued sandbox credentials; `live` is additionally gated by `PAYFAST_LIVE_ENABLED=true`.
- Inspection checkout processes payment details in memory and sends them to PayFast over HTTPS. GenTech does not persist PAN, CVV, PIN, or OTP. A short-lived authenticated continuation contains only the provider's temporary instrument token and transaction context.
- The integration uses PayFast's direct token/tokenized-transaction/status API; it is not a hosted checkout and does not rely on a webhook. The server verifies transaction and basket references before changing payment state.
- Without PayFast configuration, non-production inspection checkout uses the built-in sandbox; it never represents a real charge. Production fails closed instead of falling back to simulated success.
- For pre-launch testing on a production build (e.g. a Vercel preview), set `PAYMENTS_TEST_MODE=true` to allow the same built-in sandbox there. It simulates JazzCash, Easypaisa, and card outcomes and marks the inspection paid without contacting a provider — **never leave it enabled on a public production deployment**, and it is ignored whenever real PayFast credentials are configured.
- Promotion checkout is not yet connected to verified payment processing. Promotion creation and seller-submitted payment outcomes are disabled; do not activate or account for a promotion as paid based on client input.
- Do not enable live processing until merchant sandbox testing (including OTP and 3-D Secure), PCI/compliance review, and production-secret configuration are complete. A database migration for payment states is additive and must be applied through the normal reviewed deployment process.
- Do not add JazzCash, Easypaisa, NayaPay, Visa, Mastercard, or bank-transfer secrets as `NEXT_PUBLIC_*` variables. Use a server-side provider adapter and managed secret storage.
- Visa and Mastercard acceptance must be enabled through an acquiring bank or supported payment gateway; they are card networks, not wallet adapters.
- The merchant must confirm the PayFast API contract, account configuration, PCI responsibilities, refunds, and settlement reconciliation before live use.
- Never persist full card numbers, CVV, PINs, or OTPs. Do not place payment details or secrets in client-visible environment variables, logs, analytics, or support tooling.

### Device Verification (PTA / CPID)

- PTA (DIRBS) and CPID lookups require a provider API contract and credentials that are not yet configured. Until a real adapter is registered, production returns **no status** rather than fabricating an approval.
- Outside production the deterministic simulator runs automatically: the IMEI's last digit selects the scenario (`0/1/9` approved and clean, `2` PTA pending, `4` PTA rejected, `5` blacklisted, `6` stolen, `7` unknown, `8` rejected by both). Device brand/model/color are generated deterministically.
- For staging/preview checks in a production build, set `DEVICE_VERIFICATION_TEST_MODE=true`. Simulated rows are stored with `isSimulated=true`, tagged `SIMULATED`, and rendered with a warning banner — never enable this on a public production deployment.
- Cached results expire after 24 hours; if a refresh fails, the previous result is returned and flagged as stale.

### Push Notifications (FCM)

- **Server-only**: `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`
- Keep service-account credentials out of client bundles. Do **not** use `NEXT_PUBLIC_FCM_*`; those names were removed.
- The private key may be stored with literal `\n` separators; the server parses them before signing.
- Without all three values, push sending is disabled and dev/test sends are simulated only.

### Maps

- **Google Maps**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- For location features

### Analytics

- **GTM**: `NEXT_PUBLIC_GTM_ID`
- **GA4**: `NEXT_PUBLIC_GA4_ID`
- **Meta Pixel**: `NEXT_PUBLIC_META_PIXEL_ID`
- **Mixpanel**: `NEXT_PUBLIC_MIXPANEL_TOKEN`

## Authentication Policy

- Email verification is disabled for all new registrations; accounts are created pre-verified.
- `DEMO_MODE`, `DEMO_READ_ONLY`, and `DEMO_SEED_USERS` are ignored.

## Build-Only Variables

- **`SKIP_ENV_VALIDATION`**: Set to `"1"` to skip build-time environment validation
  - **NEVER use at runtime**
  - Only for CI/CD builds where environment is configured at deploy time
  - Application will still fail at runtime if required variables are missing

## Security Notes

1. **Never commit secrets** - All secrets are in `.gitignore`
2. **Use different secrets** for staging and production
3. **Rotate secrets** periodically
4. **Use strong secrets** - 32+ characters for `BETTER_AUTH_SECRET`
5. **Configure CORS** - Restrict origins in production
6. **Use HTTPS** - All production requests must be over HTTPS
7. **Secure cookies** - Set `secure: true` and `httpOnly: true` in production

## Validation Behavior

- **Build-time**: Validates client-side variables (`NEXT_PUBLIC_*`)
- **Runtime**: Validates server-side variables (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
- **Skip**: Use `SKIP_ENV_VALIDATION=1` only for builds, never runtime
- **Failure**: Missing required variables throw immediately at process boot

## Default Values

- `NODE_ENV`: `development`
- `APP_URL`: `http://localhost:3000`
- `NEXT_PUBLIC_APP_NAME`: `GenTech`

All other required variables must be explicitly configured.
