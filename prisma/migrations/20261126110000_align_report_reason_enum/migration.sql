-- Align the report reason column with the canonical Prisma enum.
-- This is idempotent so it is safe on databases created from either migration lineage.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'ReportReason'
      AND typnamespace = 'public'::regnamespace
  ) THEN
    CREATE TYPE "ReportReason" AS ENUM (
      'SPAM',
      'SCAM_OR_FRAUD',
      'PROHIBITED_ITEM',
      'COUNTERFEIT',
      'OFFENSIVE',
      'WRONG_CATEGORY',
      'OTHER'
    );
  END IF;
END
$$;

DO $$
DECLARE
  column_type text;
BEGIN
  SELECT data_type
  INTO column_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'report'
    AND column_name = 'reason';

  IF column_type = 'text' THEN
    ALTER TABLE "report"
      ALTER COLUMN "reason" TYPE "ReportReason"
      USING CASE
        WHEN "reason" IN (
          'SPAM',
          'SCAM_OR_FRAUD',
          'PROHIBITED_ITEM',
          'COUNTERFEIT',
          'OFFENSIVE',
          'WRONG_CATEGORY',
          'OTHER'
        ) THEN "reason"::"ReportReason"
        ELSE 'OTHER'::"ReportReason"
      END;
  END IF;
END
$$;
