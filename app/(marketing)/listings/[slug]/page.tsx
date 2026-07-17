import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Eye, MapPin } from "lucide-react";

import { APP, LISTING_CONDITION_LABELS, ROUTES } from "@/lib/constants";
import { formatPrice, formatRelativeTime } from "@/utils/format";
import { getCurrentUser } from "@/lib/session";
import { getListingDetail } from "@/features/listings/services/listing.service";
import {
  getInspectionPlans,
  getListingInspectionReport,
} from "@/features/inspections/services/inspection.service";
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

/** Shared per-request loader → metadata + page reuse one fetch (one view increment). */
const loadListing = cache((slug: string) => getListingDetail(slug));

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadListing(slug);
  if (!result) return { title: "Listing not found" };

  const { detail } = result;
  const description = detail.description.slice(0, 160);
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

  // Inspection service data (fail-soft): pricing packages + any published report.
  const [inspectionPlans, publishedReport] = await Promise.all([
    getInspectionPlans(),
    getListingInspectionReport(detail.id),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: detail.title,
    description: detail.description,
    image: detail.images.map((i) => i.url),
    brand: detail.brand ? { "@type": "Brand", name: detail.brand } : undefined,
    offers: {
      "@type": "Offer",
      price: detail.price,
      priceCurrency: detail.currency,
      availability: "https://schema.org/InStock",
      url: `${APP.url}/listings/${detail.slug}`,
    },
  };

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
          <ListingGallery images={detail.images} title={detail.title} brand={detail.brand} />

          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{detail.title}</h1>
              <div className="flex shrink-0 items-center gap-2">
                <FavoriteButton className="border" />
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

          <ListingSpecs attributes={detail.attributes} />

          <section>
            <h2 className="mb-3 text-lg font-semibold">Description</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
              {detail.description}
            </p>
          </section>

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
            isAuthenticated={Boolean(user)}
          />

          <ListingInspectionCta
            listingId={detail.id}
            plans={inspectionPlans}
            isAuthenticated={Boolean(user)}
            defaultCity={detail.city}
          />
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mt-12">
          <SectionHeader title="Related listings" />
          <ListingsGrid listings={related} />
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
