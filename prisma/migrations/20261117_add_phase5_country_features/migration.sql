-- Add region column to category table (country-specific categories).
ALTER TABLE "category" ADD COLUMN "region" "Region";

-- Add region column to promotion_plan table (country-specific promotions).
ALTER TABLE "promotion_plan" ADD COLUMN "region" "Region" NOT NULL DEFAULT 'PAKISTAN';

-- Create shipping_method table (country-specific shipping).
CREATE TABLE "shipping_method" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "region" "Region" NOT NULL DEFAULT 'PAKISTAN',
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "estimatedDays" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "shipping_method_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "shipping_method_region_isActive_idx" ON "shipping_method"("region", "isActive");

-- Create delivery_zone table (country-specific delivery zones).
CREATE TABLE "delivery_zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" "Region" NOT NULL DEFAULT 'PAKISTAN',
    "city" TEXT,
    "surcharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "codAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "delivery_zone_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "delivery_zone_region_isActive_idx" ON "delivery_zone"("region", "isActive");

-- Create seller_verification table (country-specific seller verification).
CREATE TABLE "seller_verification" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "region" "Region" NOT NULL DEFAULT 'PAKISTAN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documents" JSONB,
    "notes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "seller_verification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "seller_verification_sellerId_idx" ON "seller_verification"("sellerId");
CREATE INDEX "seller_verification_region_status_idx" ON "seller_verification"("region", "status");

-- Add foreign key for seller_verification.
ALTER TABLE "seller_verification" ADD CONSTRAINT "seller_verification_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;