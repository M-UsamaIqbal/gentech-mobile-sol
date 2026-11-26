import { ArrowRight, BadgeCheck, MapPin, ShieldCheck } from "lucide-react";

import { getServerTranslations } from "@/lib/i18n/get-server-translations";
import { ROUTES } from "@/lib/constants";
import { LocalizedLink } from "@/components/localized-link";
import type { CategoryItem, ListingCardData } from "@/types/marketplace";
import { ListingCard } from "./listing-card";
import { MobileCategoryGrid } from "./mobile-category-grid";

type Props = {
  countryName: string;
  categories: CategoryItem[];
  featured: ListingCardData[];
  latest: ListingCardData[];
  favoriteIds: string[];
  isAuthenticated: boolean;
};

function SectionTitle({
  title,
  href,
  seeAllLabel,
}: {
  title: string;
  href: string;
  seeAllLabel: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <LocalizedLink href={href} className="text-brand shrink-0 text-xs font-semibold">
        {seeAllLabel}
      </LocalizedLink>
    </div>
  );
}

/** Phone-first home screen: promo, quick categories, trust row and deal rails. */
export async function MobileHomeFeed({
  countryName,
  categories,
  featured,
  latest,
  favoriteIds,
  isAuthenticated,
}: Props) {
  const t = await getServerTranslations("homepage");
  const tCommon = await getServerTranslations("common");
  const tCta = await getServerTranslations("cta");
  const favorites = new Set(favoriteIds);
  const trustItems = [
    { icon: BadgeCheck, label: t("trustVerified") },
    { icon: ShieldCheck, label: t("trustInspected") },
    { icon: MapPin, label: t("trustNearby") },
  ];

  return (
    <div className="space-y-7 px-3 pt-4 pb-4">
      <section className="bg-brand-soft border-brand/15 relative overflow-hidden rounded-2xl border p-4">
        <span
          aria-hidden="true"
          className="bg-brand absolute -end-10 -top-10 size-32 rounded-full opacity-10"
        />
        <p className="text-brand text-xs font-semibold tracking-wide">{countryName}</p>
        <h1 className="mt-1 text-2xl leading-tight font-semibold text-balance">{t("heroTitle")}</h1>
        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
          {t("heroSubtitle", { country: countryName })}
        </p>
        <LocalizedLink
          href={ROUTES.marketplace}
          className="bg-brand text-brand-foreground mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
        >
          {tCommon("seeAll")}
          <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
        </LocalizedLink>
      </section>

      <section>
        <SectionTitle
          title={t("browseByCategory")}
          href={ROUTES.categories}
          seeAllLabel={tCommon("seeAll")}
        />
        <MobileCategoryGrid categories={categories.slice(0, 8)} />
      </section>

      <section className="bg-card grid grid-cols-3 gap-1 rounded-xl border p-3">
        {trustItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex flex-col items-center gap-1.5 px-1 text-center">
              <Icon aria-hidden="true" className="text-brand size-5" />
              <span className="text-muted-foreground text-[11px] leading-tight font-medium">
                {item.label}
              </span>
            </div>
          );
        })}
      </section>

      {featured.length > 0 ? (
        <section>
          <SectionTitle
            title={t("featuredListings")}
            href={`${ROUTES.marketplace}?featured=1`}
            seeAllLabel={tCommon("seeAll")}
          />
          <div className="-mx-3 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto px-3 pb-2 [&::-webkit-scrollbar]:hidden">
            {featured.slice(0, 8).map((listing) => (
              <div key={listing.id} className="w-40 shrink-0 snap-start">
                <ListingCard
                  listing={listing}
                  isFavorite={favorites.has(listing.id)}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {latest.length > 0 ? (
        <section>
          <SectionTitle
            title={t("recentListings")}
            href={ROUTES.marketplace}
            seeAllLabel={tCommon("seeAll")}
          />
          <div className="grid grid-cols-2 gap-3">
            {latest.slice(0, 6).map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favorites.has(listing.id)}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-brand text-brand-foreground rounded-2xl p-4">
        <h2 className="text-lg font-semibold">{tCta("title")}</h2>
        <p className="mt-1 text-sm opacity-90">{tCta("body")}</p>
        <LocalizedLink
          href={ROUTES.sell}
          className="bg-background text-foreground mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
        >
          {tCta("button")}
          <ArrowRight aria-hidden="true" className="size-4 rtl:rotate-180" />
        </LocalizedLink>
      </section>
    </div>
  );
}
