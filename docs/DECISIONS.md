# GenTech Marketplace — Architectural & Business Decisions (ADR)

## ADR-001: Autonomous Execution Model

- **Date:** 2026-11-05
- **Status:** Approved
- **Decision:** The AI operates as Lead Technical Authority and Project Owner, autonomously executing sequential roadmap milestones without pausing for trivial approvals. Questions are reserved strictly for irreversible operations or external credentials.

## ADR-002: Dynamic Catalog (No Hardcoded Brands or Specs)

- **Date:** 2026-11-05
- **Status:** Approved
- **Decision:** All brands, phone models, storage options, RAM options, and colors must be stored in PostgreSQL and configurable via the Admin Panel. Marketplace forms and filters query these models dynamically so the platform can expand to tablets and accessories without code changes.

## ADR-003: Inward Dependency Rule for Database Access

- **Date:** 2026-11-05
- **Status:** Approved
- **Decision:** Prisma client is imported exclusively within `features/<feature>/repositories/`. Services and server actions interact through repository abstractions, keeping business logic testable and decoupled from database drivers.

## ADR-004: Listing Moderation & Approval State Machine

- **Date:** 2026-11-05
- **Status:** Approved
- **Decision:** Listings support an approval workflow. New ad submissions can be verified before being marked `ACTIVE`. Rejections require a reason and are logged to `AuditLog`.

## ADR-005: Relational Location References With Historical Snapshots

- **Date:** 2026-11-11
- **Status:** Approved
- **Decision:** Countries, cities, and areas are managed relationally and active selections are validated server-side. Listings and inspection requests keep their existing city/area text alongside nullable foreign keys so legacy or historical location text remains readable when a managed location is removed.

## ADR-006: Dealer Review Without Public Document Uploads

- **Date:** 2026-11-11
- **Status:** Approved
- **Decision:** Dealer applications are reviewed from submitted business profile data. Admin approval activates and verifies the dealer; rejection requires a reason stored on the profile and in the audit log. Private tax or identity documents are deferred until private file storage is configured; the public image-upload flow must not be used for them.

## ADR-007: PayFast Direct API With No Payment-Detail Persistence

- **Date:** 2026-11-11
- **Status:** Approved, live processing gated
- **Decision:** Inspection payments use PayFast's direct token/tokenized-transaction/status API. Card, wallet, and OTP details are sent to PayFast but never persisted or logged by GenTech. A short-lived authenticated continuation carries only the temporary provider instrument token and transaction context. Live processing remains disabled until merchant sandbox/3-D Secure testing and compliance review are complete. Promotion checkout must not activate listings or accept seller-submitted payment outcomes until it is connected to verified server-side payment processing.

## ADR-008: PayFast Verification Status Update

- **Date:** 2026-11-11
- **Status:** Approved — M3-F02 implemented
- **Decision:** M3-F02 paid promotion checkout is now implemented with server-verified payment gating using the built-in sandbox provider (`PAYMENTS_TEST_MODE=true`). The flow creates a promotion in pending state, snapshots the plan price server-side, routes the buyer to a payment provider (PayFast 3DS or internal sandbox), and activates the promotion only on server-verified `PAID` status. Seller-submitted outcomes are never accepted (ADR-012). Live PayFast processing remains disabled until merchant sandbox/3-D Secure and compliance verification are complete. Promotion checkout was previously paused at the code-complete boundary (ADR-008, 2026-11-11) but is now connected via the established payment abstraction pattern.

## ADR-009: WhatsApp Contact Uses Seller-Provided Listing Contact Numbers

- **Date:** 2026-11-11
- **Status:** Approved
- **Decision:** Listing WhatsApp links use the seller's profile phone or, for dealer listings, the dealer's business phone. The account and dealer forms identify these numbers as listing contact options. Format common Pakistani local numbers for WhatsApp, and omit the contact action when a usable number is unavailable.

## ADR-010: Saved Search Alerts Follow Listing Approval

- **Date:** 2026-11-11
- **Status:** Approved
- **Decision:** A saved search enables in-app and email alerts by default; users can pause or resume alerts per search. Match alerts are sent only when a listing transitions from pending approval to active, never for pending listings, and the listing owner is excluded. Favorites remain private to the user and require an active listing.

## ADR-011: Graded Inspection Reports Require a Paid, Open Request

- **Date:** 2026-11-17
- **Status:** Approved
- **Decision:** The inspection state machine is explicit: only `REQUESTED`, `PAYMENT_PENDING`, and `SCHEDULED` requests can be claimed or rescheduled, and `IN_PROGRESS` may only be rescheduled. `COMPLETED`, `CANCELLED`, and `EXPIRED` are terminal and can never regress. A graded report is released only when the request is still open **and** `paymentStatus = PAID`, so the marketplace never delivers a paid service without collection. The report checklist defaults every line to `NOT_APPLICABLE` and at least one item must be graded, so an untouched form cannot produce an unearned A. Grades derive solely from graded checklist lines.

## ADR-012: Simulated Integrations Fail Closed and Are Labelled

- **Date:** 2026-11-17
- **Status:** Approved
- **Decision:** Payment (PayFast sandbox) and device-verification (PTA/CPID) simulators are used outside production automatically and in a production build only when `PAYMENTS_TEST_MODE` / `DEVICE_VERIFICATION_TEST_MODE` is explicitly `true` for preview/staging. Simulated IMEI results are persisted with `isSimulated = true`, shown with a warning banner, and never presented as real regulatory checks. Without a real provider or test mode, production fails closed: no payment method is offered and no PTA/CPID status is produced. Both flags must be `false` on public production.

## ADR-013: Demo Credentials Are Canonical Fixtures With Scoped Session Creation

- **Date:** 2026-11-18
- **Status:** Superseded by ADR-015
- **Decision:** Demo credentials lived in one shared module and were consumed by the seed, sign-in form, demo panel, and auth route. Known demo emails were intercepted before Better Auth or Prisma. `VERCEL_ENV` took precedence over `NODE_ENV` so an unset build-time `NODE_ENV` could not widen production access. Dealer capability is represented by `USER` + `DealerUser` membership because the `Role` enum has no dealer value.

## ADR-014: Email Verification Is Opt-In and Admin-Controlled

- **Date:** 2026-11-18
- **Status:** Superseded by ADR-015
- **Decision:** Email verification was opt-in via the persisted `EMAIL_VERIFICATION_REQUIRED` app setting and an admin toggle at `/admin/settings`; the auth route enforced it per sign-in.

## ADR-015: Real Accounts Only, First Admin, Verification Disabled

- **Date:** 2026-11-19
- **Status:** Approved
- **Decision:** All demo flags, accounts, sessions, seeding, and UI are removed. `DEMO_MODE` is ignored. Better Auth's `user.create.before` hook marks new accounts `emailVerified: true`; its `user.create.after` hook promotes the first persisted account to `ADMIN` only when no active `ADMIN` exists, guarded by `pg_advisory_xact_lock`, so simultaneous sign-ups cannot both claim the role. No verification route, setting, or sign-in gate remains.

## ADR-016: Photo-Sequence Product Viewer, Honest Tiers, No Default AI Synthesis

- **Date:** 2026-11-25
- **Status:** Amended by ADR-017, ADR-018 and ADR-019
- **Decision:** The interactive viewer is built only from the seller's ordinary JPG/JPEG/PNG/WebP photographs in upload order. No 360 image format or video is accepted; a genuinely uploaded 3D model is optional and governed by ADR-018. Tiers are honest: 1 photo is a zoomable photo, 2–3 switch between photos, 4–11 are multi-angle with an explicit limited-angle label, 12–23 provide interactive rotation, and 24–36 provide the recommended 360° experience. Sellers may upload up to 36 photos, reorder them with arrow controls, and remove any photo; the existing Cloudinary signature and seller ownership rules are unchanged. AI-generated intermediate views remain optional and are **not enabled**: no provider, cost approval, or async worker exists yet. If enabled later, derived frames must be stored separately from `listing_image`, marked `isGenerated`, never overwrite seller photos, be produced asynchronously with per-listing cost caps and seller ownership checks, and must never be described as genuine product photographs or used to infer product attributes.

## ADR-017: Zero-Cost Browser Blending Instead of Free AI Synthesis

- **Date:** 2026-11-25
- **Status:** Approved
- **Context:** A genuinely new camera angle requires a generative model and compute, so no provider can honestly promise unlimited free synthesis. The request for free enhancement is satisfied without any external service, API key, storage or per-view cost.
- **Decision:** The viewer offers an opt-in "smooth photo blending" mode for listings with two or more photos. During a drag it cross-fades the two adjacent **seller photographs** in the browser using their measured displacement (`blendFromDrag`), so transitions feel continuous. The blend is transient client state: it is never uploaded, stored in `listing_image`, or given a public URL. It is always labelled "Blended between your photos" with an explicit notice that no new angle is generated, and it is cleared on release, navigation, thumbnail selection and auto-rotation. This is not AI generation and never replaces the honest photo-count tiers. Real synthesis remains disabled under ADR-016 until a provider, cost approval and async worker exist.
- **Consequences:** Zero marginal cost, no new dependencies, no database migration, and no change to seller ownership or upload authorization. A cross-fade is a transition effect, not a reconstructed viewpoint; it must never be marketed as a captured or synthesized angle.

## ADR-018: Genuine Seller-Supplied 3D Models Are Opt-In

- **Date:** 2026-11-25
- **Status:** Amended by ADR-019
- **Context:** Buyers benefit from inspecting a real 3D product, but no free service can honestly reconstruct a trustworthy model from ordinary photos. The marketplace must not imply AI-generated or inferred geometry, and no paid API or hosted model pipeline is acceptable.
- **Decision:** Sellers may optionally upload one genuine GLB or GLTF file plus its referenced `.bin`/image assets. Models are stored as Cloudinary `resource_type: "raw"` assets in an authenticated, user-scoped folder (`models/{userId}`); every create/replace/remove path validates that public IDs start with that prefix. The detail viewer dynamically imports free/open-source Three.js, React Three Fiber and drei only when a model exists, and shows a 3D tab only for those listings. Photographs remain the default and are never converted, synthesized, or described as 3D. Model replacement/removal is owner-scoped in the repository, with old raw assets deleted only after the database transaction commits.
- **Consequences:** One additive `ListingModel` table and nullable relation; no change to `listing_image`, no paid dependency, and no 3D bundle for listings without a model. GLTF external references are resolved only to the seller's already-validated Cloudinary URLs, so a malicious document cannot trigger arbitrary fetches. Sellers can preview, replace and remove the model post-publication without making it required.

## ADR-019: Gated Browser-Side SF3D Generation With Explicit Provenance

- **Date:** 2026-11-25
- **Status:** Approved — deployment gated on legal clearance
- **Context:** Sellers asked for image-to-3D generation without a paid API, Python backend, hosted GPU, or private credentials. `sf3d-webgpu` can run entirely in the browser with WebGPU, but its model weights are about 2.1 GB and cannot be uploaded to Vercel Free/Hobby (100 MB source-file limit). The upstream repository has no root licence and bundles an `UNLICENSED` inference kit; the weights use the Stability AI Community License with a US $1M annual-revenue threshold for commercial use.
- **Decision:** Sellers may optionally generate a GLB from one of their already-uploaded JPG/JPEG/PNG/WebP listing photos using a vendored SF3D producer served from `public/sf3d`, with weights streamed from a configurable, CORS-enabled URL. The feature is disabled unless `NEXT_PUBLIC_SF3D_ENABLED=true` and `NEXT_PUBLIC_SF3D_WEIGHTS_URL` are explicitly set. Inference never leaves the browser; only the finished GLB is uploaded through the existing owner-scoped Cloudinary raw path. Generated models re-use `ListingModel` and carry `sourceType=GENERATED`, `processingStatus`, source-image provenance, generator version, and a small run receipt. Buyers see an explicit "AI-generated 3D model" label and an approximation notice. Manual GLB/GLTF uploads remain `UPLOADED` and unchanged.
- **Consequences:** No server-side GPU, no paid API, no duplicate storage, and no change to photo tiers (ADR-016) or transient blending (ADR-017). The addition is one additive Prisma migration and a dynamically loaded browser adapter. Production release remains blocked until (a) legal clearance for the unlicensed upstream runtime is documented, (b) Stability AI revenue-eligibility is confirmed, and (c) the weight mirror's size/ETag are pinned. WebGPU absence, unsupported browsers, weight-check failure, generation failure, and licence non-acceptance all fail closed to the existing manual upload path. Generated geometry is an approximation and must never be presented as a measured scan or used to infer product specifications.
