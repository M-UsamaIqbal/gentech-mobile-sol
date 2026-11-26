import { ShieldCheck } from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/get-server-translations";
import { APP } from "@/lib/constants";
import { MOBILE_CAROUSEL_IMAGE_LIMIT } from "@/lib/mobile-carousel";
import { getCountryName } from "@/lib/countries";
import type { CountryCode, LocaleCode } from "@/lib/countries/types";
import type { CategoryItem, ListingCardData } from "@/types/marketplace";
import type { LocationTree } from "@/features/locations/services/location.service";
import { formatPrice } from "@/utils/format";
import { LocalizedLink } from "@/components/localized-link";
import { ProductImageCarousel } from "@/features/marketplace/components/product-image-carousel";
import { SearchBar } from "./search-bar";

export async function HomeHero({
  country,
  locale,
  popularCategories,
  locations,
  featuredListing,
}: {
  country: CountryCode;
  locale: LocaleCode;
  popularCategories: CategoryItem[];
  locations: LocationTree;
  featuredListing?: ListingCardData;
}) {
  const t = await getServerTranslations("homepage");
  const tSearch = await getServerTranslations("search");
  const tCategories = await getServerTranslations("categories");
  const countryName = getCountryName(country, locale);
  const heroImages = featuredListing?.imageUrls?.length
    ? featuredListing.imageUrls.slice(0, MOBILE_CAROUSEL_IMAGE_LIMIT)
    : featuredListing?.imageUrl
      ? [featuredListing.imageUrl]
      : [];

  return (
    <section aria-labelledby="home-hero-title" className="border-b border-brand/10 bg-brand-soft/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="max-w-[680px]">
          <p className="caption-3 text-muted-foreground flex items-center gap-2 uppercase tracking-wide">
            <span className="bg-brand text-brand-foreground grid size-6 place-items-center rounded-md text-xs font-semibold">
              {APP.name.charAt(0)}
            </span>
            {APP.name} · {countryName}
          </p>

          <h1
            id="home-hero-title"
            className="heading-1 mt-6 bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
          >
            {t("heroTitle")}
          </h1>

          <p className="body-3 text-muted-foreground mt-5 max-w-[680px]">
            {t("heroSubtitle", { country: countryName })}
          </p>

          <div className="mt-7">
            <SearchBar variant="hero" locations={locations} placeholder={tSearch("placeholder")} />
          </div>

          <p className="caption-2 text-muted-foreground mt-4 flex items-center gap-2">
            <ShieldCheck className="text-brand size-4" />
            {t("featuredDescription")}
          </p>

          {popularCategories.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="caption-2 text-muted-foreground">{t("popular")}</span>
              {popularCategories.slice(0, 5).map((category) => (
                <LocalizedLink
                  key={category.id}
                  href={`/marketplace?category=${category.slug}`}
                  className="bg-card hover:border-brand hover:text-brand rounded-lg border border-border/70 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {tCategories.has(category.slug)
                    ? tCategories(category.slug)
                    : category.name}
                </LocalizedLink>
              ))}
            </div>
          ) : null}
        </div>

        {featuredListing ? (
          <article className="surface-flat group overflow-hidden rounded-2xl border-brand/20 shadow-lg shadow-brand/5">
            <LocalizedLink
              href={`/listings/${featuredListing.slug}`}
              className="focus-visible:ring-ring block outline-none focus-visible:ring-2"
            >
              <div className="relative">
                <ProductImageCarousel
                  images={heroImages}
                  title={featuredListing.title}
                  fallback={
                    <div className="text-foreground/30 grid h-full place-items-center text-4xl font-semibold">
                      {featuredListing.brand?.charAt(0) ?? featuredListing.title.charAt(0)}
                    </div>
                  }
                />
                <span className="bg-brand text-brand-foreground caption-3 absolute start-3 top-3 z-10 rounded-md px-2 py-1 font-semibold uppercase tracking-wide">
                  {t("featuredListings")}
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <h2 className="title-2 line-clamp-2">{featuredListing.title}</h2>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="caption-4 text-muted-foreground">{t("featuredDescription")}</p>
                    <p className="text-brand mt-1 text-xl font-semibold">
                      {formatPrice(featuredListing.price, {
                        currency: featuredListing.currency,
                        locale,
                      })}
                    </p>
                  </div>
                  <p className="caption-2 text-muted-foreground">{featuredListing.city}</p>
                </div>
                {featuredListing.isInspected ? (
                  <p className="caption-4 text-muted-foreground mt-3 flex items-center gap-1.5">
                    <ShieldCheck className="text-brand size-4" />
                    {t("trustInspected")}
                  </p>
                ) : null}
              </div>
            </LocalizedLink>
          </article>
        ) : null}
      </div>
    </section>
  );
}
