import { cache } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Eye, MapPin, ShieldCheck } from "lucide-react";

import { APP_URL } from "@/lib/app-url";
import { ROUTES } from "@/lib/constants";
import {
  getCountryFromParam,
  getLocaleFromParam,
  getRegionForCountry,
} from "@/lib/countries/server";
import { formatPrice, formatRelativeTime } from "@/utils/format";
import { getCurrentUser } from "@/lib/session";
import { getListingDetail } from "@/features/listings/services/listing.service";
import {
  getInspectionPlans,
  getListingInspectionReport,
} from "@/features/inspections/services/inspection.service";
import { getPhoneHistory } from "@/features/phone-history/services/phone-history.service";
import type { PhoneHistoryEvent } from "@/features/phone-history/types";
import { ListingInspectionCta } from "@/features/inspections/components/listing-inspection-cta";
import { PublishedReportPanel } from "@/features/inspections/components/published-report-panel";
import { ListingGallery } from "@/features/listings/components/listing-gallery";
import { ListingSpecs } from "@/features/listings/components/listing-specs";
import { SellerCard } from "@/features/listings/components/seller-card";
import { MobileListingActions } from "@/features/listings/components/mobile-listing-actions";
import { LocationMap } from "@/features/listings/components/location-map";
import { ShareButton } from "@/features/listings/components/share-button";
import { FavoriteButton } from "@/features/marketplace/components/favorite-button";
import { CompareSuggestionsDialog } from "@/features/compare/components/compare-suggestions-dialog";
import {
  getCompareSuggestions,
  toCompareCurrent,
} from "@/features/compare/services/compare-suggestions.service";
import { ListingsGrid } from "@/features/marketplace/components/listings-grid";
import { SectionHeader } from "@/features/marketplace/components/section-header";
import { ViewListingTracker } from "@/features/analytics/components/view-listing-tracker";
import { JsonLd } from "@/components/seo/json-ld";
import { LocalizedLink } from "@/components/localized-link";
import { Badge } from "@/components/ui/badge";
import {
  absoluteUrl,
  localizedPath,
  localizedSeoMetadata,
  truncateDescription,
} from "@/lib/seo/metadata";
import {
  buildBreadcrumbStructuredData,
  buildListingStructuredData,
} from "@/lib/seo/structured-data";
import { getActiveLocationTree } from "@/features/locations/services/location.service";
import { getFavoriteListingIds } from "@/features/favorites/services/favorite.service";
import type { Region } from "@/lib/generated/prisma/enums";

const loadListing = cache((slug: string, region: Region) => getListingDetail(slug, region));

type PageProps = {
  params: Promise<{ country: string; locale: string; slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale: localeParam, slug } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const tErrors = await getTranslations({ locale, namespace: "errors" });
  const result = await loadListing(slug, getRegionForCountry(countryCode));
  if (!result) return { title: tErrors("notFound"), robots: { index: false, follow: false } };

  const { detail } = result;
  const description = truncateDescription(detail.description);
  const images = detail.images[0]?.url ? [detail.images[0].url] : undefined;
  const listingPath = `/listings/${detail.slug}`;

  return {
    ...localizedSeoMetadata({
      path: listingPath,
      country: countryCode,
      locale,
      openGraph: { title: detail.title, description, images },
    }),
    title: detail.title,
    description,
  };
}

export default async function LocalizedListingDetailPage({ params }: PageProps) {
  const { country, locale: localeParam, slug } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const region = getRegionForCountry(countryCode);
  const showPakistanSignals = countryCode === "PK";
  const [result, user] = await Promise.all([loadListing(slug, region), getCurrentUser()]);
  if (!result) notFound();

  const t = await getTranslations({ locale, namespace: "productDetails" });
  const tListings = await getTranslations({ locale, namespace: "listings" });
  const tCondition = await getTranslations({ locale, namespace: "condition" });
  const tNavigation = await getTranslations({ locale, namespace: "navigation" });
  const { detail, related } = result;
  const isAuthenticated = Boolean(user);
  const compareCurrent = toCompareCurrent(detail, region);

  const [inspectionPlans, publishedReport, phoneHistory, locations, favoriteIds, compareSuggestions] =
    await Promise.all([
      getInspectionPlans(),
      getListingInspectionReport(detail.id),
      getPhoneHistory(detail.id, 10),
      getActiveLocationTree(countryCode),
      isAuthenticated && user
        ? getFavoriteListingIds(user.id, [detail.id, ...related.map((listing) => listing.id)])
        : Promise.resolve([]),
      getCompareSuggestions({
        current: compareCurrent,
        user,
        region,
        useDemo: result.source === "demo",
      }),
    ]);

  const listingPath = `/listings/${detail.slug}`;
  const jsonLd = [
    buildListingStructuredData(detail, absoluteUrl(listingPath, APP_URL)),
    buildBreadcrumbStructuredData(
      [
        { name: tNavigation("home"), path: localizedPath(ROUTES.home, countryCode, locale) },
        {
          name: tNavigation("marketplace"),
          path: localizedPath(ROUTES.marketplace, countryCode, locale),
        },
        ...(detail.categorySlug
          ? [
              {
                name: detail.categoryName ?? detail.categorySlug,
                path: localizedPath(
                  `${ROUTES.marketplace}?category=${encodeURIComponent(detail.categorySlug)}`,
                  countryCode,
                  locale,
                ),
              },
            ]
          : []),
        { name: detail.title, path: localizedPath(listingPath, countryCode, locale) },
      ],
      APP_URL,
    ),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <ViewListingTracker
        id={detail.id}
        title={detail.title}
        price={detail.price}
        category={detail.categoryName ?? detail.categorySlug}
      />

      <MobileListingActions
        price={detail.price}
        currency={detail.currency}
        locale={locale}
        listingId={detail.id}
        listingTitle={detail.title}
        isAuthenticated={Boolean(user)}
      />

      <nav className="text-muted-foreground mb-4 flex flex-wrap items-center gap-1.5 text-sm">
        <LocalizedLink href={ROUTES.home} className="hover:text-foreground">
          {tNavigation("home")}
        </LocalizedLink>
        <span>/</span>
        <LocalizedLink href={ROUTES.marketplace} className="hover:text-foreground">
          {tNavigation("marketplace")}
        </LocalizedLink>
        {detail.categorySlug ? (
          <>
            <span>/</span>
            <LocalizedLink
              href={`${ROUTES.marketplace}?category=${detail.categorySlug}`}
              className="hover:text-foreground"
            >
              {detail.categoryName ?? detail.categorySlug}
            </LocalizedLink>
          </>
        ) : null}
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ListingGallery
            images={detail.images}
            title={detail.title}
            brand={detail.brand}
            model3d={detail.model3d}
          />

          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{detail.title}</h1>
              <div className="flex shrink-0 items-center gap-2">
                <CompareSuggestionsDialog
                  current={compareCurrent}
                  suggestions={compareSuggestions}
                />
                <FavoriteButton
                  listingId={detail.id}
                  initialIsFavorite={favoriteIds.includes(detail.id)}
                  isAuthenticated={isAuthenticated}
                  className="border"
                />
                <ShareButton title={detail.title} />
              </div>
            </div>
            <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1">
                <MapPin className="size-4" />
                {detail.area ? `${detail.area}, ` : ""}
                {detail.city}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-4" />
                {formatRelativeTime(detail.createdAt, locale)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="size-4" />
                {detail.views.toLocaleString(locale)} {tListings("views")}
              </span>
            </div>
          </div>

          {publishedReport ? <PublishedReportPanel report={publishedReport} /> : null}

          <section className="flex flex-wrap gap-2">
            {showPakistanSignals &&
            detail.attributes.some(
              (attribute) =>
                attribute.label === "PTA Status" && attribute.value === "PTA_APPROVED",
            ) ? (
              <Badge variant="outline" className="border-green-500 bg-green-50 text-green-700">
                <CheckCircle2 className="me-1 size-3" />
                {tListings("ptaApproved")}
              </Badge>
            ) : null}
            {showPakistanSignals &&
            detail.attributes.some(
              (attribute) =>
                attribute.label === "CPID Status" && attribute.value === "CPID_APPROVED",
            ) ? (
              <Badge variant="outline" className="border-blue-500 bg-blue-50 text-blue-700">
                <CheckCircle2 className="me-1 size-3" />
                {tListings("cpidApproved")}
              </Badge>
            ) : null}
            {publishedReport ? (
              <Badge variant="outline" className="border-purple-500 bg-purple-50 text-purple-700">
                <ShieldCheck className="me-1 size-3" />
                {tListings("inspected")}
              </Badge>
            ) : null}
            {detail.attributes.some(
              (attribute) => attribute.label === "Warranty" && attribute.value !== "NO_WARRANTY",
            ) ? (
              <Badge variant="outline" className="border-orange-500 bg-orange-50 text-orange-700">
                <CheckCircle2 className="me-1 size-3" />
                {t("warranty")}
              </Badge>
            ) : null}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("specifications")}</h2>
            <ListingSpecs attributes={detail.attributes} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("description")}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {detail.description}
            </p>
          </section>

          {phoneHistory.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">{t("phoneHistory")}</h2>
              <div className="space-y-2">
                {phoneHistory.map((event: PhoneHistoryEvent) => (
                  <div key={event.id} className="border-b pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{event.eventType}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(event.occurredAt).toLocaleDateString(locale)}
                      </span>
                    </div>
                    {event.title ? (
                      <p className="text-muted-foreground mt-1 text-sm">{event.title}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <LocationMap
            city={detail.city}
            area={detail.area}
            latitude={detail.latitude}
            longitude={detail.longitude}
          />
        </div>

        <aside className="space-y-4">
          <div className="bg-card sticky top-20 rounded-xl border p-4">
            <p className="text-primary text-3xl font-bold">
              {formatPrice(detail.price, { currency: detail.currency, locale })}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{tCondition(detail.condition)}</Badge>
              {detail.negotiable ? (
                <Badge variant="outline">{t("negotiable")}</Badge>
              ) : null}
              {detail.isFeatured ? (
                <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                  {tListings("featured")}
                </Badge>
              ) : null}
            </div>
          </div>

          <SellerCard
            seller={detail.seller}
            listingId={detail.id}
            listingTitle={detail.title}
            isAuthenticated={Boolean(user)}
          />

          <ListingInspectionCta
            listingId={detail.id}
            plans={inspectionPlans}
            isAuthenticated={Boolean(user)}
            defaultCity={detail.city}
            locations={locations}
            showPakistanSignals={showPakistanSignals}
            categorySlug={detail.categorySlug}
          />
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-12">
          <SectionHeader title={t("similarListings")} />
          <ListingsGrid
            listings={related}
            favoriteIds={favoriteIds}
            isAuthenticated={isAuthenticated}
          />
        </section>
      ) : null}

      <div aria-hidden="true" className="h-20 md:hidden" />

      <JsonLd data={jsonLd} />
    </div>
  );
}
