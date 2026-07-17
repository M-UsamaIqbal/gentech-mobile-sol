import "server-only";

import type {
  ListingCardData,
  ListingDetail,
  ListingFilters,
  ListingSearchResult,
} from "@/types/marketplace";
import type { CreateListingInput } from "@/features/listings/schemas/create-listing";
import {
  createListing as createListingRecord,
  getListingBySlug,
  getRelatedListings,
  getSellerListings,
  searchListings,
  searchListingsRanked,
} from "../repositories/listing.repository";
import { searchDemoListings } from "../data/demo-source";
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
export async function getListingFeed(filters: ListingFilters): Promise<ListingFeed> {
  try {
    const result = filters.q ? await rankedThenOrm(filters) : await searchListings(filters);
    return { ...result, source: "db" };
  } catch (error) {
    console.warn(
      "[listings] Database unavailable — serving demo data.",
      error instanceof Error ? error.message : error,
    );
    return { ...searchDemoListings(filters), source: "demo" };
  }
}

/**
 * Prefer ranked full-text search; if the FTS column/index isn't present yet
 * (e.g. migrations not run), fall back to the ORM `contains` search. A genuine
 * DB outage rethrows so the caller can serve demo data.
 */
async function rankedThenOrm(filters: ListingFilters): Promise<ListingSearchResult> {
  try {
    return await searchListingsRanked(filters);
  } catch (error) {
    console.warn(
      "[listings] Full-text search unavailable — falling back to basic search.",
      error instanceof Error ? error.message : error,
    );
    return searchListings(filters);
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
export async function getListingDetail(slug: string): Promise<ListingDetailResult | null> {
  try {
    const detail = await getListingBySlug(slug);
    if (!detail) {
      // Reachable DB but no such listing. It may still be a demo/preview card
      // (e.g. shown while the catalog is being populated) — resolve it to the
      // demo detail instead of 404ing. Unknown slugs still return null → 404.
      const demo = getDemoListingDetail(slug);
      if (demo) {
        return { detail: demo, related: getDemoRelated(demo.categorySlug, demo.id), source: "demo" };
      }
      return null;
    }
    const related = await getRelatedListings(detail.categorySlug, detail.id);
    return { detail, related, source: "db" };
  } catch (error) {
    console.warn(
      "[listings] Database unavailable for detail — serving demo data.",
      error instanceof Error ? error.message : error,
    );
    const detail = getDemoListingDetail(slug);
    if (!detail) return null;
    return { detail, related: getDemoRelated(detail.categorySlug, detail.id), source: "demo" };
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
