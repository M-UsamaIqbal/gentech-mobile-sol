CREATE INDEX CONCURRENTLY IF NOT EXISTS "listing_lower_city_idx" ON "listing" (lower("city"));

