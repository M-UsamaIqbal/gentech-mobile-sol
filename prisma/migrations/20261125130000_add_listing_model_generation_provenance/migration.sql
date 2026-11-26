-- Additive provenance and processing status for optional listing 3D models.

ALTER TABLE "listing_model"
  ADD COLUMN IF NOT EXISTS "sourceType" TEXT NOT NULL DEFAULT 'UPLOADED',
  ADD COLUMN IF NOT EXISTS "processingStatus" TEXT NOT NULL DEFAULT 'READY',
  ADD COLUMN IF NOT EXISTS "sourceImageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceImagePublicId" TEXT,
  ADD COLUMN IF NOT EXISTS "generator" TEXT,
  ADD COLUMN IF NOT EXISTS "generatorVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "generationReceipt" JSONB;
