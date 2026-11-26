-- Independent, nullable localization preferences on the authenticated user.
-- Existing rows stay on automatic detection until the user makes a selection.
ALTER TABLE "user" ADD COLUMN "preferredLocale" TEXT;
ALTER TABLE "user" ADD COLUMN "preferredCountry" TEXT;
