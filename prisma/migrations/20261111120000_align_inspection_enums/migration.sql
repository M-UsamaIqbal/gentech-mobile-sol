-- Align the inspection enums with the current Prisma schema and seed data.
-- Keep legacy values so existing reports remain valid.
ALTER TYPE "InspectionVerdict" ADD VALUE IF NOT EXISTS 'RECOMMENDED';
ALTER TYPE "InspectionVerdict" ADD VALUE IF NOT EXISTS 'RECOMMENDED_WITH_NOTES';
ALTER TYPE "InspectionVerdict" ADD VALUE IF NOT EXISTS 'NOT_RECOMMENDED';

ALTER TYPE "InspectionItemResult" ADD VALUE IF NOT EXISTS 'MINOR_ISSUE';
ALTER TYPE "InspectionItemResult" ADD VALUE IF NOT EXISTS 'MAJOR_ISSUE';
ALTER TYPE "InspectionItemResult" ADD VALUE IF NOT EXISTS 'NOT_APPLICABLE';
