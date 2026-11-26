-- Additive only: existing rows remain phone inspections.
ALTER TABLE "inspection_request" ADD COLUMN IF NOT EXISTS "inspectionKind" TEXT;

-- Backfill legacy laptop requests from their listing category so the correct
-- checklist is shown even when the new column was never written explicitly.
UPDATE "inspection_request" AS ir
SET "inspectionKind" = 'LAPTOP'
FROM "listing" AS l
JOIN "category" AS c ON c."id" = l."categoryId"
WHERE ir."listingId" = l."id"
  AND ir."inspectionKind" IS NULL
  AND c."slug" IN ('laptops', 'laptops-tablets');
