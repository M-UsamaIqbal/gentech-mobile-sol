import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  getCountryFromParam,
  getLocaleFromParam,
  getRegionForCountry,
} from "@/lib/countries/server";
import { getCountryName } from "@/lib/countries";
import { ROUTES } from "@/lib/constants";
import { getListingFeed } from "@/features/listings/services/listing.service";
import { getCategoriesWithCounts } from "@/features/marketplace/services/category.service";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomeHero } from "@/features/marketplace/components/home-hero";
import { TrustStrip } from "@/features/marketplace/components/trust-strip";
import { TaglineReveal } from "@/components/marketing/tagline-reveal";
import { CategoryGrid } from "@/features/marketplace/components/category-grid";
import { ListingsGrid } from "@/features/marketplace/components/listings-grid";
import { SectionHeader } from "@/features/marketplace/components/section-header";
import { HowItWorks } from "@/features/marketplace/components/how-it-works";
import { CtaBand } from "@/features/marketplace/components/cta-band";
import { MobileHomeFeed } from "@/features/marketplace/components/mobile-home-feed";
import { getActiveLocationTree } from "@/features/locations/services/location.service";
import { getCurrentUser } from "@/lib/session";
import { getFavoriteListingIds } from "@/features/favorites/services/favorite.service";
import { localizedSeoMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ country: string; locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  setRequestLocale(resolvedLocale);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "homepage" });

  return {
    ...localizedSeoMetadata({ path: ROUTES.home, country: countryCode, locale: resolvedLocale }),
    title: t("heroTitle"),
    description: t("heroSubtitle", {
      country: getCountryName(countryCode, resolvedLocale),
    }),
  };
}

export default async function LocalizedHomepage({ params }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  setRequestLocale(locale);
  const region = getRegionForCountry(countryCode);
  const t = await getTranslations({ locale, namespace: "homepage" });
  const countryName = getCountryName(countryCode, locale);

  const [feed, categories, locations, user] = await Promise.all([
    getListingFeed({ sort: "recent", page: 1, pageSize: 8 }, region),
    getCategoriesWithCounts(8, region),
    getActiveLocationTree(countryCode),
    getCurrentUser(),
  ]);

  const featuredReal = feed.items.filter((item) => item.isFeatured);
  const featured = featuredReal.length > 0 ? featuredReal : feed.items;
  const latest = feed.items;
  const isAuthenticated = Boolean(user);
  const favoriteIds =
    isAuthenticated && user
      ? await getFavoriteListingIds(user.id, [
          ...new Set([...featured, ...latest].map((listing) => listing.id)),
        ])
      : [];

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <div className="md:hidden">
          <MobileHomeFeed
            countryName={countryName}
            categories={categories}
            featured={featured}
            latest={latest}
            favoriteIds={favoriteIds}
            isAuthenticated={isAuthenticated}
          />
        </div>

        <div className="hidden md:block">
          <HomeHero
            country={countryCode}
            locale={locale}
            popularCategories={categories}
            locations={locations}
            featuredListing={featured[0]}
          />

          <TrustStrip />

          <TaglineReveal text={t("tagline")} />

          <section className="mx-auto max-w-7xl px-4 py-12">
            <SectionHeader title={t("browseByCategory")} href={ROUTES.categories} />
            <CategoryGrid categories={categories} />
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-12">
            <SectionHeader
              title={t("featuredListings")}
              description={t("featuredDescription")}
              href={`${ROUTES.marketplace}?featured=1`}
            />
            <ListingsGrid
              listings={featured}
              favoriteIds={favoriteIds}
              isAuthenticated={isAuthenticated}
            />
          </section>

          <HowItWorks />

          <section className="mx-auto max-w-7xl px-4 py-12">
            <SectionHeader
              title={t("recentListings")}
              description={t("recentDescription")}
              href={ROUTES.marketplace}
            />
            <ListingsGrid
              listings={latest}
              favoriteIds={favoriteIds}
              isAuthenticated={isAuthenticated}
            />
          </section>

          <CtaBand />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
