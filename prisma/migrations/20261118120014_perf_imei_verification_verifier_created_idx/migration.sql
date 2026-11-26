CREATE INDEX CONCURRENTLY IF NOT EXISTS "imei_verification_verifiedBy_createdAt_idx" ON "imei_verification" ("verifiedBy", "createdAt");

