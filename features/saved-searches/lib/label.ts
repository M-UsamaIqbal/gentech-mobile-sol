import { LISTING_CONDITION_LABELS, type ListingCondition } from "@/lib/constants";
import { DEMO_BRANDS, DEMO_CATEGORIES } from "@/features/marketplace/data/fixtures";

/** Builds a human-readable label from a marketplace query string. */
export function buildSearchLabel(queryString: string): string {
  const params = new URLSearchParams(queryString);
  const parts: string[] = [];

  const q = params.get("q");
  if (q) parts.push(`“${q}”`);

  const category = params.get("category");
  if (category) {
    parts.push(DEMO_CATEGORIES.find((c) => c.slug === category)?.name ?? category);
  }

  const brand = params.get("brand");
  if (brand) {
    parts.push(DEMO_BRANDS.find((b) => b.slug === brand)?.name ?? brand);
  }

  const condition = params.get("condition") as ListingCondition | null;
  if (condition && condition in LISTING_CONDITION_LABELS) {
    parts.push(LISTING_CONDITION_LABELS[condition]);
  }

  const city = params.get("city");
  if (city) parts.push(city);

  const min = params.get("minPrice");
  const max = params.get("maxPrice");
  if (min || max) parts.push(`PKR ${min || "0"}–${max || "∞"}`);

  for (const key of [
    "storage",
    "ram",
    "color",
    "processor",
    "operatingSystem",
    "screenSize",
    "connectivity",
    "accessoryType",
    "compatibility",
    "batteryHealthMin",
    "ptaStatus",
    "cpidStatus",
    "warranty",
  ]) {
    const value = params.get(key);
    if (value) parts.push(key === "batteryHealthMin" ? `${value}%+` : value);
  }

  return parts.length > 0 ? parts.join(" · ") : "All listings";
}
