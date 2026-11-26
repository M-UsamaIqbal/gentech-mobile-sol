import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("catalog cache wiring", () => {
  it("uses the shared catalog tag and TTL for stable reference data", () => {
    const files = [
      "features/locations/services/location.service.ts",
      "features/marketplace/services/catalog.service.ts",
      "features/marketplace/services/category.service.ts",
      "features/inspections/services/inspection.service.ts",
      "features/promotions/services/promotion.service.ts",
    ];

    for (const file of files) {
      const code = source(file);
      expect(code, `${file} must use unstable_cache`).toContain("unstable_cache");
      expect(code, `${file} must use the catalog tag`).toContain("CACHE_TAGS.catalog");
      expect(code, `${file} must use the shared TTL`).toContain("CATALOG_REVALIDATE_SECONDS");
    }
  });

  it("invalidates the catalog tag from admin and seller mutations", () => {
    const files = [
      "features/admin/actions/catalog-admin.actions.ts",
      "features/admin/actions/admin.actions.ts",
      "features/admin/actions/location-admin.actions.ts",
      "features/inspections/actions/admin-plan.actions.ts",
      "features/promotions/actions/admin-promotion.actions.ts",
      "features/listings/actions/create-listing.ts",
      "features/seller/actions/seller.actions.ts",
    ];

    for (const file of files) {
      const code = source(file);
      expect(code, `${file} must import updateTag`).toContain("updateTag");
      expect(code, `${file} must invalidate the catalog tag`).toContain("updateTag(CACHE_TAGS.catalog)");
    }
  });

  it("deduplicates the per-user region lookup within a request", () => {
    const region = source("lib/region.ts");
    expect(region).toContain('import { cache } from "react"');
    expect(region).toContain("const getRegionFromUser = cache(");
  });
});
