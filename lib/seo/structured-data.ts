import { APP, LISTING_CONDITION_LABELS, type ListingCondition } from "@/lib/constants";
import type { ListingDetail } from "@/types/marketplace";

import { absoluteUrl } from "./metadata";

type JsonLdObject = Record<string, unknown>;

const ITEM_CONDITION_URLS: Record<ListingCondition, string> = {
  NEW: "https://schema.org/NewCondition",
  OPEN_BOX: "https://schema.org/NewCondition",
  USED: "https://schema.org/UsedCondition",
  REFURBISHED: "https://schema.org/RefurbishedCondition",
  FOR_PARTS: "https://schema.org/UsedCondition",
};

/** Site-wide identity and site search markup. */
export function buildSiteStructuredData(baseUrl: string): JsonLdObject {
  const origin = baseUrl.replace(/\/+$/, "");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: APP.name,
        url: origin,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: APP.name,
        publisher: { "@id": `${origin}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${origin}/pk/en/marketplace?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

/** Product/Offer data derived from the server-loaded listing detail. */
export function buildListingStructuredData(detail: ListingDetail, pageUrl: string): JsonLdObject {
  const itemCondition = ITEM_CONDITION_URLS[detail.condition];
  const images = detail.images.map((image) => image.url).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${pageUrl}#product`,
    name: detail.title,
    description: detail.description,
    image: images.length > 0 ? images : undefined,
    sku: detail.id,
    category: detail.categoryName ?? detail.categorySlug,
    brand: detail.brand ? { "@type": "Brand", name: detail.brand } : undefined,
    itemCondition,
    additionalProperty: {
      "@type": "PropertyValue",
      name: "Condition",
      value: LISTING_CONDITION_LABELS[detail.condition],
    },
    offers: {
      "@type": "Offer",
      "@id": `${pageUrl}#offer`,
      url: pageUrl,
      price: detail.price,
      priceCurrency: detail.currency,
      availability: "https://schema.org/InStock",
      itemCondition,
      seller: { "@type": "Organization", name: detail.seller.name },
    },
  };
}

export interface StructuredBreadcrumb {
  name: string;
  path: string;
}

/** Breadcrumb trail matching the visible navigation on a page. */
export function buildBreadcrumbStructuredData(
  items: StructuredBreadcrumb[],
  baseUrl: string,
): JsonLdObject {
  const itemListElement = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path, baseUrl),
  }));
  const last = items.at(-1);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": last ? `${absoluteUrl(last.path, baseUrl)}#breadcrumb` : `${baseUrl}#breadcrumb`,
    itemListElement,
  };
}

export interface StructuredListItem {
  name: string;
  path: string;
  image?: string;
}

/** Dynamic ItemList markup for listing feeds. */
export function buildItemListStructuredData(
  name: string,
  listUrl: string,
  baseUrl: string,
  items: StructuredListItem[],
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl(listUrl, baseUrl),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path, baseUrl),
      image: item.image,
    })),
  };
}

/** Escapes characters that can break out of an inline JSON-LD script element. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
