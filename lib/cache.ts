/** Shared cache identifiers for cross-request reference data. */
export const CACHE_TAGS = {
  catalog: "catalog",
} as const;

/** Reference data is stable enough for an hourly cache with explicit invalidation. */
export const CATALOG_REVALIDATE_SECONDS = 60 * 60;
