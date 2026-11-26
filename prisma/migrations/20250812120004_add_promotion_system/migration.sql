-- Add promotion system for monetization

-- Create ENUM types for promotion system
CREATE TYPE "PromotionPlacement" AS ENUM (
  'FEATURED',
  'BOOSTED',
  'TOP_SEARCH',
  'CATEGORY_FEATURED',
  'HOMEPAGE_FEATURED'
);

CREATE TYPE "PromotionStatus" AS ENUM (
  'ACTIVE',
  'PAUSED',
  'EXPIRED',
  'CANCELLED'
);

-- Create PromotionPlan table
CREATE TABLE "promotion_plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "placement" "PromotionPlacement" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "durationDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxSlots" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_plan_pkey" PRIMARY KEY ("id")
);

-- Create unique index on slug
CREATE UNIQUE INDEX "promotion_plan_slug_key" ON "promotion_plan"("slug");

-- Create indexes for performance
CREATE INDEX "promotion_plan_placement_idx" ON "promotion_plan"("placement");
CREATE INDEX "promotion_plan_isActive_idx" ON "promotion_plan"("isActive");

-- Create ListingPromotion table
CREATE TABLE "listing_promotion" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_promotion_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraints
ALTER TABLE "listing_promotion" ADD CONSTRAINT "listing_promotion_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_promotion" ADD CONSTRAINT "listing_promotion_planId_fkey" FOREIGN KEY ("planId") REFERENCES "promotion_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "listing_promotion_listingId_idx" ON "listing_promotion"("listingId");
CREATE INDEX "listing_promotion_planId_idx" ON "listing_promotion"("planId");
CREATE INDEX "listing_promotion_status_idx" ON "listing_promotion"("status");
CREATE INDEX "listing_promotion_expiresAt_idx" ON "listing_promotion"("expiresAt");

-- Create PromotionPayment table
CREATE TABLE "promotion_payment" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "transactionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_payment_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraint
ALTER TABLE "promotion_payment" ADD CONSTRAINT "promotion_payment_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "listing_promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "promotion_payment_promotionId_idx" ON "promotion_payment"("promotionId");
CREATE INDEX "promotion_payment_status_idx" ON "promotion_payment"("status");
