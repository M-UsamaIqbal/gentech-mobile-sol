import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Plus } from "lucide-react";

import { LISTING_STATUSES, ROUTES, type ListingStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "@/lib/session";
import { getListings, getStats } from "@/features/seller/services/seller.service";
import { SellerStatsCards } from "@/features/seller/components/seller-stats";
import { SellerStatusFilter } from "@/features/seller/components/seller-status-filter";
import { SellerListingCard } from "@/features/seller/components/seller-listing-card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { 
  title: "My Listings",
  robots: { index: false, follow: false },
};

/** Narrows a raw `?status=` value to a known listing status, else undefined (= All). */
function parseStatus(value: string | string[] | undefined): ListingStatus | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw in LISTING_STATUSES ? (raw as ListingStatus) : undefined;
}

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const status = parseStatus((await searchParams).status);
  const [stats, listings] = await Promise.all([getStats(user.id), getListings(user.id, status)]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
          <p className="text-muted-foreground text-sm">Manage your ads and track performance</p>
        </div>
        <Link href={ROUTES.sell} className={buttonVariants()}>
          <Plus className="size-4" />
          Post new ad
        </Link>
      </header>

      <SellerStatsCards stats={stats} />

      <SellerStatusFilter active={status} />

      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <Package className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">
            {status
              ? "No listings with this status."
              : "You haven't posted any listings yet."}
          </p>
          <Link href={ROUTES.sell} className={cn(buttonVariants({ variant: "outline" }))}>
            Post your first ad
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {listings.map((listing) => (
            <SellerListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
