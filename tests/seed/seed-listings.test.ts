import { describe, expect, it } from "vitest";

import {
  buildExpansionListings,
  buildGeneratedListings,
  IMAGES_PER_LISTING,
  listingImages,
} from "../../prisma/seed-listings";

describe("marketplace seed listings", () => {
  it("generates the requested regional inventory", () => {
    const pakistan = buildGeneratedListings("PAKISTAN", 88);
    const bahrain = buildGeneratedListings("BAHRAIN", 100);

    expect(pakistan).toHaveLength(88);
    expect(bahrain).toHaveLength(100);
    expect([...pakistan, ...bahrain]).toHaveLength(188);
    expect(new Set([...pakistan, ...bahrain].map((item) => item.slug)).size).toBe(188);
  });

  it("uses region-correct currency, cities and image links", () => {
    const pakistan = buildGeneratedListings("PAKISTAN", 88);
    const bahrain = buildGeneratedListings("BAHRAIN", 100);

    expect(pakistan.every((item) => item.currency === "PKR" && item.region === "PAKISTAN")).toBe(
      true,
    );
    expect(bahrain.every((item) => item.currency === "BHD" && item.region === "BAHRAIN")).toBe(
      true,
    );
    expect(new Set(bahrain.map((item) => item.city))).toEqual(
      new Set([
        "Manama",
        "Riffa",
        "Muharraq",
        "Salmaniya",
        "Isa Town",
        "Sitra",
        "Zallaq",
        "Hamad Town",
        "Budaiya",
        "Sanabis",
      ]),
    );

    for (const item of [...pakistan, ...bahrain]) {
      expect(item.images).toHaveLength(IMAGES_PER_LISTING);
      expect(item.images[0]).toMatch(
        /^https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+\?auto=format&fit=crop&w=1200&q=75$/,
      );
      expect(item.price).toBeGreaterThan(0);
    }
  });

  it("adds laptop, tablet and accessory inventory in both regions", () => {
    const pakistan = buildExpansionListings("PAKISTAN");
    const bahrain = buildExpansionListings("BAHRAIN");
    const all = [...pakistan, ...bahrain];
    const expectedCategories = [
      "laptops",
      "tablets",
      "laptop-accessories",
      "tablet-accessories",
    ];

    expect(pakistan).toHaveLength(30);
    expect(bahrain).toHaveLength(30);
    expect(new Set(all.map((item) => item.slug)).size).toBe(60);
    expect(new Set(all.map((item) => item.categorySlug))).toEqual(new Set(expectedCategories));
    expect(pakistan.every((item) => item.currency === "PKR")).toBe(true);
    expect(bahrain.every((item) => item.currency === "BHD")).toBe(true);
    for (const item of all) {
      expect(item.images).toHaveLength(IMAGES_PER_LISTING);
      expect(item.price).toBeGreaterThan(0);
    }
  });

  it("is deterministic and rejects out-of-range counts", () => {
    expect(buildGeneratedListings("BAHRAIN", 5)).toEqual(buildGeneratedListings("BAHRAIN", 5));
    expect(buildExpansionListings("BAHRAIN")).toEqual(buildExpansionListings("BAHRAIN"));
    expect(listingImages("smartphones", 1)).toEqual(listingImages("smartphones", 1));
    expect(() => buildGeneratedListings("PAKISTAN", 101)).toThrow(RangeError);
  });
});
