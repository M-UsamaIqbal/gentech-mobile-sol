import type { ListingFilters } from "@/types/marketplace";

/** Collapsible groups rendered by the marketplace filter sidebar. */
export const FILTER_GROUP_IDS = [
  "category",
  "brand",
  "condition",
  "price",
  "city",
  "storage",
  "ram",
  "color",
  "processor",
  "operatingSystem",
  "screenSize",
  "connectivity",
  "accessoryType",
  "compatibility",
  "batteryHealth",
  "ptaStatus",
  "cpidStatus",
  "warranty",
  "trust",
] as const;

export type FilterGroupId = (typeof FILTER_GROUP_IDS)[number];

/** Kept open while browsing so buyers can always re-scope the feed. */
export const PRIMARY_FILTER_GROUPS: ReadonlySet<FilterGroupId> = new Set([
  "category",
  "brand",
  "condition",
  "price",
  "city",
]);

/** Number of narrowing transformations applied to the feed. */
export function countActiveFilters(filters: ListingFilters): number {
  return [
    filters.q,
    filters.category,
    filters.brand,
    filters.condition,
    filters.city,
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.storage,
    filters.ram,
    filters.color,
    filters.batteryHealthMin !== undefined,
    filters.ptaStatus,
    filters.cpidStatus,
    filters.warranty,
    filters.processor,
    filters.operatingSystem,
    filters.screenSize,
    filters.connectivity,
    filters.accessoryType,
    filters.compatibility,
    filters.isInspected,
    filters.isVerifiedSeller,
    filters.isDealer,
  ].filter(Boolean).length;
}

export function hasActiveFilters(filters: ListingFilters): boolean {
  return countActiveFilters(filters) > 0;
}

/** Groups containing at least one active value — never auto-collapsed. */
export function getActiveFilterGroups(filters: ListingFilters): ReadonlySet<FilterGroupId> {
  const groups = new Set<FilterGroupId>();
  const include = (id: FilterGroupId, active: boolean) => {
    if (active) groups.add(id);
  };

  include("category", Boolean(filters.category));
  include("brand", Boolean(filters.brand));
  include("condition", Boolean(filters.condition));
  include("price", filters.minPrice !== undefined || filters.maxPrice !== undefined);
  include("city", Boolean(filters.city));
  include("storage", Boolean(filters.storage));
  include("ram", Boolean(filters.ram));
  include("color", Boolean(filters.color));
  include("processor", Boolean(filters.processor));
  include("operatingSystem", Boolean(filters.operatingSystem));
  include("screenSize", Boolean(filters.screenSize));
  include("connectivity", Boolean(filters.connectivity));
  include("accessoryType", Boolean(filters.accessoryType));
  include("compatibility", Boolean(filters.compatibility));
  include("batteryHealth", filters.batteryHealthMin !== undefined);
  include("ptaStatus", Boolean(filters.ptaStatus));
  include("cpidStatus", Boolean(filters.cpidStatus));
  include("warranty", Boolean(filters.warranty));
  include("trust", Boolean(filters.isInspected || filters.isVerifiedSeller || filters.isDealer));

  return groups;
}
