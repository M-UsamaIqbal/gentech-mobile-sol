CREATE INDEX CONCURRENTLY IF NOT EXISTS "notification_userId_type_createdAt_idx" ON "notification" ("userId", "type", "createdAt");

