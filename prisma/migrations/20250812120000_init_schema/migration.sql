-- Initial schema migration for GenTech Marketplace
-- This migration creates the base database structure for the mobile phone marketplace

-- Enable UUID extension if needed (PostgreSQL)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE "Role" AS ENUM ('USER', 'INSPECTOR', 'ADMIN');
CREATE TYPE "ListingCondition" AS ENUM ('NEW', 'OPEN_BOX', 'USED', 'REFURBISHED', 'FOR_PARTS');
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'EXPIRED', 'REMOVED');
CREATE TYPE "InspectionStatus" AS ENUM ('REQUESTED', 'PAYMENT_PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "InspectionPaymentStatus" AS ENUM ('UNPAID', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "InspectionVerdict" AS ENUM ('VERIFIED', 'GOOD', 'WARNING', 'FAILED', 'NOT_CHECKED');
CREATE TYPE "InspectionItemResult" AS ENUM ('PASS', 'FAIL', 'WARNING', 'NOT_CHECKED');
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'CLOSED', 'BLOCKED');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "NotificationType" AS ENUM ('LISTING_APPROVED', 'LISTING_REJECTED', 'NEW_MESSAGE', 'FAVORITE_PRICE_CHANGED', 'SAVED_SEARCH_MATCH', 'LISTING_EXPIRING', 'PROMOTION_ACTIVATED', 'INSPECTION_COMPLETED', 'VERIFICATION_COMPLETED', 'DEALER_LEAD_RECEIVED', 'INSPECTION_SCHEDULED');
CREATE TYPE "PaymentMethod" AS ENUM ('JAZZCASH', 'EASYPAISA', 'BANK_TRANSFER', 'CREDIT_CARD', 'CASH');

-- Create User table (Better Auth core model)
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- Create Session table
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- Create unique index on token
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- Create Account table
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- Create unique index on providerId + accountId
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- Create Verification table
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- Create Profile table
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "phone" TEXT,
    "coverImage" TEXT,
    "city" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- Create unique index on userId
CREATE UNIQUE INDEX "profile_userId_key" ON "profile"("userId");

-- Create Category table
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- Create unique index on slug
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- Create Brand table
CREATE TABLE "brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- Create unique index on name
CREATE UNIQUE INDEX "brand_name_key" ON "brand"("name");

-- Create unique index on slug
CREATE UNIQUE INDEX "brand_slug_key" ON "brand"("slug");

-- Create Listing table
CREATE TABLE "listing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "condition" "ListingCondition" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "attributes" JSONB,
    "videoUrl" TEXT,
    "searchVector" TSVECTOR,
    "city" TEXT,
    "area" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" TIMESTAMP(3),
    "sellerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "soldAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "listing_pkey" PRIMARY KEY ("id")
);

-- Create unique index on slug
CREATE UNIQUE INDEX "listing_slug_key" ON "listing"("slug");

-- Create ListingImage table
CREATE TABLE "listing_image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "blurDataUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_image_pkey" PRIMARY KEY ("id")
);

-- Create Favorite table
CREATE TABLE "favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_pkey" PRIMARY KEY ("id")
);

-- Create unique index on userId + listingId
CREATE UNIQUE INDEX "favorite_userId_listingId_key" ON "favorite"("userId", "listingId");

-- Create SavedSearch table
CREATE TABLE "saved_search" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "name" TEXT,
    "notifyOnMatch" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_search_pkey" PRIMARY KEY ("id")
);

-- Create Conversation table
CREATE TABLE "conversation" (
    "id" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- Create Message table
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- Create Review table
CREATE TABLE "review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- Create Report table
CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "reporterId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- Create Notification table
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "url" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "email" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- Create InspectionPlan table
CREATE TABLE "inspection_plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "checkpoints" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_plan_pkey" PRIMARY KEY ("id")
);

-- Create unique index on slug
CREATE UNIQUE INDEX "inspection_plan_slug_key" ON "inspection_plan"("slug");

-- Create InspectionRequest table
CREATE TABLE "inspection_request" (
    "id" TEXT NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'REQUESTED',
    "planId" TEXT,
    "planName" TEXT,
    "feeAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "paymentStatus" "InspectionPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentMethod" "PaymentMethod",
    "paymentRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "deviceInfo" JSONB,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "city" TEXT,
    "area" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "preferredAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "requesterId" TEXT NOT NULL,
    "inspectorId" TEXT,
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_request_pkey" PRIMARY KEY ("id")
);

-- Create InspectionReport table
CREATE TABLE "inspection_report" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "grade" TEXT,
    "verdict" "InspectionVerdict" NOT NULL,
    "summary" TEXT,
    "imei" TEXT,
    "ptaApproved" BOOLEAN,
    "batteryHealth" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_report_pkey" PRIMARY KEY ("id")
);

-- Create unique index on requestId
CREATE UNIQUE INDEX "inspection_report_requestId_key" ON "inspection_report"("requestId");

-- Create InspectionReportItem table
CREATE TABLE "inspection_report_item" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "result" "InspectionItemResult" NOT NULL DEFAULT 'PASS',
    "score" INTEGER,
    "comment" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "reportId" TEXT NOT NULL,

    CONSTRAINT "inspection_report_item_pkey" PRIMARY KEY ("id")
);

-- Create InspectionPhoto table
CREATE TABLE "inspection_photo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "blurDataUrl" TEXT,
    "caption" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "reportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_photo_pkey" PRIMARY KEY ("id")
);

-- Create AuditLog table
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- Create foreign key constraints
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "listing" ADD CONSTRAINT "listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing" ADD CONSTRAINT "listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "listing" ADD CONSTRAINT "listing_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "listing_image" ADD CONSTRAINT "listing_image_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_search" ADD CONSTRAINT "saved_search_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review" ADD CONSTRAINT "review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review" ADD CONSTRAINT "review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report" ADD CONSTRAINT "report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "report" ADD CONSTRAINT "report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "report" ADD CONSTRAINT "report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspection_request" ADD CONSTRAINT "inspection_request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspection_request" ADD CONSTRAINT "inspection_request_inspectorId_fkey" FOREIGN KEY ("inspectorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inspection_request" ADD CONSTRAINT "inspection_request_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inspection_request" ADD CONSTRAINT "inspection_request_planId_fkey" FOREIGN KEY ("planId") REFERENCES "inspection_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inspection_report" ADD CONSTRAINT "inspection_report_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "inspection_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspection_report_item" ADD CONSTRAINT "inspection_report_item_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "inspection_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspection_photo" ADD CONSTRAINT "inspection_photo_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "inspection_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "user_role_idx" ON "user"("role");
CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");
CREATE INDEX "category_parentId_idx" ON "category"("parentId");
CREATE INDEX "category_isActive_idx" ON "category"("isActive");
CREATE INDEX "listing_status_createdAt_idx" ON "listing"("status", "createdAt");
CREATE INDEX "listing_categoryId_status_idx" ON "listing"("categoryId", "status");
CREATE INDEX "listing_brandId_idx" ON "listing"("brandId");
CREATE INDEX "listing_sellerId_idx" ON "listing"("sellerId");
CREATE INDEX "listing_isFeatured_status_idx" ON "listing"("isFeatured", "status");
CREATE INDEX "listing_city_idx" ON "listing"("city");
CREATE INDEX "listing_searchVector_idx" ON "listing" USING GIN ("searchVector");
CREATE INDEX "listing_image_listingId_idx" ON "listing_image"("listingId");
CREATE INDEX "favorite_userId_idx" ON "favorite"("userId");
CREATE INDEX "saved_search_userId_idx" ON "saved_search"("userId");
CREATE INDEX "conversation_buyerId_idx" ON "conversation"("buyerId");
CREATE INDEX "conversation_sellerId_idx" ON "conversation"("sellerId");
CREATE INDEX "conversation_listingId_idx" ON "conversation"("listingId");
CREATE INDEX "message_senderId_idx" ON "message"("senderId");
CREATE INDEX "message_conversationId_idx" ON "message"("conversationId");
CREATE INDEX "review_authorId_idx" ON "review"("authorId");
CREATE INDEX "review_targetId_idx" ON "review"("targetId");
CREATE INDEX "report_reporterId_idx" ON "report"("reporterId");
CREATE INDEX "report_targetUserId_idx" ON "report"("targetUserId");
CREATE INDEX "report_listingId_idx" ON "report"("listingId");
CREATE INDEX "notification_userId_idx" ON "notification"("userId");
CREATE INDEX "inspection_plan_position_idx" ON "inspection_plan"("position");
CREATE INDEX "inspection_plan_price_idx" ON "inspection_plan"("price");
CREATE INDEX "inspection_request_requesterId_idx" ON "inspection_request"("requesterId");
CREATE INDEX "inspection_request_inspectorId_idx" ON "inspection_request"("inspectorId");
CREATE INDEX "inspection_request_listingId_idx" ON "inspection_request"("listingId");
CREATE INDEX "inspection_request_planId_idx" ON "inspection_request"("planId");
CREATE INDEX "inspection_request_status_scheduledAt_idx" ON "inspection_request"("status", "scheduledAt");
CREATE INDEX "inspection_report_verdict_idx" ON "inspection_report"("verdict");
CREATE INDEX "inspection_report_item_reportId_idx" ON "inspection_report_item"("reportId");
CREATE INDEX "inspection_photo_reportId_idx" ON "inspection_photo"("reportId");
CREATE INDEX "audit_log_actorId_idx" ON "audit_log"("actorId");
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");
CREATE INDEX "audit_log_resource_resourceId_idx" ON "audit_log"("resource", "resourceId");
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");
