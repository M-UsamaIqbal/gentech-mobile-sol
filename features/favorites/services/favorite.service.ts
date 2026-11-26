import "server-only";

import { getListingCardsByIds } from "@/features/listings/repositories/listing.repository";
import {
  listFavoriteIds,
  setFavorite as setFavoriteRecord,
} from "@/features/favorites/repositories/favorite.repository";
import type { ListingCardData } from "@/types/marketplace";

export async function getFavoriteListingIds(
  userId: string,
  listingIds?: string[],
): Promise<string[]> {
  return listFavoriteIds(userId, listingIds);
}

export async function getFavoriteListings(userId: string): Promise<ListingCardData[]> {
  const ids = await listFavoriteIds(userId);
  if (ids.length === 0) return [];
  return getListingCardsByIds(ids);
}

export async function setFavorite(
  userId: string,
  listingId: string,
  favorite: boolean,
): Promise<void> {
  await setFavoriteRecord(userId, listingId, favorite);
}
