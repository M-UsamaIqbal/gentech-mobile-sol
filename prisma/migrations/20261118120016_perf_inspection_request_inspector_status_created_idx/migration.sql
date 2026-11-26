CREATE INDEX CONCURRENTLY IF NOT EXISTS "inspection_request_inspectorId_status_createdAt_idx" ON "inspection_request" ("inspectorId", "status", "createdAt");

