CREATE INDEX CONCURRENTLY IF NOT EXISTS "order_region_status_createdAt_idx" ON "order" ("region", "status", "createdAt");

