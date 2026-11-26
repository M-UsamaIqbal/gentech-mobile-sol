import { z } from "zod";

import { PAGINATION, PTA_STATUS, CPID_STATUS, WARRANTY_TYPE } from "@/lib/constants";
import { sanitizeListingFilters } from "@/lib/catalog/category-filters";
import type { ListingFilters } from "@/types/marketplace";

export const LISTING_SORTS = ["recent", "price_asc", "price_desc", "popular"] as const;

export const SORT_LABELS: Record<(typeof LISTING_SORTS)[number], string> = {
  recent: "Newest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  popular: "Most popular",
};

/**
 * Parses raw URL search params into a normalised, validated filter set.
 * Unknown/invalid values fall back to safe defaults (`.catch`) rather than throwing,
 * so a hand-edited URL never 500s the marketplace.
 */
const schema = z.object({
  q: z.string().trim().min(1).max(100).optional().catch(undefined),
  category: z.string().trim().min(1).optional().catch(undefined),
  brand: z.string().trim().min(1).optional().catch(undefined),
  condition: z
    .enum(["NEW", "OPEN_BOX", "USED", "REFURBISHED", "FOR_PARTS"])
    .optional()
    .catch(undefined),
  city: z.string().trim().min(1).optional().catch(undefined),
  minPrice: z.coerce.number().int().nonnegative().optional().catch(undefined),
  maxPrice: z.coerce.number().int().positive().optional().catch(undefined),
  sort: z.enum(LISTING_SORTS).catch("recent"),
  page: z.coerce.number().int().min(1).catch(1),
  // Phone-specific filters
  storage: z.string().trim().min(1).max(40).optional().catch(undefined),
  ram: z.string().trim().min(1).max(40).optional().catch(undefined),
  color: z.string().trim().min(1).max(40).optional().catch(undefined),
  batteryHealthMin: z.coerce.number().int().min(0).max(100).optional().catch(undefined),
  ptaStatus: z
    .enum(Object.keys(PTA_STATUS) as [string, ...string[]])
    .optional()
    .catch(undefined),
  cpidStatus: z
    .enum(Object.keys(CPID_STATUS) as [string, ...string[]])
    .optional()
    .catch(undefined),
  warranty: z
    .enum(Object.keys(WARRANTY_TYPE) as [string, ...string[]])
    .optional()
    .catch(undefined),
  // Category-specific specification filters.
  processor: z.string().trim().min(1).max(40).optional().catch(undefined),
  operatingSystem: z.string().trim().min(1).max(40).optional().catch(undefined),
  screenSize: z.string().trim().min(1).max(20).optional().catch(undefined),
  connectivity: z.string().trim().min(1).max(40).optional().catch(undefined),
  accessoryType: z.string().trim().min(1).max(40).optional().catch(undefined),
  compatibility: z.string().trim().min(1).max(40).optional().catch(undefined),
  isInspected: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional()
    .catch(undefined),
  isVerifiedSeller: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional()
    .catch(undefined),
  isDealer: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional()
    .catch(undefined),
});

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Take the first value when a param arrives as an array. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseListingFilters(raw: RawSearchParams): ListingFilters {
  const parsed = schema.parse({
    q: first(raw.q),
    category: first(raw.category),
    brand: first(raw.brand),
    condition: first(raw.condition),
    city: first(raw.city),
    minPrice: first(raw.minPrice),
    maxPrice: first(raw.maxPrice),
    sort: first(raw.sort),
    page: first(raw.page),
    storage: first(raw.storage),
    ram: first(raw.ram),
    color: first(raw.color),
    batteryHealthMin: first(raw.batteryHealthMin),
    ptaStatus: first(raw.ptaStatus),
    cpidStatus: first(raw.cpidStatus),
    warranty: first(raw.warranty),
    processor: first(raw.processor),
    operatingSystem: first(raw.operatingSystem),
    screenSize: first(raw.screenSize),
    connectivity: first(raw.connectivity),
    accessoryType: first(raw.accessoryType),
    compatibility: first(raw.compatibility),
    isInspected: first(raw.isInspected),
    isVerifiedSeller: first(raw.isVerifiedSeller),
    isDealer: first(raw.isDealer),
  });

  // Guard against an inverted price range.
  const minPrice = parsed.minPrice;
  const maxPrice =
    parsed.maxPrice !== undefined && minPrice !== undefined && parsed.maxPrice < minPrice
      ? undefined
      : parsed.maxPrice;

  return sanitizeListingFilters({
    ...parsed,
    minPrice,
    maxPrice,
    pageSize: PAGINATION.defaultPageSize,
  });
}
