import { describe, expect, it } from "vitest";

import { DEMO_BRANDS, getDemoListings } from "@/features/marketplace/data/fixtures";
import { searchDemoListings } from "@/features/listings/data/demo-source";
import { parseListingFilters } from "@/features/listings/schemas/filters";
import {
  filterBrandsForCategory,
  getCategoryFilterProfile,
  specOptionKey,
} from "@/lib/catalog/category-filters";
import { Region } from "@/lib/generated/prisma/enums";

describe("category-aware marketplace filters", () => {
  it("exposes category-specific filter groups", () => {
    expect(getCategoryFilterProfile("smartphones").filters).toContain("ptaStatus");
    expect(getCategoryFilterProfile("tablets").filters).toContain("screenSize");
    expect(getCategoryFilterProfile("laptops").filters).toContain("processor");
    expect(getCategoryFilterProfile("laptops").filters).not.toContain("ptaStatus");
    expect(getCategoryFilterProfile("accessories").filters).toContain("accessoryType");
    expect(getCategoryFilterProfile("accessories").filters).not.toContain("storage");
  });

  it("removes stale filters when the explored category changes", () => {
    const laptopFilters = parseListingFilters({
      category: "laptops",
      ptaStatus: "PTA_APPROVED",
      processor: "Apple M3",
    });

    expect(laptopFilters.ptaStatus).toBeUndefined();
    expect(laptopFilters.processor).toBe("Apple M3");

    const accessoryFilters = parseListingFilters({
      category: "chargers-cables",
      storage: "256",
      accessoryType: "Charger",
    });

    expect(accessoryFilters.storage).toBeUndefined();
    expect(accessoryFilters.accessoryType).toBe("Charger");
  });

  it("matches laptop specification filters in preview data", () => {
    const result = searchDemoListings(
      parseListingFilters({ category: "laptops", processor: "Apple M3", screenSize: '13"' }),
    );

    expect(result.total).toBeGreaterThan(0);
    expect(result.items.every((item) => item.categorySlug === "laptops")).toBe(true);
  });

  it("matches accessory filters and expands root categories", () => {
    const accessory = searchDemoListings(
      parseListingFilters({ category: "laptop-accessories", accessoryType: "Hub", connectivity: "USB-C" }),
    );
    const root = searchDemoListings(parseListingFilters({ category: "laptops-tablets" }));

    expect(accessory.total).toBeGreaterThan(0);
    expect(root.total).toBeGreaterThan(0);
    expect(root.items.every((item) => ["laptops", "tablets"].includes(item.categorySlug ?? ""))).toBe(true);
  });

  it("adapts brand options to the selected category", () => {
    const listings = getDemoListings(Region.PAKISTAN);
    const mobileBrands = filterBrandsForCategory(DEMO_BRANDS, listings, "mobile-phones").map(
      (brand) => brand.slug,
    );
    const laptopBrands = filterBrandsForCategory(DEMO_BRANDS, listings, "laptops").map(
      (brand) => brand.slug,
    );

    expect(mobileBrands).toEqual(expect.arrayContaining(["apple", "samsung", "xiaomi", "oppo"]));
    expect(mobileBrands).not.toContain("dell");
    expect(laptopBrands).toEqual(expect.arrayContaining(["apple", "dell"]));
    expect(laptopBrands).not.toContain("oppo");
    expect(filterBrandsForCategory(DEMO_BRANDS, listings, "all")).toEqual(DEMO_BRANDS);
  });

  it("maps curated option values to stable translation keys", () => {
    expect(specOptionKey("Wi-Fi + Cellular")).toBe("wi_fi_cellular");
    expect(specOptionKey('13"')).toBe("13");
    expect(specOptionKey("Power Bank")).toBe("power_bank");
  });
});
