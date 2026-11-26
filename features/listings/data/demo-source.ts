import { getDemoListings } from "@/features/marketplace/data/fixtures";
import { categorySlugsForFilter } from "@/lib/catalog/category-filters";
import type { Region } from "@/lib/generated/prisma/enums";
import type { ListingCardData, ListingFilters, ListingSearchResult } from "@/types/marketplace";

/**
 * In-memory listing search over demo fixtures. Mirrors the semantics of the Prisma
 * repository so the marketplace is fully interactive without a database connected.
 */
export function searchDemoListings(filters: ListingFilters, region?: Region): ListingSearchResult {
  const q = filters.q?.toLowerCase();
  const source = getDemoListings(region);

  let items = source.filter((l) => {
    if (q && !`${l.title} ${l.brand ?? ""}`.toLowerCase().includes(q)) return false;
    if (filters.category) {
      const slugs = categorySlugsForFilter(filters.category);
      if (!l.categorySlug || !slugs.includes(l.categorySlug)) return false;
    }
    if (filters.brand && l.brandSlug !== filters.brand) return false;
    if (filters.condition && l.condition !== filters.condition) return false;
    if (filters.city && l.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.minPrice !== undefined && l.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && l.price > filters.maxPrice) return false;
    if (filters.storage && l.storage !== filters.storage) return false;
    if (filters.ram && l.ram !== filters.ram) return false;
    if (filters.color && l.color !== filters.color) return false;
    if (
      filters.batteryHealthMin !== undefined &&
      (l.batteryHealth === undefined || l.batteryHealth < filters.batteryHealthMin)
    )
      return false;
    if (filters.ptaStatus && l.ptaStatus !== filters.ptaStatus) return false;
    if (filters.cpidStatus && l.cpidStatus !== filters.cpidStatus) return false;
    if (filters.warranty && l.warranty !== filters.warranty) return false;
    if (filters.processor && l.processor !== filters.processor) return false;
    if (filters.operatingSystem && l.operatingSystem !== filters.operatingSystem) return false;
    if (filters.screenSize && l.screenSize !== filters.screenSize) return false;
    if (filters.connectivity && l.connectivity !== filters.connectivity) return false;
    if (filters.accessoryType && l.accessoryType !== filters.accessoryType) return false;
    if (filters.compatibility && l.compatibility !== filters.compatibility) return false;
    if (filters.isInspected !== undefined && l.isInspected !== filters.isInspected) return false;
    if (filters.isVerifiedSeller !== undefined && l.isVerifiedSeller !== filters.isVerifiedSeller)
      return false;
    if (filters.isDealer !== undefined && l.isDealer !== filters.isDealer) return false;
    return true;
  });

  items = sortListings(items, filters.sort);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * filters.pageSize;
  const pageItems = items.slice(start, start + filters.pageSize);

  return { items: pageItems, total, page, pageSize: filters.pageSize, totalPages };
}

/** Resolves demo listing cards by id for preview-mode comparison links. */
export function getDemoListingCardsByIds(ids: string[], region?: Region): ListingCardData[] {
  const byId = new Map(getDemoListings(region).map((listing) => [listing.id, listing]));
  return ids
    .map((id) => byId.get(id))
    .filter((listing): listing is ListingCardData => Boolean(listing));
}

/**
 * Fills unresolved ids from region-scoped demo fixtures. A selection can mix live
 * database listings with preview cards (e.g. a demo detail page suggesting live
 * listings), so every missing id must be resolved — not just when none resolved.
 */
export function withDemoListingsForIds(
  resolved: ListingCardData[],
  ids: string[],
  region?: Region,
): ListingCardData[] {
  if (resolved.length >= ids.length) return resolved;
  const known = new Set(resolved.map((listing) => listing.id));
  return [
    ...resolved,
    ...getDemoListingCardsByIds(ids, region).filter((listing) => !known.has(listing.id)),
  ];
}

function sortListings(items: ListingCardData[], sort: ListingFilters["sort"]): ListingCardData[] {
  const copy = [...items];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "popular":
      return copy.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    case "recent":
    default:
      return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
