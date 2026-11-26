# GenTech Marketplace — Project Roadmap

## Vision

To develop a high-trust, mobile-first classified marketplace for mobile phones in Pakistan and emerging markets, combining the frictionless listing experience of OLX with the trust, inspection, and verification standards of PakWheels.

---

## Roadmap Phases

### Milestone 1 — Core Marketplace Foundation

- **Objective:** Give administrators complete control over the catalog, approval lifecycle, and taxonomy without editing source code.
- **Key Deliverables:**
  1. **Brand Management UI (`/admin/brands`):** Full CRUD for mobile brands (Apple, Samsung, Xiaomi, etc.) with position ordering and active toggling.
  2. **Model & Specification Manager (`/admin/models`):** Full CRUD for phone models with official specifications (Display, Processor, Cameras, Battery, RAM variants, Storage variants, Colors).
  3. **Listing Approval & Rejection Workflow:**
     - Transition state machine: `DRAFT` → `PENDING_APPROVAL` → `ACTIVE` / `REJECTED`.
     - Admin review queue with one-click approve and structured rejection reasons.
     - Audit logging for reviewer and timestamps.
  4. **Location Taxonomy:**
     - Dynamic City and Area hierarchy for filtering and listing submission.
  5. **Admin Dashboard Analytics:**
     - Real-time counts for pending approvals, active ads, rejected ads, and brand distributions.

### Milestone 2 — Dealer Storefronts & Inventory

- **Objective:** Onboard professional mobile retailers.
- **Key Deliverables:**
  1. Dealer registration and business verification pipeline.
  2. Multi-branch management with dedicated staff logins.
  3. Bulk inventory feeds and dealer leads tracker.

### Milestone 3 — Monetization & Payment Processing (Paused)

- **Objective:** Generate revenue through value-added seller promotions and dealer plans.
- **Key Deliverables:**
  1. Paid listing promotions (Silver, Gold, Platinum packages).
  2. PayFast direct API integration for inspection payments (JazzCash, Easypaisa, cards); promotion checkout remains gated until connected to verified payment processing.
  3. Automated transaction ledger and invoice generation.
- **Pause note:** M3-F02 inspection payment code is implemented, but sandbox/3-D Secure and merchant compliance verification require external PayFast access. Live mode and promotion payments remain disabled.

### Milestone 4 — Buyer Experience & Discovery (Complete)

- **Objective:** Maximize buyer conversion and seamless mobile search.
- **Key Deliverables:**
  1. Dynamic multi-attribute search (storage, RAM, color, battery health, PTA/CPID, warranty, inspection, seller/dealer trust, price, and city). **M4-F01 verified.**
  2. WhatsApp direct seller contact button with prefilled listing context. **M4-F02 verified.**
  3. In-app messaging with image sharing, typing indicators, and read receipts. **M4-F02 verified.**
  4. Persistent favorites and saved search alert notifications. **M4-F03 verified.**

### Milestone 5 — Trust & Phone Intelligence (Current Priority)

- **Objective:** Differentiate from generic classifieds through proprietary phone intelligence.
- **Key Deliverables:**
  1. Real-time price valuation based on live active and sold market data.
  2. PTA & CPID verification checks with security risk badges. **M5-F02 simulator + provider abstraction verified; real PTA DIRBS/CPID adapter remains pending provider credentials.**
  3. Interactive side-by-side spec comparison table.
  4. In-person physical inspection scheduling and graded trust reports (**M5-F04 verified** — payment-gated release, graded checklist, publishable listing report).
