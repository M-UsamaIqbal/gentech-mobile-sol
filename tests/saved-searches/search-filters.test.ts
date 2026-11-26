import { describe, expect, it } from "vitest";

import { parseSavedSearchFilters } from "@/features/saved-searches/lib/search-filters";

describe("saved search filter parsing", () => {
  it("restores structured filters and resets pagination for alert matching", () => {
    const filters = parseSavedSearchFilters(
      "q=galaxy&city=Lahore&minPrice=10000&isDealer=true&page=4",
    );

    expect(filters.q).toBe("galaxy");
    expect(filters.city).toBe("Lahore");
    expect(filters.minPrice).toBe(10_000);
    expect(filters.isDealer).toBe(true);
    expect(filters.page).toBe(1);
  });

  it("ignores malformed filter values using the marketplace parser", () => {
    const filters = parseSavedSearchFilters("batteryHealthMin=999&storage=%20");

    expect(filters.batteryHealthMin).toBeUndefined();
    expect(filters.storage).toBeUndefined();
    expect(filters.page).toBe(1);
  });
});
