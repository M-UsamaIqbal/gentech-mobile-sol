import type { ListingCardData } from "@/types/marketplace";
import type { PhoneModelWithBrand } from "@/features/phone-intelligence/repositories/phone-model.repository";

const normalize = (value: string | undefined | null): string =>
  (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Scores how strongly a listing describes a catalog phone model. */
export function scoreListingModelMatch(
  listing: Pick<ListingCardData, "title" | "brand" | "brandSlug" | "model" | "modelNumber">,
  model: Pick<PhoneModelWithBrand, "name" | "slug" | "modelNumber"> & {
    brand: { name: string; slug: string };
  },
): number {
  const title = normalize(listing.title);
  const listingModel = normalize(listing.model);
  const listingModelNumber = normalize(listing.modelNumber);
  const modelName = normalize(model.name);
  const modelSlug = normalize(model.slug);
  const modelNumber = normalize(model.modelNumber);
  const brand = normalize(listing.brandSlug ?? listing.brand);
  const modelBrand = normalize(model.brand.slug ?? model.brand.name);
  const brandBonus = brand && brand === modelBrand ? 10 : 0;

  if (listingModelNumber && modelNumber && listingModelNumber === modelNumber) {
    return 100 + brandBonus;
  }
  if (listingModel && modelName && listingModel === modelName) return 95 + brandBonus;
  if (listingModel && modelSlug && listingModel === modelSlug) return 95 + brandBonus;
  if (modelNumber && (title.includes(modelNumber) || listingModel.includes(modelNumber))) {
    return 90 + brandBonus;
  }

  const nameTokens = modelName.split(" ").filter((token) => token.length >= 3);
  if (nameTokens.length === 0) return 0;
  const matchedTokens = nameTokens.filter((token) => title.includes(token) || listingModel.includes(token));
  if (matchedTokens.length === 0) return 0;

  const coverage = matchedTokens.length / nameTokens.length;
  return Math.round(coverage * 70) + brandBonus;
}

/** Best catalog model for a listing, or null when the listing cannot be mapped. */
export function resolvePhoneModelForListing(
  listing: Pick<ListingCardData, "title" | "brand" | "brandSlug" | "model" | "modelNumber">,
  models: Array<
    Pick<PhoneModelWithBrand, "name" | "slug" | "modelNumber"> & {
      brand: { name: string; slug: string };
    }
  >,
): PhoneModelWithBrand | null {
  let best: PhoneModelWithBrand | null = null;
  let bestScore = 0;

  for (const model of models) {
    const score = scoreListingModelMatch(listing, model);
    if (score > bestScore) {
      best = model as PhoneModelWithBrand;
      bestScore = score;
    }
  }

  return bestScore >= 30 ? best : null;
}
