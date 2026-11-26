-- Add Region enum for multi-tenant data isolation (Bahrain / Pakistan).
CREATE TYPE "Region" AS ENUM ('BAHRAIN', 'PAKISTAN');

-- Add region column to user table.
ALTER TABLE "user" ADD COLUMN "region" "Region" NOT NULL DEFAULT 'PAKISTAN';

-- Add region column to profile table.
ALTER TABLE "profile" ADD COLUMN "region" "Region" NOT NULL DEFAULT 'PAKISTAN';

-- Add region column to listing table.
ALTER TABLE "listing" ADD COLUMN "region" "Region" NOT NULL DEFAULT 'PAKISTAN';

-- Add region column to dealer table.
ALTER TABLE "dealer" ADD COLUMN "region" "Region" NOT NULL DEFAULT 'PAKISTAN';

-- Add region column to imei_verification table.
ALTER TABLE "imei_verification" ADD COLUMN "region" "Region" NOT NULL DEFAULT 'PAKISTAN';