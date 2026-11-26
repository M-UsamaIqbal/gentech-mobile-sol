CREATE INDEX CONCURRENTLY IF NOT EXISTS "listing_region_status_createdAt_idx" ON "listing" ("region", "status", "createdAt");

