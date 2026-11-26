import { parseListingFilters } from "@/features/listings/schemas/filters";
import type { ListingFilters } from "@/types/marketplace";

export function parseSavedSearchFilters(query: string): ListingFilters {
  const params = new URLSearchParams(query);
  params.delete("page");
  return parseListingFilters(Object.fromEntries(params.entries()));
}
