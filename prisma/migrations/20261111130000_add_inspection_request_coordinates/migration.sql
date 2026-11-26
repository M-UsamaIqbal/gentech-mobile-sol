-- Add coordinates present in the Prisma schema but missing from the initial
-- inspection_request table. Existing requests keep NULL coordinates.
ALTER TABLE "inspection_request"
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
