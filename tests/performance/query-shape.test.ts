import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("database query shape regressions", () => {
  it("creates order items as one nested write instead of an N+1 loop", () => {
    const orderService = source("features/orders/services/order.service.ts");
    expect(orderService).toContain("items: {");
    expect(orderService).toContain("create: orderItems.map(");
    expect(orderService).not.toContain("tx.orderItem.create");
  });

  it("returns listing cards from a single ordered query with a window count", () => {
    const repository = source("features/listings/repositories/listing.repository.ts");
    expect(repository).toContain('count(*) OVER() AS "total"');
    expect(repository).not.toContain('SELECT "id" FROM "listing"');
    expect(repository).not.toContain("where: { id: { in: ids } }");
  });

  it("pushes cart availability into the database predicate", () => {
    const cart = source("features/cart/services/cart.service.ts");
    expect(cart).toContain('listing: { status: "ACTIVE", deletedAt: null }');
    expect(cart).not.toContain('item.listing.status !== "ACTIVE"');
  });

  it("bounds previously unbounded reads", () => {
    const files = [
      "features/phone-intelligence/services/valuation.service.ts",
      "features/inspections/repositories/inspection.repository.ts",
      "features/promotions/repositories/promotion.repository.ts",
      "features/promotions/services/promotion.service.ts",
      "features/seller-verification/services/seller-verification.service.ts",
      "app/[country]/[locale]/(dashboard)/dashboard/seller/orders/page.tsx",
    ];

    for (const file of files) {
      expect(source(file), `${file} must bound its read`).toMatch(/take:\s*\d+/);
    }
  });
});
