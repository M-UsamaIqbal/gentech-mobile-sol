import { describe, expect, it } from "vitest";

import {
  countActiveFilters,
  getActiveFilterGroups,
  hasActiveFilters,
  PRIMARY_FILTER_GROUPS,
} from "@/features/listings/lib/filter-groups";
import { parseListingFilters } from "@/features/listings/schemas/filters";

describe("adaptive filter sidebar state", () => {
  it("treats an unfiltered feed as collapsed-ready", () => {
    const filters = parseListingFilters({});

    expect(countActiveFilters(filters)).toBe(0);
    expect(hasActiveFilters(filters)).toBe(false);
    expect(getActiveFilterGroups(filters).size).toBe(0);
  });

  it("counts a bounded price range as one active filter", () => {
    const filters = parseListingFilters({ minPrice: "1000", maxPrice: "90000", q: "iphone" });

    expect(countActiveFilters(filters)).toBe(2);
    expect(getActiveFilterGroups(filters).has("price")).toBe(true);
  });

  it("keeps groups with active values out of the auto-collapse set", () => {
    const filters = parseListingFilters({
      category: "tablets",
      ptaStatus: "PTA_APPROVED",
      processor: "Apple M3",
      isInspected: "true",
    });
    const active = getActiveFilterGroups(filters);

    expect(active.has("category")).toBe(true);
    expect(active.has("ptaStatus")).toBe(true);
    expect(active.has("processor")).toBe(true);
    expect(active.has("trust")).toBe(true);
    expect(active.has("color")).toBe(false);
    expect(PRIMARY_FILTER_GROUPS.has("category")).toBe(true);
    expect(PRIMARY_FILTER_GROUPS.has("warranty")).toBe(false);
  });

  it("tracks every trust signal independently", () => {
    const filters = parseListingFilters({
      isInspected: "true",
      isVerifiedSeller: "true",
      isDealer: "true",
    });

    expect(countActiveFilters(filters)).toBe(3);
    expect(getActiveFilterGroups(filters).has("trust")).toBe(true);
  });
});
