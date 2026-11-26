-- Add dealer system for professional sellers

-- Create ENUM types for dealer system
CREATE TYPE "DealerPlan" AS ENUM ('BASIC', 'PREMIUM', 'ENTERPRISE');
CREATE TYPE "DealerStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING', 'REJECTED');

-- Create Dealer table
CREATE TABLE "dealer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "businessName" TEXT,
    "businessType" TEXT,
    "taxNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "city" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" "DealerStatus" NOT NULL DEFAULT 'PENDING',
    "plan" "DealerPlan" NOT NULL DEFAULT 'BASIC',
    "planExpiresAt" TIMESTAMP(3),
    "featuredUntil" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "listingCount" INTEGER NOT NULL DEFAULT 0,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_pkey" PRIMARY KEY ("id")
);

-- Create unique index on slug
CREATE UNIQUE INDEX "dealer_slug_key" ON "dealer"("slug");

-- Create DealerUser table
CREATE TABLE "dealer_user" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_user_pkey" PRIMARY KEY ("id")
);

-- Create unique index on dealerId + userId
CREATE UNIQUE INDEX "dealer_user_dealerId_userId_key" ON "dealer_user"("dealerId", "userId");

-- Create DealerBranch table
CREATE TABLE "dealer_branch" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_branch_pkey" PRIMARY KEY ("id")
);

-- Create DealerInventory table
CREATE TABLE "dealer_inventory" (
    "id" TEXT NOT NULL,
    "dealerId" TEXT NOT NULL,
    "listingId" TEXT,
    "sku" TEXT,
    "stockCount" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "costPrice" DECIMAL(12,2),
    "acquiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dealer_inventory_pkey" PRIMARY KEY ("id")
);

-- Create unique index on listingId
CREATE UNIQUE INDEX "dealer_inventory_listingId_key" ON "dealer_inventory"("listingId");

-- Create unique index on sku
CREATE UNIQUE INDEX "dealer_inventory_sku_key" ON "dealer_inventory"("sku");

-- Add dealerId column to listing table
ALTER TABLE "listing" ADD COLUMN "dealerId" TEXT;

-- Create foreign key constraints
ALTER TABLE "dealer_user" ADD CONSTRAINT "dealer_user_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dealer_user" ADD CONSTRAINT "dealer_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dealer_branch" ADD CONSTRAINT "dealer_branch_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dealer_inventory" ADD CONSTRAINT "dealer_inventory_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dealer_inventory" ADD CONSTRAINT "dealer_inventory_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "listing" ADD CONSTRAINT "listing_dealerId_fkey" FOREIGN KEY ("dealerId") REFERENCES "dealer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "dealer_status_idx" ON "dealer"("status");
CREATE INDEX "dealer_plan_idx" ON "dealer"("plan");
CREATE INDEX "dealer_isVerified_idx" ON "dealer"("isVerified");
CREATE INDEX "dealer_city_idx" ON "dealer"("city");
CREATE INDEX "dealer_user_userId_idx" ON "dealer_user"("userId");
CREATE INDEX "dealer_user_dealerId_idx" ON "dealer_user"("dealerId");
CREATE INDEX "dealer_branch_dealerId_idx" ON "dealer_branch"("dealerId");
CREATE INDEX "dealer_branch_city_idx" ON "dealer_branch"("city");
CREATE INDEX "dealer_inventory_dealerId_idx" ON "dealer_inventory"("dealerId");
CREATE INDEX "dealer_inventory_listingId_idx" ON "dealer_inventory"("listingId");
CREATE INDEX "dealer_inventory_sku_idx" ON "dealer_inventory"("sku");
CREATE INDEX "listing_dealerId_idx" ON "listing"("dealerId");

-- Add relation to User model for dealer users
-- Note: This would be handled by Prisma when the schema is updated
