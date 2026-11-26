import "server-only";

import type { ListingStatus } from "@/lib/constants";
import { deleteRawUpload } from "@/lib/cloudinary";
import type { SellerListingRow, SellerStats } from "@/features/seller/types";
import type { UploadedModel } from "@/features/listings/schemas/create-listing";
import {
  getSellerListings,
  getSellerStats,
  replaceOwnedListingModel,
  setListingStatus,
  softDeleteListing,
} from "@/features/seller/repositories/seller.repository";

const EMPTY_STATS: SellerStats = {
  totalListings: 0,
  activeListings: 0,
  soldListings: 0,
  totalViews: 0,
  totalFavorites: 0,
};

/** Seller stats. Returns zeroed stats if the database is unavailable. */
export async function getStats(sellerId: string): Promise<SellerStats> {
  try {
    return await getSellerStats(sellerId);
  } catch (error) {
    console.warn(
      "[seller] Could not load stats.",
      error instanceof Error ? error.message : error,
    );
    return EMPTY_STATS;
  }
}

/** A seller's listings for the management view. Empty list if the DB is unavailable. */
export async function getListings(
  sellerId: string,
  status?: ListingStatus,
): Promise<SellerListingRow[]> {
  try {
    return await getSellerListings(sellerId, status);
  } catch (error) {
    console.warn(
      "[seller] Could not load listings.",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

/**
 * Changes a listing's status on behalf of its owner. Returns `false` when the
 * listing does not exist or is not owned by the seller (authorization via scoping).
 */
export async function changeListingStatus(
  sellerId: string,
  listingId: string,
  status: ListingStatus,
): Promise<boolean> {
  const affected = await setListingStatus(sellerId, listingId, status);
  return affected > 0;
}

/** Soft-deletes a listing on behalf of its owner. */
export async function removeListing(sellerId: string, listingId: string): Promise<boolean> {
  const affected = await softDeleteListing(sellerId, listingId);
  return affected > 0;
}

/** Replaces/removes the seller's own model and cleans up superseded raw files. */
export async function saveListingModel(
  sellerId: string,
  listingId: string,
  model: UploadedModel | null,
): Promise<boolean> {
  const result = await replaceOwnedListingModel(sellerId, listingId, model);
  if (!result.ok) return false;

  const activeIds = new Set(
    model ? [model.publicId, ...model.assets.map((asset) => asset.publicId)] : [],
  );
  await Promise.all(
    result.previousPublicIds
      .filter((publicId) => !activeIds.has(publicId))
      .map((publicId) => deleteRawUpload(publicId)),
  );
  return true;
}
