-- Align legacy production columns with the current Prisma schema.
-- All additions are nullable or backfilled; no existing data is removed.

ALTER TABLE "saved_search" ADD COLUMN IF NOT EXISTS "query" TEXT;

ALTER TABLE "conversation" ADD COLUMN IF NOT EXISTS "lastMessageAt" TIMESTAMP(3);

ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "body" TEXT;
ALTER TABLE "message" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "data" JSONB;
ALTER TABLE "notification" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

ALTER TABLE "report" ADD COLUMN IF NOT EXISTS "details" TEXT;
ALTER TABLE "report" ADD COLUMN IF NOT EXISTS "reportedUserId" TEXT;

ALTER TABLE "review" ADD COLUMN IF NOT EXISTS "listingId" TEXT;
ALTER TABLE "review" ADD COLUMN IF NOT EXISTS "targetUserId" TEXT;

-- Preserve legacy review targets.
UPDATE "review" SET "targetUserId" = "targetId" WHERE "targetUserId" IS NULL AND "targetId" IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'report_reportedUserId_fkey') THEN
    ALTER TABLE "report" ADD CONSTRAINT "report_reportedUserId_fkey"
      FOREIGN KEY ("reportedUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_listingId_fkey') THEN
    ALTER TABLE "review" ADD CONSTRAINT "review_listingId_fkey"
      FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_targetUserId_fkey') THEN
    ALTER TABLE "review" ADD CONSTRAINT "review_targetUserId_fkey"
      FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "review" WHERE "targetUserId" IS NULL) THEN
    ALTER TABLE "review" ALTER COLUMN "targetUserId" SET NOT NULL;
  END IF;
END $$;
