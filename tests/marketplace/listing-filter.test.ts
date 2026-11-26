import { describe, expect, it } from "vitest";

import { searchDemoListings } from "@/features/listings/data/demo-source";
import { parseListingFilters } from "@/features/listings/schemas/filters";

describe("marketplace listing filters", () => {
  it("parses dynamic catalog attribute values and validates trust flags", () => {
    const filters = parseListingFilters({
      storage: "1TB",
      ram: "24GB",
      color: "Titanium Blue",
      isDealer: "true",
      isInspected: "yes",
      isVerifiedSeller: "false",
    });

    expect(filters.storage).toBe("1TB");
    expect(filters.ram).toBe("24GB");
    expect(filters.color).toBe("Titanium Blue");
    expect(filters.isDealer).toBe(true);
    expect(filters.isInspected).toBeUndefined();
    expect(filters.isVerifiedSeller).toBe(false);
  });

  it("drops invalid attribute values and resets inverted price ranges", () => {
    const filters = parseListingFilters({
      storage: " ".repeat(41),
      batteryHealthMin: "101",
      minPrice: "100000",
      maxPrice: "50000",
      page: "not-a-page",
    });

    expect(filters.storage).toBeUndefined();
    expect(filters.batteryHealthMin).toBeUndefined();
    expect(filters.minPrice).toBe(100_000);
    expect(filters.maxPrice).toBeUndefined();
    expect(filters.page).toBe(1);
  });

  it("combines multi-attribute filters consistently in preview data", () => {
    const filters = parseListingFilters({
      brand: "samsung",
      storage: "512",
      ram: "12",
      color: "Black",
      isDealer: "true",
      isVerifiedSeller: "true",
    });

    const result = searchDemoListings(filters);

    expect(result.total).toBe(1);
    expect(result.items.map((listing) => listing.slug)).toEqual(["pk-samsung-galaxy-s24-ultra-512gb"]);
  });

  it("matches completed inspection status and PTA against preview attributes", () => {
    const inspected = searchDemoListings(
      parseListingFilters({ isInspected: "true", ptaStatus: "PTA_APPROVED" }),
    );

    expect(inspected.total).toBe(1);
    expect(inspected.items[0]?.slug).toBe("pk-iphone-15-pro-max-256gb");
  });
});
