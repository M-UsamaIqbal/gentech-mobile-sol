import { ROUTES } from "@/lib/constants";
import { getListingFeed } from "@/features/listings/services/listing.service";
import { getCategoriesWithCounts } from "@/features/marketplace/services/category.service";
import {
  DEMO_CATEGORIES,
  DEMO_FEATURED_LISTINGS,
  DEMO_LATEST_LISTINGS,
} from "@/features/marketplace/data/fixtures";
import type { ListingCardData } from "@/types/marketplace";
import { HomeHero } from "@/features/marketplace/components/home-hero";
import { CategoryGrid } from "@/features/marketplace/components/category-grid";
import { ListingsGrid } from "@/features/marketplace/components/listings-grid";
import { SectionHeader } from "@/features/marketplace/components/section-header";
import { HowItWorks } from "@/features/marketplace/components/how-it-works";
import { CtaBand } from "@/features/marketplace/components/cta-band";

/**
 * Real listings first, then demo fixtures fill the remaining slots so the grid
 * always looks populated during early catalog growth. Deduped by slug. Every
 * card is clickable — demo slugs resolve to a demo detail page (see listing.service).
 */
function withDemoFill(
  real: ListingCardData[],
  demo: ListingCardData[],
  limit = 8,
): ListingCardData[] {
  const seen = new Set(real.map((item) => item.slug));
  const filler = demo.filter((item) => !seen.has(item.slug));
  return [...real, ...filler].slice(0, limit);
}

export default async function HomePage() {
  // Real listings + real category counts from the DB (both fail-soft).
  const [feed, categories] = await Promise.all([
    getListingFeed({ sort: "recent", page: 1, pageSize: 8 }),
    getCategoriesWithCounts(8),
  ]);

  const featuredReal = feed.items.filter((item) => item.isFeatured);
  const featured = withDemoFill(
    featuredReal.length > 0 ? featuredReal : feed.items,
    DEMO_FEATURED_LISTINGS,
  );
  const latest = withDemoFill(feed.items, DEMO_LATEST_LISTINGS);

  return (
    <>
      <HomeHero popularCategories={DEMO_CATEGORIES} />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeader title="Browse categories" href={ROUTES.marketplace} />
        <CategoryGrid categories={categories} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <SectionHeader
          title="Featured listings"
          description="Hand-picked deals from trusted sellers"
          href={`${ROUTES.marketplace}?featured=1`}
        />
        <ListingsGrid listings={featured} />
      </section>

      <HowItWorks />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeader
          title="Latest listings"
          description="Fresh ads posted near you"
          href={ROUTES.marketplace}
        />
        <ListingsGrid listings={latest} />
      </section>

      <CtaBand />
    </>
  );
}
