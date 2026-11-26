CREATE INDEX CONCURRENTLY IF NOT EXISTS "seller_verification_sellerId_region_createdAt_idx" ON "seller_verification" ("sellerId", "region", "createdAt");

