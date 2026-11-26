CREATE INDEX CONCURRENTLY IF NOT EXISTS "order_customerId_createdAt_idx" ON "order" ("customerId", "createdAt");

