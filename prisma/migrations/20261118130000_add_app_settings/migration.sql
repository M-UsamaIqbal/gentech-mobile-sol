-- Admin-managed application settings. No destructive changes.
CREATE TABLE "app_setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "app_setting_pkey" PRIMARY KEY ("key")
);

-- Email verification is off by default; the admin panel can opt in.
INSERT INTO "app_setting" ("key", "value", "updatedAt")
VALUES ('EMAIL_VERIFICATION_REQUIRED', 'false'::jsonb, NOW())
ON CONFLICT ("key") DO NOTHING;
