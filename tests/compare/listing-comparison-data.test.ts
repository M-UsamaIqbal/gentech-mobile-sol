import { beforeEach, describe, expect, it, vi } from "vitest";

import { Region } from "@/lib/generated/prisma/enums";
import type { ListingCardData } from "@/types/marketplace";

const mocks = vi.hoisted(() => ({
  getSelectedListingCards: vi.fn(),
  findAllActive: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/features/listings/services/listing.service", () => ({
  getSelectedListingCards: mocks.getSelectedListingCards,
}));
vi.mock("@/features/phone-intelligence/repositories/phone-model.repository", () => ({
  phoneModelRepository: { findAllActive: mocks.findAllActive },
}));

import { comparisonService } from "@/features/phone-intelligence/services/comparison.service";

function card(id: string, title: string, model?: string): ListingCardData {
  return {
    id,
    title,
    slug: `slug-${id}`,
    price: 1000,
    currency: "PKR",
    region: Region.PAKISTAN,
    condition: "USED",
    city: "Karachi",
    brand: "Apple",
    brandSlug: "apple",
    categorySlug: "smartphones",
    createdAt: new Date().toISOString(),
    ...(model ? { model } : {}),
  };
}

const apple = card("live-1", "Apple iPhone 15 Pro Max 256GB", "iPhone 15 Pro Max");
const samsung = card("live-2", "Samsung Galaxy S24 Ultra 512GB", "Galaxy S24 Ultra");

describe("listing comparison data flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findAllActive.mockResolvedValue([]);
  });

  it("keeps selected listings when the phone catalog is unavailable", async () => {
    mocks.getSelectedListingCards.mockResolvedValue([apple, samsung]);
    mocks.findAllActive.mockRejectedValue(new Error("catalog offline"));

    const specs = await comparisonService.getListingComparisonSpecs(
      [apple.id, samsung.id],
      Region.PAKISTAN,
    );

    expect(specs.map((spec) => spec.id)).toEqual(["live-1", "live-2"]);
    expect(specs.map((spec) => spec.name)).toEqual([
      "iPhone 15 Pro Max",
      "Galaxy S24 Ultra",
    ]);
  });

  it("uses the marketplace listing service with the requested ids and region", async () => {
    mocks.getSelectedListingCards.mockResolvedValue([apple, samsung]);

    await comparisonService.getListingComparisonSpecs(
      [samsung.id, apple.id, apple.id],
      Region.PAKISTAN,
    );

    expect(mocks.getSelectedListingCards).toHaveBeenCalledWith(
      [samsung.id, apple.id],
      Region.PAKISTAN,
    );
  });

  it("returns every resolved listing instead of discarding a partial selection", async () => {
    mocks.getSelectedListingCards.mockResolvedValue([apple]);

    const specs = await comparisonService.getListingComparisonSpecs(
      [apple.id, samsung.id],
      Region.PAKISTAN,
    );

    expect(specs.map((spec) => spec.id)).toEqual(["live-1"]);
  });

  it("preserves listing identity when catalog specs enrich the comparison", async () => {
    mocks.getSelectedListingCards.mockResolvedValue([apple]);
    mocks.findAllActive.mockResolvedValue([
      {
        id: "catalog-model-1",
        name: "iPhone 15 Pro",
        slug: "iphone-15-pro",
        modelNumber: null,
        brand: { name: "Apple", slug: "apple" },
        processor: "A17 Pro",
      },
    ]);

    const [spec] = await comparisonService.getListingComparisonSpecs(
      [apple.id],
      Region.PAKISTAN,
    );
    if (!spec) throw new Error("Expected one comparison spec");

    expect(spec.id).toBe("live-1");
    expect(spec.slug).toBe("slug-live-1");
    expect(spec.processor).toBe("A17 Pro");
  });
});
