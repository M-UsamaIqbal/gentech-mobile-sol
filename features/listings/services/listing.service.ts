import "server-only";

import type { Region } from "@/lib/generated/prisma/enums";
import { categorySlugsForFilter } from "@/lib/catalog/category-filters";
import type {
  ListingCardData,
  ListingDetail,
  ListingFilters,
  ListingFilterOptions,
  ListingSearchResult,
} from "@/types/marketplace";
import type { CreateListingInput } from "@/features/listings/schemas/create-listing";
import {
  createListing as createListingRecord,
  getListingBySlug,
  getListingCardsByIds,
  getListingFilterOptions as getListingFilterOptionsRecord,
  getRelatedListings,
  getSellerListings,
  searchListings,
  searchListingsRanked,
} from "../repositories/listing.repository";
import { getDemoListings } from "@/features/marketplace/data/fixtures";
import { getDemoListingCardsByIds, searchDemoListings } from "../data/demo-source";
import { getDemoListingDetail, getDemoRelated } from "../data/demo-detail";

export interface ListingFeed extends ListingSearchResult {
  /** Where the data came from — lets the UI show a "preview data" hint. */
  source: "db" | "demo";
}

/**
 * Marketplace feed. Queries the database; if the database is unreachable (e.g. the
 * local preview has no Neon connection), transparently falls back to demo fixtures
 * so the experience stays interactive. A connected-but-empty DB correctly returns
 * an empty feed (source: "db").
 */
export async function getListingFeed(filters: ListingFilters, region?: Region): Promise<ListingFeed> {
  try {
    const result = filters.q
      ? await rankedThenOrm(filters, region)
      : await searchListings(filters, region);
    return { ...result, source: "db" };
  } catch (error) {
    console.warn(
      "[listings] Database unavailable — serving demo data.",
      error instanceof Error ? error.message : error,
    );
    return { ...searchDemoListings(filters, region), source: "demo" };
  }
}

/**
 * Resolves the exact ids shown by the marketplace. Uses the same repository and
 * the same preview fallback as `getListingFeed`, so an id in the grid never
 * disappears just because the caller queried a different path.
 */
export async function getSelectedListingCards(
  ids: string[],
  region?: Region,
): Promise<ListingCardData[]> {
  if (ids.length === 0) return [];
  try {
    return await getListingCardsByIds(ids, region);
  } catch (error) {
    console.warn(
      "[listings] Database unavailable for selected listings — using preview data.",
      error instanceof Error ? error.message : error,
    );
    return getDemoListingCardsByIds(ids, region);
  }
}

export async function getListingFilterOptions(
  region?: Region,
  category?: string,
): Promise<ListingFilterOptions> {
  try {
    return await getListingFilterOptionsRecord(region, category);
  } catch (error) {
    console.warn(
      "[listings] Could not load attribute filter options; using preview values.",
      error instanceof Error ? error.message : error,
    );
    const slugs = categorySlugsForFilter(category);
    const source = slugs.length > 0
      ? getDemoListings(region).filter((listing) =>
          listing.categorySlug ? slugs.includes(listing.categorySlug) : false,
        )
      : getDemoListings(region);
    const values = (key: "storage" | "ram" | "color") =>
      [
        ...new Set(
          source.map((listing) => listing[key]).filter(
            (value): value is string => typeof value === "string" && value.trim().length > 0,
          ),
        ),
      ].sort((a, b) => a.localeCompare(b));

    return { storage: values("storage"), ram: values("ram"), colors: values("color") };
  }
}

/**
 * Prefer ranked full-text search; if the FTS column/index isn't present yet
 * (e.g. migrations not run), fall back to the ORM `contains` search. A genuine
 * DB outage rethrows so the caller can serve demo data.
 */
async function rankedThenOrm(filters: ListingFilters, region?: Region): Promise<ListingSearchResult> {
  try {
    return await searchListingsRanked(filters, region);
  } catch (error) {
    console.warn(
      "[listings] Full-text search unavailable — falling back to basic search.",
      error instanceof Error ? error.message : error,
    );
    return searchListings(filters, region);
  }
}

export interface ListingDetailResult {
  detail: ListingDetail;
  related: ListingCardData[];
  source: "db" | "demo";
}

/**
 * Loads a listing detail by slug + related listings. Returns `null` when the listing
 * does not exist (→ 404). Falls back to demo data only when the database is unreachable.
 */
export async function getListingDetail(slug: string, region?: Region): Promise<ListingDetailResult | null> {
  try {
    const detail = await getListingBySlug(slug, region);
    if (!detail) {
      // Reachable DB but no such listing. It may still be a demo/preview card
      // (e.g. shown while the catalog is being populated) — resolve it to the
      // demo detail instead of 404ing. Unknown slugs still return null → 404.
      const demo = getDemoListingDetail(slug, region);
      if (demo) {
        return {
          detail: demo,
          related: getDemoRelated(demo.categorySlug, demo.id, region ?? demo.region),
          source: "demo",
        };
      }
      return null;
    }
    const related = await getRelatedListings(detail.categorySlug, detail.id, 4, region);
    return { detail, related, source: "db" };
  } catch (error) {
    console.warn(
      "[listings] Database unavailable for detail — serving demo data.",
      error instanceof Error ? error.message : error,
    );
    const detail = getDemoListingDetail(slug, region);
    if (!detail) return null;
    return {
      detail,
      related: getDemoRelated(detail.categorySlug, detail.id, region ?? detail.region),
      source: "demo",
    };
  }
}

/** Creates a listing on behalf of a seller. Business rules live here in later phases. */
export async function createListing(input: CreateListingInput, sellerId: string) {
  return createListingRecord(input, sellerId);
}

/** A seller's own listings. Returns an empty list if the database is unavailable. */
export async function getMyListings(sellerId: string): Promise<ListingCardData[]> {
  try {
    return await getSellerListings(sellerId);
  } catch (error) {
    console.warn(
      "[listings] Could not load seller listings.",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}
