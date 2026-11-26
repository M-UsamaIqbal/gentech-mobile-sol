import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schema = readFileSync(join(root, "prisma/schema.prisma"), "utf8");
const migrationsDir = join(root, "prisma/migrations");

function migrationSql(): string[] {
  return readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readFileSync(join(migrationsDir, entry.name, "migration.sql"), "utf8"));
}

describe("performance index migrations", () => {
  it("declares hot-path composite indexes in the Prisma schema", () => {
    expect(schema).toContain("@@index([region, status, createdAt])");
    expect(schema).toContain("@@index([region, isFeatured, createdAt])");
    expect(schema).toContain("@@index([status, price])");
    expect(schema).toContain("@@index([status, views])");
    expect(schema).toContain("@@index([userId, createdAt])");
    expect(schema).toContain("@@index([orderId, createdAt])");
    expect(schema).toContain("@@index([userId, type, createdAt])");
  });

  it("provides additive migrations for every declared hot-path index", () => {
    const sql = migrationSql().join("\n");
    const expected = [
      '"listing_region_status_createdAt_idx"',
      '"listing_region_isFeatured_createdAt_idx"',
      '"listing_status_price_idx"',
      '"listing_status_views_idx"',
      '"listing_region_city_idx"',
      '"listing_region_area_idx"',
      '"favorite_userId_createdAt_idx"',
      '"payment_orderId_createdAt_idx"',
      '"notification_userId_type_createdAt_idx"',
      '"notification_userId_readAt_idx"',
      '"message_conversationId_createdAt_idx"',
      '"category_region_idx"',
      '"imei_verification_verifiedBy_createdAt_idx"',
      '"inspection_request_requesterId_createdAt_idx"',
      '"inspection_request_inspectorId_status_createdAt_idx"',
      '"inspection_report_isPublished_idx"',
      '"seller_verification_sellerId_region_createdAt_idx"',
      '"phone_model_isActive_brandId_position_idx"',
      '"phone_history_listingId_occurredAt_idx"',
      '"order_customerId_createdAt_idx"',
      '"order_region_status_createdAt_idx"',
      '"order_item_listingId_idx"',
    ];

    for (const indexName of expected) {
      expect(sql, `missing migration for ${indexName}`).toContain(indexName);
    }
  });

  it("keeps concurrent index migrations to one statement so Prisma runs them outside a transaction", () => {
    for (const sql of migrationSql()) {
      if (!sql.includes("CREATE INDEX CONCURRENTLY")) continue;
      const statements = sql
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean);
      expect(statements, "concurrent index migration must contain a single statement").toHaveLength(1);
      expect(statements[0]).toMatch(/^CREATE INDEX CONCURRENTLY IF NOT EXISTS /);
    }
  });
});
