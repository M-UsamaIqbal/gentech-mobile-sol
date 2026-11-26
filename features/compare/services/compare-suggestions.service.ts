import "server-only";

import type { Region } from "@/lib/generated/prisma/enums";
import type { ListingCardData } from "@/types/marketplace";
import {
  getListingCardsByIds,
  getListingsByModelNames,
  getRelatedListings,
} from "@/features/listings/repositories/listing.repository";
import { getFavoriteListingIds } from "@/features/favorites/services/favorite.service";
import { getDemoRelated } from "@/features/listings/data/demo-detail";
import { comparisonService } from "@/features/phone-intelligence/services/comparison.service";
import { phoneModelRepository } from "@/features/phone-intelligence/repositories/phone-model.repository";

export type CompareSuggestions = {
  favorites: ListingCardData[];
  previous: ListingCardData[];
  suggested: ListingCardData[];
};

function attributeValue(
  attributes: Array<{ label: string; value: string }>,
  label: string,
): string | undefined {
  return attributes.find((attribute) => attribute.label === label)?.value;
}

/** Builds a card-shaped object from the detail page view model. */
export function toCompareCurrent(
  detail: import("@/types/marketplace").ListingDetail,
  region: Region,
): ListingCardData {
  const attrs = detail.attributes as Array<{ label: string; value: string }>;
  return {
    id: detail.id,
    title: detail.title,
    slug: detail.slug,
    price: detail.price,
    currency: detail.currency,
    region,
    condition: detail.condition,
    city: detail.city,
    brand: detail.brand,
    brandSlug: detail.brandSlug,
    categorySlug: detail.categorySlug,
    imageUrl: detail.images[0]?.url,
    imageUrls: detail.images.map((image) => image.url),
    createdAt: detail.createdAt,
    model: attributeValue(attrs, "Model"),
    modelNumber: attributeValue(attrs, "Model Number"),
  };
}

/**
 * Returns comparison candidates for a detail page. Every branch is region-scoped,
 * so a Bahrain listing never receives Pakistan inventory (or vice versa).
 */
export async function getCompareSuggestions({
  current,
  user,
  region,
  useDemo = false,
}: {
  current: ListingCardData;
  user: { id: string } | null;
  region: Region;
  useDemo?: boolean;
}): Promise<CompareSuggestions> {
  const seen = new Set<string>([current.id]);
  const keep = (items: ListingCardData[], limit: number): ListingCardData[] => {
    const result: ListingCardData[] = [];
    for (const item of items) {
      if (seen.has(item.id) || item.region !== region) continue;
      seen.add(item.id);
      result.push(item);
      if (result.length >= limit) break;
    }
    return result;
  };

  let favorites: ListingCardData[] = [];
  let previous: ListingCardData[] = [];
  let suggested: ListingCardData[] = [];

  if (useDemo) {
    // The detail page is showing preview cards; offer other preview cards so
    // comparison still works when the database has no inventory for this region.
    suggested = keep(getDemoRelated(current.categorySlug, current.id, region, 8), 4);
    return { favorites, previous, suggested };
  }

  // A database outage must degrade to preview suggestions, not a 500.
  try {
    if (user) {
      const [favoriteIds, comparisons] = await Promise.all([
        getFavoriteListingIds(user.id),
        comparisonService.getUserComparisons(user.id),
      ]);
      const favoriteCards = await getListingCardsByIds(favoriteIds, region);
      favorites = keep(favoriteCards, 4);

      const modelIds = [...new Set(comparisons.flatMap((row) => row.phoneIds))].slice(0, 8);
      const models = modelIds.length > 0 ? await phoneModelRepository.findByIds(modelIds) : [];
      const modelNames = models.flatMap(
        (model) => [model.name, model.modelNumber].filter(Boolean) as string[],
      );
      previous = keep(await getListingsByModelNames(modelNames, region, current.id, 6), 4);
    }

    suggested = keep(await getRelatedListings(current.categorySlug, current.id, 8, region), 4);
  } catch (error) {
    console.warn(
      "[compare] Database unavailable — using preview suggestions.",
      error instanceof Error ? error.message : error,
    );
    suggested = keep(getDemoRelated(current.categorySlug, current.id, region, 8), 4);
  }

  return { favorites, previous, suggested };
}
