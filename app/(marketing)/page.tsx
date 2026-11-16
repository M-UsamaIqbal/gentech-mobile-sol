import { ROUTES } from "@/lib/constants";
import { getListingFeed } from "@/features/listings/services/listing.service";
import { getCategoriesWithCounts } from "@/features/marketplace/services/category.service";
import { HomeHero } from "@/features/marketplace/components/home-hero";
import { CategoryGrid } from "@/features/marketplace/components/category-grid";
import { ListingsGrid } from "@/features/marketplace/components/listings-grid";
import { SectionHeader } from "@/features/marketplace/components/section-header";
import { HowItWorks } from "@/features/marketplace/components/how-it-works";
import { CtaBand } from "@/features/marketplace/components/cta-band";

export default async function HomePage() {
  // Real listings + real category counts from the DB (both fail-soft).
  const [feed, categories] = await Promise.all([
    getListingFeed({ sort: "recent", page: 1, pageSize: 8 }),
    getCategoriesWithCounts(8),
  ]);

  const featured = feed.items.filter((item) => item.isFeatured);
  const latest = feed.items;

  return (
    <>
      <HomeHero popularCategories={categories} />

      <section className="mx-auto max-w-6xl px-4 py-12">
        <SectionHeader title="Browse categories" href={ROUTES.marketplace} />
        <CategoryGrid categories={categories} />
      </section>

      {/* Featured only renders when real featured listings exist. */}
      {featured.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <SectionHeader
            title="Featured listings"
            description="Hand-picked deals from trusted sellers"
            href={`${ROUTES.marketplace}?featured=1`}
          />
          <ListingsGrid listings={featured} />
        </section>
      ) : null}

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
