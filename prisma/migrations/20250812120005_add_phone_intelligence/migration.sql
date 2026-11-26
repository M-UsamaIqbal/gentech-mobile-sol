-- Create Phone Intelligence Platform tables
-- Phase 9: Phone Models, Reviews, Comparisons, Valuations, IMEI Verification

-- PhoneModel table
CREATE TABLE "phone_model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "modelNumber" TEXT,
    "releaseDate" TIMESTAMP(3),
    "launchPrice" DECIMAL(12,2),
    "displaySize" TEXT,
    "displayResolution" TEXT,
    "displayType" TEXT,
    "refreshRate" TEXT,
    "processor" TEXT,
    "cpuCores" INTEGER,
    "gpu" TEXT,
    "ramOptions" TEXT[],
    "storageOptions" TEXT[],
    "mainCamera" TEXT,
    "selfieCamera" TEXT,
    "cameraFeatures" TEXT[],
    "batteryCapacity" TEXT,
    "batteryType" TEXT,
    "chargingSpeed" TEXT,
    "networkSupport" TEXT[],
    "simType" TEXT,
    "wifi" TEXT,
    "bluetooth" TEXT,
    "nfc" BOOLEAN NOT NULL DEFAULT false,
    "weight" TEXT,
    "dimensions" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "features" TEXT[],
    "colors" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isUpcoming" BOOLEAN NOT NULL DEFAULT false,
    "launchStatus" TEXT,
    "imageUrl" TEXT,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_model_pkey" PRIMARY KEY ("id")
);

-- PhoneModelReview table
CREATE TABLE "phone_model_review" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "pros" TEXT[],
    "cons" TEXT[],
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_model_review_pkey" PRIMARY KEY ("id")
);

-- PhoneComparison table
CREATE TABLE "phone_comparison" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phoneIds" TEXT[] NOT NULL,
    "phoneSpecs" JSONB,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_comparison_pkey" PRIMARY KEY ("id")
);

-- PhoneValuation table
CREATE TABLE "phone_valuation" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "storage" TEXT,
    "ram" TEXT,
    "condition" TEXT,
    "batteryHealth" INTEGER,
    "estimatedPriceMin" DECIMAL(12,2) NOT NULL,
    "estimatedPriceMax" DECIMAL(12,2) NOT NULL,
    "estimatedPriceAvg" DECIMAL(12,2) NOT NULL,
    "marketData" JSONB,
    "sampleCount" INTEGER,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_valuation_pkey" PRIMARY KEY ("id")
);

-- ImeiVerification table
CREATE TABLE "imei_verification" (
    "id" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "ptaStatus" TEXT,
    "cpidStatus" TEXT,
    "isStolen" BOOLEAN NOT NULL DEFAULT false,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "deviceModel" TEXT,
    "deviceBrand" TEXT,
    "deviceColor" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationSource" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imei_verification_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "phone_model_brandId_idx" ON "phone_model"("brandId");
CREATE INDEX "phone_model_isActive_idx" ON "phone_model"("isActive");
CREATE INDEX "phone_model_isUpcoming_idx" ON "phone_model"("isUpcoming");
CREATE INDEX "phone_model_slug_idx" ON "phone_model"("slug");

CREATE INDEX "phone_model_review_modelId_idx" ON "phone_model_review"("modelId");
CREATE INDEX "phone_model_review_userId_idx" ON "phone_model_review"("userId");
CREATE INDEX "phone_model_review_isApproved_idx" ON "phone_model_review"("isApproved");

CREATE INDEX "phone_comparison_userId_idx" ON "phone_comparison"("userId");
CREATE INDEX "phone_comparison_sessionId_idx" ON "phone_comparison"("sessionId");

CREATE INDEX "phone_valuation_modelId_idx" ON "phone_valuation"("modelId");
CREATE INDEX "phone_valuation_storage_ram_condition_idx" ON "phone_valuation"("storage", "ram", "condition");

CREATE INDEX "imei_verification_imei_idx" ON "imei_verification"("imei");
CREATE INDEX "imei_verification_ptaStatus_idx" ON "imei_verification"("ptaStatus");
CREATE INDEX "imei_verification_cpidStatus_idx" ON "imei_verification"("cpidStatus");
CREATE INDEX "imei_verification_isStolen_idx" ON "imei_verification"("isStolen");
CREATE INDEX "imei_verification_isBlacklisted_idx" ON "imei_verification"("isBlacklisted");

-- Add foreign key constraints
ALTER TABLE "phone_model" ADD CONSTRAINT "phone_model_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "phone_model_review" ADD CONSTRAINT "phone_model_review_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "phone_model"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "phone_model_review" ADD CONSTRAINT "phone_model_review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "phone_comparison" ADD CONSTRAINT "phone_comparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "phone_valuation" ADD CONSTRAINT "phone_valuation_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "phone_model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraints
ALTER TABLE "phone_model" ADD CONSTRAINT "phone_model_slug_key" UNIQUE ("slug");
ALTER TABLE "imei_verification" ADD CONSTRAINT "imei_verification_imei_key" UNIQUE ("imei");
