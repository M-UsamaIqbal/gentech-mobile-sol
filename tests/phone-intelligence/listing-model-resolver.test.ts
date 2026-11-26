import { describe, expect, it } from "vitest";

import {
  resolvePhoneModelForListing,
  scoreListingModelMatch,
} from "@/features/phone-intelligence/services/listing-model-resolver";

const models = [
  {
    id: "model-1",
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    modelNumber: "A3104",
    brand: { id: "brand-1", name: "Apple", slug: "apple" },
  },
  {
    id: "model-2",
    name: "Galaxy S24",
    slug: "galaxy-s24",
    modelNumber: "SM-S921B",
    brand: { id: "brand-2", name: "Samsung", slug: "samsung" },
  },
] as never;

describe("listing model resolver", () => {
  it("prefers an exact model-number match", () => {
    const listing = {
      title: "Apple iPhone 15 Pro 256GB",
      brand: "Apple",
      brandSlug: "apple",
      model: "iPhone 15 Pro",
      modelNumber: "A3104",
    };

    expect(resolvePhoneModelForListing(listing, models)?.id).toBe("model-1");
  });

  it("matches an exact free-text model with the brand bonus", () => {
    const listing = {
      title: "Unlocked handset",
      brand: "Samsung",
      brandSlug: "samsung",
      model: "Galaxy S24",
      modelNumber: undefined,
    };

    expect(resolvePhoneModelForListing(listing, models)?.id).toBe("model-2");
  });

  it("falls back to title tokens for a clear match", () => {
    const listing = {
      title: "Apple iPhone 15 Pro natural titanium",
      brand: "Apple",
      brandSlug: "apple",
      model: undefined,
      modelNumber: undefined,
    };

    expect(resolvePhoneModelForListing(listing, models)?.id).toBe("model-1");
  });

  it("rejects weak or unrelated matches", () => {
    const listing = {
      title: "Generic phone case",
      brand: "Unknown",
      model: undefined,
      modelNumber: undefined,
    };

    expect(resolvePhoneModelForListing(listing, models)).toBeNull();
    expect(scoreListingModelMatch(listing, models[0])).toBe(0);
  });
});
