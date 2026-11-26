-- Migration: Add Listing Approval Workflow
-- Adds PENDING_APPROVAL and REJECTED states to ListingStatus enum
-- Adds rejectionReason, reviewedAt, reviewedById fields to listing table

-- Step 1: Add new enum values to ListingStatus
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Step 2: Add approval workflow columns to listing table
ALTER TABLE "listing"
  ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;

