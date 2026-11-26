CREATE INDEX CONCURRENTLY IF NOT EXISTS "message_conversationId_createdAt_idx" ON "message" ("conversationId", "createdAt");

