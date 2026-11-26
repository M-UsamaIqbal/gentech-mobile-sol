import "server-only";

import {
  listSavedSearchAlertCandidates,
  listSavedSearches,
  type SavedSearchItem,
} from "../repositories/saved-search.repository";
import {
  getListingAlertDetails,
  matchListingFilters,
} from "@/features/listings/repositories/listing.repository";
import { parseSavedSearchFilters } from "@/features/saved-searches/lib/search-filters";
import { NOTIFICATION_TYPES } from "@/lib/constants";
import { dispatchNotification } from "@/features/notifications/services/notification.service";

/** A user's saved searches. */
export async function getSavedSearches(userId: string): Promise<SavedSearchItem[]> {
  return listSavedSearches(userId);
}

/** Notifies opted-in users when an approved listing matches one or more searches. */
export async function notifySavedSearchMatches(listingId: string): Promise<void> {
  try {
    const listing = await getListingAlertDetails(listingId);
    if (!listing) return;

    const candidates = (await listSavedSearchAlertCandidates()).filter(
      (candidate) => candidate.userId !== listing.sellerId && candidate.query.trim().length > 0,
    );
    if (candidates.length === 0) return;

    const matchesByUser = new Map<string, { searchNames: string[]; searchIds: string[] }>();
    const batchSize = 50;

    for (let offset = 0; offset < candidates.length; offset += batchSize) {
      const batch = candidates.slice(offset, offset + batchSize);
      const filters = batch.map((candidate) => parseSavedSearchFilters(candidate.query));
      const matches = await matchListingFilters(listing.id, filters);

      batch.forEach((candidate, index) => {
        if (!matches[index]) return;
        const existing = matchesByUser.get(candidate.userId) ?? { searchNames: [], searchIds: [] };
        existing.searchNames.push(candidate.name);
        existing.searchIds.push(candidate.id);
        matchesByUser.set(candidate.userId, existing);
      });
    }

    await Promise.all(
      Array.from(matchesByUser, ([userId, matched]) =>
        dispatchNotification({
          userId,
          type: NOTIFICATION_TYPES.SAVED_SEARCH_MATCH,
          title: "A new listing matches your search",
          body: `${listing.title} matches ${matched.searchNames.length === 1 ? `“${matched.searchNames[0]}”` : "one of your saved searches"}.`,
          url: `/listings/${listing.slug}`,
          data: { listingId: listing.id, savedSearchIds: matched.searchIds },
          email: true,
        }),
      ),
    );
  } catch (error) {
    console.error("[saved-search] Could not deliver matching-listing alerts.", error);
  }
}
