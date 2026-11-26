-- Migration: Add Location Taxonomy (City & Area)
-- Supports manageable hierarchical locations for mobile classifieds

CREATE TABLE IF NOT EXISTS "city" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "province" TEXT,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "city_name_key" ON "city"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "city_slug_key" ON "city"("slug");
CREATE INDEX IF NOT EXISTS "city_isActive_position_idx" ON "city"("isActive", "position");
CREATE INDEX IF NOT EXISTS "city_popular_idx" ON "city"("popular");

CREATE TABLE IF NOT EXISTS "area" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "area_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "area_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "area_cityId_slug_key" ON "area"("cityId", "slug");
CREATE INDEX IF NOT EXISTS "area_cityId_isActive_idx" ON "area"("cityId", "isActive");

