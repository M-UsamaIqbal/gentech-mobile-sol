# GenTech Marketplace — Business Requirements Specification (SRS)

## 1. Executive Summary
GenTech is an online classifieds marketplace platform tuned specifically for the mobile phone ecosystem in Pakistan (with architecture flexible enough to expand to other emerging markets and electronics verticals).

## 2. Stakeholders & User Roles
1. **Buyers:**
   - Search, filter, and compare phone models by specs (RAM, storage, PTA status, condition).
   - Verify phone IMEI status and price reasonableness before initiating contact.
   - Contact sellers via in-platform messaging or direct WhatsApp.
   - Request professional physical device inspection.
2. **Individual Sellers:**
   - Post phone listings with structured specs, condition, PTA status, warranty, and photos.
   - Manage ads (mark as sold, edit price, promote).
3. **Dealers / Mobile Shops:**
   - Manage dedicated dealer storefront with verified badges, multiple physical branches, and inventory counts.
   - Capture buyer leads directly from listings.
4. **Inspectors:**
   - Perform standardized pre-purchase physical checks (screen, battery, camera, body, motherboard).
   - Issue graded digital inspection reports.
5. **Administrators & Moderators:**
   - Maintain brand and phone model specifications catalog without touching source code.
   - Review incoming listings (Approve/Reject with specific policy reasons).
   - Moderate reports, disputes, and banned accounts.

## 3. Product Features & Business Rules
- **No Hardcoding:** All brand lists, phone models, variants, and categories must be fetched dynamically from the database.
- **PTA & Regulatory Compliance:**
  - Every phone ad must specify PTA approval status (`PTA_APPROVED`, `NON_PTA`, `CPID`).
- **Inspection Service Model:**
  - 3-tier inspection packages (Basic, Comprehensive, Premium) providing graded scores (0–100) and buy recommendations (`RECOMMENDED`, `RECOMMENDED_WITH_NOTES`, `NOT_RECOMMENDED`).
- **Listing Lifecycle:**
  - Ads submitted by unverified users enter `PENDING_APPROVAL` before displaying in public search feeds.
  - Expired listings can be renewed by sellers.

