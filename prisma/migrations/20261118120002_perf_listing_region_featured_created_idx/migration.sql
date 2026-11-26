CREATE INDEX CONCURRENTLY IF NOT EXISTS "listing_region_isFeatured_createdAt_idx" ON "listing" ("region", "isFeatured", "createdAt");

