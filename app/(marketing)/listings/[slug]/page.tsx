import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Eye, MapPin } from "lucide-react";

import { APP_URL } from "@/lib/app-url";
import { LISTING_CONDITION_LABELS, ROUTES } from "@/lib/constants";
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
import { LocationMap } from "@/features/listings/components/location-map";
import { ShareButton } from "@/features/listings/components/share-button";
import { FavoriteButton } from "@/features/marketplace/components/favorite-button";
import { ListingsGrid } from "@/features/marketplace/components/listings-grid";
import { SectionHeader } from "@/features/marketplace/components/section-header";
import { ViewListingTracker } from "@/features/analytics/components/view-listing-tracker";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { getActiveLocationTree } from "@/features/locations/services/location.service";
import { getFavoriteListingIds } from "@/features/favorites/services/favorite.service";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, truncateDescription } from "@/lib/seo/metadata";
import {
  buildBreadcrumbStructuredData,
  buildListingStructuredData,
} from "@/lib/seo/structured-data";

/** Shared per-request loader → metadata + page reuse one fetch (one view increment). */
const loadListing = cache((slug: string) => getListingDetail(slug));

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadListing(slug);
  if (!result) return { title: "Listing not found" };

  const { detail } = result;
  const description = truncateDescription(detail.description);
  const images = detail.images[0]?.url ? [detail.images[0].url] : undefined;

  return {
    title: detail.title,
    description,
    openGraph: {
      title: detail.title,
      description,
      type: "website",
      images,
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [result, user] = await Promise.all([loadListing(slug), getCurrentUser()]);
  if (!result) notFound();

  const { detail, related } = result;
  const isAuthenticated = Boolean(user);

  // Inspection service data (fail-soft): pricing packages + any published report.
  const [inspectionPlans, publishedReport, phoneHistory, locations, favoriteIds] =
    await Promise.all([
      getInspectionPlans(),
      getListingInspectionReport(detail.id),
      getPhoneHistory(detail.id, 10),
      getActiveLocationTree(),
      isAuthenticated && user
        ? getFavoriteListingIds(user.id, [detail.id, ...related.map((listing) => listing.id)])
        : Promise.resolve([]),
    ]);

  const listingPath = `/listings/${detail.slug}`;
  const jsonLd = [
    buildListingStructuredData(detail, absoluteUrl(listingPath, APP_URL)),
    buildBreadcrumbStructuredData(
      [
        { name: "Home", path: ROUTES.home },
        { name: "Marketplace", path: ROUTES.marketplace },
        ...(detail.categorySlug
          ? [
              {
                name: detail.categoryName ?? detail.categorySlug,
                path: `${ROUTES.marketplace}?category=${encodeURIComponent(detail.categorySlug)}`,
              },
            ]
          : []),
        { name: detail.title, path: listingPath },
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

      {/* Breadcrumbs */}
      <nav className="text-muted-foreground mb-4 flex flex-wrap items-center gap-1.5 text-sm">
        <Link href={ROUTES.home} className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link href={ROUTES.marketplace} className="hover:text-foreground">
          Marketplace
        </Link>
        {detail.categorySlug ? (
          <>
            <span>/</span>
            <Link
              href={`${ROUTES.marketplace}?category=${detail.categorySlug}`}
              className="hover:text-foreground"
            >
              {detail.categoryName ?? detail.categorySlug}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
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
                {formatRelativeTime(detail.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="size-4" />
                {detail.views.toLocaleString()} views
              </span>
            </div>
          </div>

          {publishedReport ? <PublishedReportPanel report={publishedReport} /> : null}

          {/* Trust Badges */}
          <section className="flex flex-wrap gap-2">
            {detail.attributes.find(
              (a) => a.label === "PTA Status" && a.value === "PTA_APPROVED",
            ) && (
              <Badge variant="outline" className="border-green-500 bg-green-50 text-green-700">
                <CheckCircle2 className="mr-1 size-3" />
                PTA Approved
              </Badge>
            )}
            {detail.attributes.find(
              (a) => a.label === "CPID Status" && a.value === "CPID_APPROVED",
            ) && (
              <Badge variant="outline" className="border-blue-500 bg-blue-50 text-blue-700">
                <CheckCircle2 className="mr-1 size-3" />
                CPID Verified
              </Badge>
            )}
            {publishedReport && (
              <Badge variant="outline" className="border-purple-500 bg-purple-50 text-purple-700">
                <ShieldCheck className="mr-1 size-3" />
                Inspected
              </Badge>
            )}
            {detail.attributes.find((a) => a.label === "Warranty" && a.value !== "NO_WARRANTY") && (
              <Badge variant="outline" className="border-orange-500 bg-orange-50 text-orange-700">
                <CheckCircle2 className="mr-1 size-3" />
                Warranty
              </Badge>
            )}
          </section>

          <ListingSpecs attributes={detail.attributes} />

          <section>
            <h2 className="mb-3 text-lg font-semibold">Description</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {detail.description}
            </p>
          </section>

          {phoneHistory.length > 0 ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold">Phone History</h2>
              <div className="space-y-2">
                {phoneHistory.map((event: PhoneHistoryEvent) => (
                  <div key={event.id} className="border-b pb-2 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{event.eventType}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(event.occurredAt).toLocaleDateString()}
                      </span>
                    </div>
                    {event.title && (
                      <p className="text-muted-foreground mt-1 text-sm">{event.title}</p>
                    )}
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

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-card sticky top-20 rounded-xl border p-4">
            <p className="text-primary text-3xl font-bold">
              {formatPrice(detail.price, { currency: detail.currency })}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{LISTING_CONDITION_LABELS[detail.condition]}</Badge>
              {detail.negotiable ? <Badge variant="outline">Negotiable</Badge> : null}
              {detail.isFeatured ? (
                <Badge className="bg-amber-500 text-white hover:bg-amber-500">Featured</Badge>
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
            showPakistanSignals
            categorySlug={detail.categorySlug}
          />
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-12">
          <SectionHeader title="Related listings" />
          <ListingsGrid
            listings={related}
            favoriteIds={favoriteIds}
            isAuthenticated={isAuthenticated}
          />
        </section>
      ) : null}

      <JsonLd data={jsonLd} />
    </div>
  );
}
