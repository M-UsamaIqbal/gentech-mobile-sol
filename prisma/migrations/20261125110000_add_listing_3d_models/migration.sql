-- Optional seller-supplied GLB/GLTF model. Image records are untouched and
-- remain the primary product media for every listing.
CREATE TABLE IF NOT EXISTS "listing_model" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "assets" JSONB,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "listing_model_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "listing_model_listingId_key" ON "listing_model"("listingId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'listing_model_listingId_fkey'
    ) THEN
        ALTER TABLE "listing_model"
        ADD CONSTRAINT "listing_model_listingId_fkey"
        FOREIGN KEY ("listingId") REFERENCES "listing"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
