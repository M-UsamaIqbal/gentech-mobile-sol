CREATE TABLE "country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "country_name_key" ON "country"("name");
CREATE UNIQUE INDEX "country_slug_key" ON "country"("slug");
CREATE UNIQUE INDEX "country_code_key" ON "country"("code");
CREATE INDEX "country_isActive_position_idx" ON "country"("isActive", "position");

INSERT INTO "country" ("id", "name", "slug", "code", "position", "updatedAt")
VALUES ('country-pakistan', 'Pakistan', 'pakistan', 'PK', 0, CURRENT_TIMESTAMP);

ALTER TABLE "city" ADD COLUMN "countryId" TEXT;
UPDATE "city" SET "countryId" = 'country-pakistan';

INSERT INTO "city" ("id", "name", "slug", "countryId", "position", "isActive", "createdAt", "updatedAt")
VALUES
    ('city-karachi', 'Karachi', 'karachi', 'country-pakistan', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-lahore', 'Lahore', 'lahore', 'country-pakistan', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-islamabad', 'Islamabad', 'islamabad', 'country-pakistan', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-rawalpindi', 'Rawalpindi', 'rawalpindi', 'country-pakistan', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-faisalabad', 'Faisalabad', 'faisalabad', 'country-pakistan', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-multan', 'Multan', 'multan', 'country-pakistan', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-peshawar', 'Peshawar', 'peshawar', 'country-pakistan', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-quetta', 'Quetta', 'quetta', 'country-pakistan', 7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-gujranwala', 'Gujranwala', 'gujranwala', 'country-pakistan', 8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-sialkot', 'Sialkot', 'sialkot', 'country-pakistan', 9, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-hyderabad', 'Hyderabad', 'hyderabad', 'country-pakistan', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('city-bahawalpur', 'Bahawalpur', 'bahawalpur', 'country-pakistan', 11, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

UPDATE "city" SET "countryId" = 'country-pakistan' WHERE "countryId" IS NULL;
ALTER TABLE "city" ALTER COLUMN "countryId" SET NOT NULL;
ALTER TABLE "city"
    ADD CONSTRAINT "city_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "country"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "city_countryId_isActive_position_idx" ON "city"("countryId", "isActive", "position");

ALTER TABLE "listing" ADD COLUMN "cityId" TEXT;
ALTER TABLE "listing" ADD COLUMN "areaId" TEXT;

UPDATE "listing" AS listing
SET "cityId" = city."id"
FROM "city" AS city
WHERE listing."city" IS NOT NULL
  AND lower(listing."city") = lower(city."name");

UPDATE "listing" AS listing
SET "areaId" = area."id"
FROM "area" AS area
JOIN "city" AS city ON city."id" = area."cityId"
WHERE listing."area" IS NOT NULL
  AND listing."cityId" = city."id"
  AND lower(listing."area") = lower(area."name");

ALTER TABLE "listing"
    ADD CONSTRAINT "listing_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "city"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "listing"
    ADD CONSTRAINT "listing_areaId_fkey"
    FOREIGN KEY ("areaId") REFERENCES "area"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "listing_cityId_idx" ON "listing"("cityId");
CREATE INDEX "listing_areaId_idx" ON "listing"("areaId");

ALTER TABLE "inspection_request" ADD COLUMN "cityId" TEXT;
ALTER TABLE "inspection_request" ADD COLUMN "areaId" TEXT;

UPDATE "inspection_request" AS request
SET "cityId" = city."id"
FROM "city" AS city
WHERE request."city" IS NOT NULL
  AND lower(request."city") = lower(city."name");

UPDATE "inspection_request" AS request
SET "areaId" = area."id"
FROM "area" AS area
JOIN "city" AS city ON city."id" = area."cityId"
WHERE request."area" IS NOT NULL
  AND request."cityId" = city."id"
  AND lower(request."area") = lower(area."name");

ALTER TABLE "inspection_request"
    ADD CONSTRAINT "inspection_request_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "city"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inspection_request"
    ADD CONSTRAINT "inspection_request_areaId_fkey"
    FOREIGN KEY ("areaId") REFERENCES "area"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "inspection_request_cityId_idx" ON "inspection_request"("cityId");
CREATE INDEX "inspection_request_areaId_idx" ON "inspection_request"("areaId");
