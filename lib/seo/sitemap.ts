import type { MetadataRoute } from "next";

import { getAllSupportedLocales, getCountryCodes } from "@/lib/countries";
import type { CountryCode } from "@/lib/countries/types";

import { absoluteUrl, localizedPath } from "./metadata";

/** Public surfaces that are safe and useful to crawl in every locale. */
export const INDEXED_PUBLIC_ROUTES = [
  "/",
  "/marketplace",
  "/categories",
  "/valuation",
  "/imei-check",
  "/compare",
  "/inspection",
] as const;

export function buildPublicSitemapEntries(
  baseUrl: string,
  lastModified: Date,
): MetadataRoute.Sitemap {
  return getCountryCodes().flatMap((country) =>
    getAllSupportedLocales().flatMap((locale) =>
      INDEXED_PUBLIC_ROUTES.map((route) => ({
        url: absoluteUrl(localizedPath(route, country, locale), baseUrl),
        lastModified,
        changeFrequency: route === "/" || route === "/marketplace" ? "daily" : "weekly",
        priority: route === "/" ? 1 : route === "/marketplace" ? 0.9 : 0.7,
      })),
    ),
  );
}

export interface SitemapListingInput {
  slug: string;
  country: CountryCode;
  lastModified?: string | Date;
}

/** Active listing URLs for each supported locale, deduplicated by final URL. */
export function buildListingSitemapEntries(
  baseUrl: string,
  listings: SitemapListingInput[],
): MetadataRoute.Sitemap {
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();

  for (const listing of listings) {
    if (!listing.slug) continue;

    for (const locale of getAllSupportedLocales()) {
      const url = absoluteUrl(
        localizedPath(`/listings/${listing.slug}`, listing.country, locale),
        baseUrl,
      );
      if (entries.has(url)) continue;

      entries.set(url, {
        url,
        lastModified: listing.lastModified ? new Date(listing.lastModified) : undefined,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return [...entries.values()];
}
