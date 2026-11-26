import { LISTING_CONDITION_LABELS } from "@/lib/constants";
import { getDemoListings } from "@/features/marketplace/data/fixtures";
import type { Region } from "@/lib/generated/prisma/enums";
import type { AttributePair, ListingCardData, ListingDetail } from "@/types/marketplace";

/** Best-effort spec extraction from a demo title (e.g. "12GB/256GB"). */
function parseSpecs(title: string): AttributePair[] {
  const pairs: AttributePair[] = [];
  const combo = title.match(/(\d+)\s?GB\s?\/\s?(\d+)\s?GB/i);
  if (combo?.[1] && combo[2]) {
    pairs.push({ label: "RAM", value: `${combo[1]}GB` });
    pairs.push({ label: "Storage", value: `${combo[2]}GB` });
  } else {
    const storage = title.match(/(\d+)\s?(GB|TB)\b/i);
    if (storage?.[1] && storage[2]) {
      pairs.push({ label: "Storage", value: `${storage[1]}${storage[2].toUpperCase()}` });
    }
  }
  return pairs;
}

function toDemoDetail(card: ListingCardData, region?: Region): ListingDetail {
  const conditionLabel = LISTING_CONDITION_LABELS[card.condition];
  const isPakistan = region !== "BAHRAIN";
  const ptaApproved = isPakistan && /pta/i.test(card.title);

  const attributes: AttributePair[] = [];
  if (card.brand) attributes.push({ label: "Brand", value: card.brand });
  attributes.push(...parseSpecs(card.title));
  attributes.push({ label: "Condition", value: conditionLabel });
  if (ptaApproved) attributes.push({ label: "PTA Approved", value: "Yes" });

  return {
    id: card.id,
    title: card.title,
    slug: card.slug,
    description: `${card.title} in ${conditionLabel.toLowerCase()} condition, available in ${card.city}. ${
      card.negotiable ? "Price is negotiable — serious buyers only. " : ""
    }Meet in a safe public place and inspect the device before purchase. Box and accessories included where applicable.`,
    price: card.price,
    currency: card.currency ?? (isPakistan ? "PKR" : "BHD"),
    region: card.region ?? (isPakistan ? "PAKISTAN" : "BAHRAIN"),
    condition: card.condition,
    negotiable: Boolean(card.negotiable),
    city: card.city,
    brand: card.brand,
    brandSlug: card.brandSlug,
    categorySlug: card.categorySlug,
    isFeatured: Boolean(card.isFeatured),
    views: card.views ?? 0,
    createdAt: card.createdAt,
    images: (card.imageUrls ?? (card.imageUrl ? [card.imageUrl] : [])).map((url) => ({ url })),
    attributes,
    seller: {
      name: "GenTech Seller",
      city: card.city,
      memberSince: new Date(Date.now() - 400 * 86_400_000).toISOString(),
      rating: 4.8,
      reviewCount: 24,
    },
  };
}

export function getDemoListingDetail(slug: string, region?: Region): ListingDetail | null {
  const card = getDemoListings(region).find((listing) => listing.slug === slug);
  return card ? toDemoDetail(card, region) : null;
}

export function getDemoRelated(
  categorySlug: string | undefined,
  excludeId: string,
  region?: Region,
  limit = 4,
): ListingCardData[] {
  return getDemoListings(region).filter(
    (listing) =>
      listing.id !== excludeId && (!categorySlug || listing.categorySlug === categorySlug),
  ).slice(0, limit);
}
