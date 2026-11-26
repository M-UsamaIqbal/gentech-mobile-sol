-- CreateEnum
CREATE TYPE "QuotePtaStatus" AS ENUM ('PTA', 'NON_PTA', 'PATCHED', 'JV');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'ACCEPTED', 'INSPECTED', 'PAID');

-- CreateEnum
CREATE TYPE "QuoteInspectionResult" AS ENUM ('MATCH', 'MISMATCH');

-- CreateTable
CREATE TABLE "quote_price_book" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "ptaStatus" "QuotePtaStatus" NOT NULL,
    "basePricePkr" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_price_book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deduction_rule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountPkr" DECIMAL(12,2),
    "percent" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deduction_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_setting" (
    "key" TEXT NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "label" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "quote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "storage" TEXT NOT NULL,
    "ptaStatus" "QuotePtaStatus" NOT NULL,
    "basePricePkr" DECIMAL(12,2) NOT NULL,
    "answers" JSONB NOT NULL,
    "photoUrls" JSONB NOT NULL,
    "aiGrade" TEXT,
    "aiDefects" JSONB,
    "aiFlags" JSONB,
    "aiConfidence" DECIMAL(4,3),
    "gradeMultiplier" DECIMAL(6,4) NOT NULL,
    "deductions" JSONB NOT NULL,
    "priceMin" DECIMAL(12,2) NOT NULL,
    "priceMax" DECIMAL(12,2) NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'ACTIVE',
    "pickupAddress" TEXT,
    "pickupSlot" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "inspectionResult" "QuoteInspectionResult",
    "inspectionReason" TEXT,
    "adjustedPricePkr" DECIMAL(12,2),
    "inspectedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quote_price_book_brand_model_idx" ON "quote_price_book"("brand", "model");

-- CreateIndex
CREATE INDEX "quote_price_book_isActive_idx" ON "quote_price_book"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "quote_price_book_brand_model_storage_ptaStatus_key" ON "quote_price_book"("brand", "model", "storage", "ptaStatus");

-- CreateIndex
CREATE UNIQUE INDEX "deduction_rule_key_key" ON "deduction_rule"("key");

-- CreateIndex
CREATE INDEX "deduction_rule_isActive_idx" ON "deduction_rule"("isActive");

-- CreateIndex
CREATE INDEX "quote_userId_status_idx" ON "quote"("userId", "status");

-- CreateIndex
CREATE INDEX "quote_status_validUntil_idx" ON "quote"("status", "validUntil");

-- CreateIndex
CREATE INDEX "quote_createdAt_idx" ON "quote"("createdAt");

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "quote_price_book"("id") ON DELETE SET NULL ON UPDATE CASCADE;
