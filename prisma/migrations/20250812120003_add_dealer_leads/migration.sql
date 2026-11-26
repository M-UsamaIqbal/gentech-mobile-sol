-- Add dealer lead tracking system

-- Create ENUM type for dealer lead status
CREATE TYPE "DealerLeadStatus" AS ENUM (
  'NEW',
  'CONTACTED',
  'NEGOTIATING',
  'SOLD',
  'LOST',
  'CLOSED'
);

-- Create DealerLead table
CREATE TABLE "dealer_lead" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT,
    "conversationId" TEXT,
    "status" "DealerLeadStatus" NOT NULL DEFAULT 'NEW',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_lead_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraints
ALTER TABLE "dealer_lead" ADD CONSTRAINT "dealer_lead_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dealer_lead" ADD CONSTRAINT "dealer_lead_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dealer_lead" ADD CONSTRAINT "dealer_lead_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "dealer_lead_dealerId_idx" ON "dealer_lead"("dealerId");
CREATE INDEX "dealer_lead_buyerId_idx" ON "dealer_lead"("buyerId");
CREATE INDEX "dealer_lead_listingId_idx" ON "dealer_lead"("listingId");
CREATE INDEX "dealer_lead_status_idx" ON "dealer_lead"("status");
CREATE INDEX "dealer_lead_createdAt_idx" ON "dealer_lead"("createdAt");

-- Create unique index on buyerId + conversationId to prevent duplicate leads
CREATE UNIQUE INDEX IF NOT EXISTS "dealer_lead_buyerId_conversationId_key" ON "dealer_lead"("buyerId", "conversationId");
