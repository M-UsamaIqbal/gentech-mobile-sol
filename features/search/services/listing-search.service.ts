import "server-only";

import type { Region } from "@/lib/generated/prisma/enums";

import { parseListingFilters } from "@/features/listings/schemas/filters";
import { getListingFeed } from "@/features/listings/services/listing.service";
import type { ListingCardData } from "@/types/marketplace";

/**
 * Listing cards for the in-place compare picker. Reuses the marketplace feed so
 * region isolation, ranked search and the preview fallback stay identical.
 */
export async function searchListingsForComparePicker(
  query: string,
  region: Region,
  limit: number,
): Promise<ListingCardData[]> {
  const term = query.trim();
  if (term.length < 2) return [];

  const filters = parseListingFilters({ q: term, sort: "recent", page: "1" });
  const feed = await getListingFeed(filters, region);
  return feed.items.slice(0, limit);
}
