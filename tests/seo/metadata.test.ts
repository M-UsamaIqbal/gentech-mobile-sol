import { describe, expect, it } from "vitest";

import {
  buildAlternateLanguages,
  isNonCanonicalQueryVariant,
  localizedPath,
  localizedSeoMetadata,
  truncateDescription,
} from "@/lib/seo/metadata";

describe("localized SEO metadata", () => {
  it("builds concrete localized paths", () => {
    expect(localizedPath("/", "BH", "ar")).toBe("/bh/ar");
    expect(localizedPath("/marketplace", "PK", "en")).toBe("/pk/en/marketplace");
    expect(localizedPath("listings/phone", "BH", "ur")).toBe("/bh/ur/listings/phone");
  });

  it("emits self-referencing alternates and a stable x-default", () => {
    const languages = buildAlternateLanguages("/listings/iphone-15");

    expect(Object.keys(languages)).toHaveLength(7);
    expect(languages["en-BH"]).toBe("/bh/en/listings/iphone-15");
    expect(languages["ar-PK"]).toBe("/pk/ar/listings/iphone-15");
    expect(languages["ur-PK"]).toBe("/pk/ur/listings/iphone-15");
    expect(languages["x-default"]).toBe("/pk/en/listings/iphone-15");
  });

  it("uses the actual page path for canonical tags", () => {
    const metadata = localizedSeoMetadata({
      path: "/marketplace",
      country: "BH",
      locale: "ur",
    });

    expect(metadata.alternates).toEqual({
      canonical: "/bh/ur/marketplace",
      languages: buildAlternateLanguages("/marketplace"),
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({ url: "/bh/ur/marketplace", locale: "ur_BH" }),
    );
  });

  it("detects query variants that must not be indexed", () => {
    expect(isNonCanonicalQueryVariant({})).toBe(false);
    expect(isNonCanonicalQueryVariant({ sort: "recent", page: "1" })).toBe(false);
    expect(isNonCanonicalQueryVariant({ q: "iphone" })).toBe(true);
    expect(isNonCanonicalQueryVariant({ category: "phones" })).toBe(true);
    expect(isNonCanonicalQueryVariant({ sort: "price_desc" })).toBe(true);
    expect(isNonCanonicalQueryVariant({ page: "2" })).toBe(true);
    expect(isNonCanonicalQueryVariant({ utm_source: "newsletter" })).toBe(true);
    expect(isNonCanonicalQueryVariant({ q: ["", "iphone"] })).toBe(false);
  });

  it("truncates descriptions on a word boundary", () => {
    expect(truncateDescription("A compact description.", 160)).toBe("A compact description.");

    const description = truncateDescription(
      "Verified phones with inspection reports and buyer protection across Bahrain and Pakistan.",
      45,
    );
    expect(description.endsWith("…")).toBe(true);
    expect(description).toBe("Verified phones with inspection reports and…");
  });
});
