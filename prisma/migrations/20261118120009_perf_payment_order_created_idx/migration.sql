CREATE INDEX CONCURRENTLY IF NOT EXISTS "payment_orderId_createdAt_idx" ON "payment" ("orderId", "createdAt");

