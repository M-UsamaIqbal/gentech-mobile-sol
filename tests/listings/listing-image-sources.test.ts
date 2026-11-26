import { describe, expect, it } from "vitest";

import { MAX_LISTING_PHOTOS, createListingSchema } from "@/features/listings/schemas/create-listing";
import {
  isOptimizableImageUrl,
  isValidImageUrl,
  MAX_IMAGE_URL_LENGTH,
  parseImageUrl,
} from "@/lib/validation/image-url";

const listing = {
  title: "Phone in good condition",
  description: "A carefully maintained phone with all accessories included.",
  price: 25000,
  condition: "USED",
  categorySlug: "smartphones",
  countryId: "country-pakistan",
  cityId: "city-karachi",
  images: [{ url: "https://example.com/phone.jpg" }],
};

describe("listing image sources", () => {
  it("accepts both uploaded and externally hosted https images", () => {
    expect(
      createListingSchema.safeParse({
        ...listing,
        images: [
          {
            url: "https://res.cloudinary.com/gentech/image/upload/listings/phone.jpg",
            publicId: "listings/phone",
            width: 1200,
            height: 900,
          },
          { url: "https://cdn.example.org/photos/phone.webp" },
        ],
      }).success,
    ).toBe(true);
  });

  it.each([
    "http://example.com/phone.jpg",
    "javascript:alert(1)",
    "https://localhost/phone.jpg",
    "https://127.0.0.1/phone.jpg",
    "https://192.168.1.10/phone.jpg",
    "https://user:pass@example.com/phone.jpg",
    `https://example.com/${"a".repeat(MAX_IMAGE_URL_LENGTH)}`,
    "not a url",
  ])("rejects unsafe or malformed image URL %s", (url) => {
    expect(isValidImageUrl(url)).toBe(false);
    expect(createListingSchema.safeParse({ ...listing, images: [{ url }] }).success).toBe(false);
  });

  it("accepts the full 36-photo rotation sequence and rejects more", () => {
    const images = Array.from({ length: MAX_LISTING_PHOTOS }, (_, index) => ({
      url: `https://example.com/angle-${index}.jpg`,
    }));
    expect(createListingSchema.safeParse({ ...listing, images }).success).toBe(true);
    expect(
      createListingSchema.safeParse({
        ...listing,
        images: [...images, { url: "https://example.com/angle-extra.jpg" }],
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate image URLs", () => {
    const url = "https://example.com/phone.jpg";
    expect(createListingSchema.safeParse({ ...listing, images: [{ url }, { url }] }).success).toBe(
      false,
    );
  });

  it("keeps external hosts out of the Next.js image optimizer", () => {
    expect(isOptimizableImageUrl("https://res.cloudinary.com/demo/image/upload/iphone.jpg")).toBe(
      true,
    );
    expect(isOptimizableImageUrl("https://cdn.example.org/phone.webp")).toBe(false);
    expect(isOptimizableImageUrl("http://res.cloudinary.com/demo/image/upload/iphone.jpg")).toBe(
      false,
    );
    expect(parseImageUrl(" https://example.com/phone.jpg ")?.hostname).toBe("example.com");
  });
});
