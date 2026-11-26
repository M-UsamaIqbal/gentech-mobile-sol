import type { BrandItem, ListingCardData, ListingFilters } from "@/types/marketplace";

/** Attribute filter keys whose relevance depends on the selected category. */
export const CATEGORY_FILTER_KEYS = [
  "storage",
  "ram",
  "color",
  "batteryHealthMin",
  "ptaStatus",
  "cpidStatus",
  "warranty",
  "processor",
  "operatingSystem",
  "screenSize",
  "connectivity",
  "accessoryType",
  "compatibility",
] as const;

export type CategoryFilterKey = (typeof CATEGORY_FILTER_KEYS)[number];

export type CategoryKind = "phones" | "tablets" | "laptops" | "accessories" | "watches" | "all";

export interface CategoryFilterProfile {
  kind: CategoryKind;
  /** Category slugs represented by this profile, including descendants of root slugs. */
  slugs: readonly string[];
  /** Attribute filter keys that are meaningful for this profile. */
  filters: readonly CategoryFilterKey[];
}

const PHONE_FILTERS: readonly CategoryFilterKey[] = [
  "storage",
  "ram",
  "color",
  "batteryHealthMin",
  "ptaStatus",
  "cpidStatus",
  "warranty",
];

const TABLET_FILTERS: readonly CategoryFilterKey[] = [
  "storage",
  "ram",
  "color",
  "batteryHealthMin",
  "ptaStatus",
  "cpidStatus",
  "warranty",
  "processor",
  "operatingSystem",
  "screenSize",
  "connectivity",
];

const LAPTOP_FILTERS: readonly CategoryFilterKey[] = [
  "storage",
  "ram",
  "color",
  "warranty",
  "processor",
  "operatingSystem",
  "screenSize",
];

const ACCESSORY_FILTERS: readonly CategoryFilterKey[] = [
  "color",
  "warranty",
  "connectivity",
  "accessoryType",
  "compatibility",
];

const WATCH_FILTERS: readonly CategoryFilterKey[] = [
  "color",
  "warranty",
  "connectivity",
  "compatibility",
];

const ACCESSORY_SLUGS = [
  "accessories",
  "chargers-cables",
  "cases-covers",
  "power-banks",
  "earphones-headphones",
  "laptop-accessories",
  "tablet-accessories",
] as const;

/**
 * Profiles are keyed by every category slug a buyer can select. Root slugs expand
 * to their children so hierarchical categories never produce an empty feed.
 */
const PROFILES: Record<string, CategoryFilterProfile> = {
  all: { kind: "all", slugs: [], filters: PHONE_FILTERS },
  "mobile-phones": {
    kind: "phones",
    slugs: ["mobile-phones", "smartphones", "feature-phones", "smart-watches"],
    filters: PHONE_FILTERS,
  },
  smartphones: { kind: "phones", slugs: ["smartphones"], filters: PHONE_FILTERS },
  "feature-phones": { kind: "phones", slugs: ["feature-phones"], filters: PHONE_FILTERS },
  "smart-watches": { kind: "watches", slugs: ["smart-watches"], filters: WATCH_FILTERS },
  "laptops-tablets": {
    kind: "all",
    slugs: ["laptops-tablets", "laptops", "tablets"],
    filters: [...LAPTOP_FILTERS, ...TABLET_FILTERS].filter(
      (key, index, keys) => keys.indexOf(key) === index,
    ),
  },
  laptops: { kind: "laptops", slugs: ["laptops"], filters: LAPTOP_FILTERS },
  tablets: { kind: "tablets", slugs: ["tablets"], filters: TABLET_FILTERS },
  accessories: {
    kind: "accessories",
    slugs: [...ACCESSORY_SLUGS],
    filters: ACCESSORY_FILTERS,
  },
  "chargers-cables": {
    kind: "accessories",
    slugs: ["chargers-cables"],
    filters: ACCESSORY_FILTERS,
  },
  "cases-covers": { kind: "accessories", slugs: ["cases-covers"], filters: ACCESSORY_FILTERS },
  "power-banks": { kind: "accessories", slugs: ["power-banks"], filters: ACCESSORY_FILTERS },
  "earphones-headphones": {
    kind: "accessories",
    slugs: ["earphones-headphones"],
    filters: ACCESSORY_FILTERS,
  },
  "laptop-accessories": {
    kind: "accessories",
    slugs: ["laptop-accessories"],
    filters: ACCESSORY_FILTERS,
  },
  "tablet-accessories": {
    kind: "accessories",
    slugs: ["tablet-accessories"],
    filters: ACCESSORY_FILTERS,
  },
};

/** Returns the filter profile for a selected category slug (or the default feed). */
export function getCategoryFilterProfile(category?: string): CategoryFilterProfile {
  return (category && PROFILES[category]) || PROFILES.all!;
}

/** Category slugs that a filter selection should match, including child categories. */
export function categorySlugsForFilter(category?: string): readonly string[] {
  return getCategoryFilterProfile(category).slugs;
}

/** Brands that actually have listings in the selected category, in catalog order. */
export function filterBrandsForCategory(
  brands: BrandItem[],
  listings: readonly Pick<ListingCardData, "brandSlug" | "categorySlug">[],
  category?: string,
): BrandItem[] {
  const slugs = categorySlugsForFilter(category);
  if (slugs.length === 0) return brands;

  const available = new Set(
    listings
      .filter(
        (listing) =>
          listing.brandSlug && listing.categorySlug && slugs.includes(listing.categorySlug),
      )
      .map((listing) => listing.brandSlug!),
  );

  return brands.filter((brand) => available.has(brand.slug));
}

/**
 * Removes attributes that do not apply to the selected category. This keeps stale
 * params from a previous category out of both the UI and the database query.
 */
export function sanitizeListingFilters<T extends ListingFilters>(filters: T): T {
  const allowed = new Set<CategoryFilterKey>(getCategoryFilterProfile(filters.category).filters);
  const result = { ...filters };

  for (const key of CATEGORY_FILTER_KEYS) {
    if (!allowed.has(key)) delete result[key];
  }

  return result;
}

/** Curated option lists for dimensions not derived from listing attributes. */
export const PROCESSOR_OPTIONS = [
  "Apple M1",
  "Apple M2",
  "Apple M3",
  "Apple M4",
  "Intel Core i5",
  "Intel Core i7",
  "Intel Core i9",
  "AMD Ryzen 5",
  "AMD Ryzen 7",
  "Snapdragon 8 Gen 2",
  "Snapdragon 8 Gen 3",
  "Exynos 1380",
  "Exynos 2400",
  "Dimensity 9300",
] as const;

export const OPERATING_SYSTEM_OPTIONS = [
  "macOS",
  "Windows 11",
  "Windows 10",
  "Linux",
  "iOS",
  "iPadOS",
  "Android",
] as const;

export const SCREEN_SIZE_OPTIONS = ['11"', '12"', '13"', '14"', '15"', '16"'] as const;

export const CONNECTIVITY_OPTIONS = [
  "Wi-Fi",
  "Wi-Fi + Cellular",
  "USB-C",
  "USB-A",
  "Lightning",
  "Bluetooth",
  "HDMI",
] as const;

export const ACCESSORY_TYPE_OPTIONS = [
  "Case",
  "Charger",
  "Cable",
  "Power Bank",
  "Headphones",
  "Hub",
  "Keyboard",
  "Stylus",
  "Screen Protector",
] as const;

export const COMPATIBILITY_OPTIONS = ["iPhone", "Android", "iPad", "Laptop", "Universal"] as const;

/** Stable translation key for a curated specification option value. */
export function specOptionKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
