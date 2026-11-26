CREATE INDEX CONCURRENTLY IF NOT EXISTS "notification_userId_readAt_idx" ON "notification" ("userId", "readAt");

