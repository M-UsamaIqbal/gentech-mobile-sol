import { describe, expect, it } from "vitest";

import type { ListingDetail } from "@/types/marketplace";
import {
  buildBreadcrumbStructuredData,
  buildItemListStructuredData,
  buildListingStructuredData,
  buildSiteStructuredData,
  serializeJsonLd,
} from "@/lib/seo/structured-data";

type JsonNode = Record<string, unknown>;

function makeDetail(): ListingDetail {
  return {
    id: "listing-1",
    title: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    description: "Inspected iPhone 15 Pro with PTA approval.",
    price: 285000,
    currency: "PKR",
    condition: "USED",
    negotiable: false,
    city: "Karachi",
    brand: "Apple",
    categorySlug: "phones",
    categoryName: "Mobile Phones",
    isFeatured: true,
    views: 10,
    createdAt: "2026-11-01T00:00:00.000Z",
    images: [{ url: "https://res.cloudinary.com/gentech/image/upload/phone.jpg" }],
    attributes: [],
    seller: { name: "GenTech Dealer" },
  };
}

describe("structured data", () => {
  it("publishes site identity and search markup", () => {
    const data = buildSiteStructuredData("https://gentech.example/");
    const graph = data["@graph"] as JsonNode[];

    expect(graph).toHaveLength(2);
    expect(graph[0]).toMatchObject({
      "@type": "Organization",
      name: "GenTech",
      url: "https://gentech.example",
    });
    expect(graph[1]).toMatchObject({
      "@type": "WebSite",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          urlTemplate: "https://gentech.example/pk/en/marketplace?q={search_term_string}",
        },
      },
    });
  });

  it("builds condition-aware Product/Offer markup", () => {
    const data = buildListingStructuredData(
      makeDetail(),
      "https://gentech.example/pk/en/listings/iphone-15-pro",
    );

    expect(data).toMatchObject({
      "@type": "Product",
      "@id": "https://gentech.example/pk/en/listings/iphone-15-pro#product",
      sku: "listing-1",
      itemCondition: "https://schema.org/UsedCondition",
    });
    expect(data.offers).toMatchObject({
      "@type": "Offer",
      price: 285000,
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      seller: { name: "GenTech Dealer" },
    });
  });

  it("builds absolute breadcrumb and item-list URLs", () => {
    const breadcrumbs = buildBreadcrumbStructuredData(
      [
        { name: "Home", path: "/" },
        { name: "Marketplace", path: "/marketplace" },
        { name: "iPhone 15 Pro", path: "/listings/iphone-15-pro" },
      ],
      "https://gentech.example",
    );

    const breadcrumbItems = breadcrumbs.itemListElement as JsonNode[];
    expect(breadcrumbItems).toHaveLength(3);
    expect(breadcrumbItems[2]).toMatchObject({
      position: 3,
      name: "iPhone 15 Pro",
      item: "https://gentech.example/listings/iphone-15-pro",
    });

    const itemList = buildItemListStructuredData(
      "Marketplace",
      "/bh/ar/marketplace",
      "https://gentech.example",
      [{ name: "iPhone 15 Pro", path: "/bh/ar/listings/iphone-15-pro" }],
    );

    expect(itemList).toMatchObject({
      "@type": "ItemList",
      numberOfItems: 1,
      url: "https://gentech.example/bh/ar/marketplace",
    });
    const itemListItems = itemList.itemListElement as JsonNode[];
    expect(itemListItems[0]).toMatchObject({
      url: "https://gentech.example/bh/ar/listings/iphone-15-pro",
    });
  });

  it("escapes inline JSON-LD payloads", () => {
    const serialized = serializeJsonLd({ value: "</script><script>alert(1)</script>&" });

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script\\u003e");
    expect(serialized).toContain("\\u0026");
  });
});
