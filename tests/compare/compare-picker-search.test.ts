import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getListingFeed: vi.fn(),
}));

vi.mock("@/features/listings/services/listing.service", () => ({
  getListingFeed: mocks.getListingFeed,
}));

import { searchListingsForComparePicker } from "@/features/search/services/listing-search.service";
import { Region } from "@/lib/generated/prisma/enums";

describe("searchListingsForComparePicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not query for a short term", async () => {
    await expect(searchListingsForComparePicker(" i ", Region.PAKISTAN, 8)).resolves.toEqual([]);
    expect(mocks.getListingFeed).not.toHaveBeenCalled();
  });

  it("uses the region-scoped marketplace feed and applies the result cap", async () => {
    const items = [
      { id: "one", title: "One" },
      { id: "two", title: "Two" },
      { id: "three", title: "Three" },
    ];
    mocks.getListingFeed.mockResolvedValue({
      items,
      total: 3,
      page: 1,
      pageSize: 12,
      totalPages: 1,
      source: "db",
    });

    await expect(searchListingsForComparePicker(" iphone ", Region.BAHRAIN, 2)).resolves.toEqual(
      items.slice(0, 2),
    );
    expect(mocks.getListingFeed).toHaveBeenCalledWith(
      expect.objectContaining({ q: "iphone", sort: "recent", page: 1 }),
      Region.BAHRAIN,
    );
  });
});
