CREATE INDEX CONCURRENTLY IF NOT EXISTS "inspection_request_requesterId_createdAt_idx" ON "inspection_request" ("requesterId", "createdAt");

