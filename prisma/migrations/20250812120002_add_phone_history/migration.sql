-- Add phone history foundation for tracking device lifecycle events

-- Create ENUM type for phone history event types
CREATE TYPE "PhoneHistoryEventType" AS ENUM (
  'INSPECTION',
  'VERIFICATION',
  'WARRANTY_CLAIM',
  'REPAIR',
  'BATTERY_REPLACEMENT',
  'SCREEN_REPLACEMENT',
  'OTHER_REPAIR',
  'STATUS_CHANGE'
);

-- Create PhoneHistory table
CREATE TABLE "phone_history" (
    "id" TEXT NOT NULL,
    "listingId" TEXT,
    "eventType" "PhoneHistoryEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT,
    "metadata" JSONB,
    "source" TEXT,
    "sourceId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_history_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraint for listing
ALTER TABLE "phone_history" ADD CONSTRAINT "phone_history_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "phone_history_listingId_idx" ON "phone_history"("listingId");
CREATE INDEX "phone_history_eventType_idx" ON "phone_history"("eventType");
CREATE INDEX "phone_history_occurredAt_idx" ON "phone_history"("occurredAt");
CREATE INDEX "phone_history_source_sourceId_idx" ON "phone_history"("source", "sourceId");

-- Add relation to Listing model
-- Note: This would be handled by Prisma when the schema is updated
