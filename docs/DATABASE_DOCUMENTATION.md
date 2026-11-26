# GenTech Marketplace — Database Documentation

## 1. ORM Configuration
- **Prisma 7:** Datasource provider PostgreSQL; driver adapter `@prisma/adapter-pg` over pooled connection string. Direct connection URL used for migrations.
- **Client Output:** Directed to `lib/generated/prisma`.

## 2. Core Relational Entities
1. **Identity & Access (`user`, `session`, `account`, `verification`, `profile`):**
   - Better Auth managed tables. Extended with application fields: `role` (enum: `USER`, `INSPECTOR`, `ADMIN`), `banned`, `banReason`, `deletedAt`.
2. **Catalog & Taxonomy (`category`, `brand`, `phone_model`):**
   - `category`: Recursive tree (`parentId`) for taxonomy.
   - `brand`: Manufacturer definitions (`name`, `slug`, `logo`, `isActive`).
   - `phone_model`: Device specifications (`brandId`, `ramOptions`, `storageOptions`, `displaySize`, `processor`, `mainCamera`, `batteryCapacity`, `colors`).
3. **Listings & Media (`listing`, `listing_image`):**
   - `listing`: Core ad entity with Decimal pricing, JSON attributes, full-text `tsvector` search, city/area display snapshots, and relations to seller, category, brand, and dealer.
4. **Location Taxonomy (`country`, `city`, `area`):**
   - Countries contain managed cities; cities contain managed areas. Active countries, cities, and areas are used by listing, search, and inspection location selectors.
   - Listings and inspection requests retain their city/area text snapshots while optional foreign keys connect them to managed locations. Removing a location clears only the reference, not the historical display text.
5. **Dealer Network (`dealer`, `dealer_user`, `dealer_branch`, `dealer_inventory`, `dealer_lead`):**
   - Multi-tenant dealer stores with staff assignments, branch locations, and lead pipelines.
6. **Inspections (`inspection_plan`, `inspection_request`, `inspection_report`, `inspection_report_item`):**
   - Graded checkpoints for physical phone verification.
7. **Audit & Safety (`audit_log`, `report`, `imei_verification`):**
   - Tracking sensitive administrative actions, user disputes, and hardware verification checks.
