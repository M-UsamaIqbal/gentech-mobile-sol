import type { MetadataRoute } from "next";

import { APP_URL } from "@/lib/app-url";
import { getCountryCodes } from "@/lib/countries";
import { getRegionForCountry } from "@/lib/countries/server";
import { PAGINATION } from "@/lib/constants";
import { parseListingFilters } from "@/features/listings/schemas/filters";
import { getListingFeed } from "@/features/listings/services/listing.service";
import {
  buildListingSitemapEntries,
  buildPublicSitemapEntries,
  type SitemapListingInput,
} from "@/lib/seo/sitemap";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const listings: SitemapListingInput[] = [];

  await Promise.all(
    getCountryCodes().map(async (country) => {
      try {
        const feed = await getListingFeed(
          { ...parseListingFilters({}), pageSize: PAGINATION.maxPageSize },
          getRegionForCountry(country),
        );
        listings.push(
          ...feed.items.map((item) => ({
            slug: item.slug,
            country,
            lastModified: item.createdAt,
          })),
        );
      } catch (error) {
        // A sitemap must still describe the stable public routes when the feed is unavailable.
        console.warn(
          "[seo] Listing feed unavailable while building sitemap.",
          error instanceof Error ? error.message : error,
        );
      }
    }),
  );

  return [
    ...buildPublicSitemapEntries(APP_URL, lastModified),
    ...buildListingSitemapEntries(APP_URL, listings),
  ];
}
