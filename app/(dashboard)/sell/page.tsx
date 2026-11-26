import type { Metadata } from "next";
import Link from "next/link";

import { CreateListingForm } from "@/features/listings/components/create-listing-form";
import { buttonVariants } from "@/components/ui/button";
import {
  getMarketplaceBrands,
  getMarketplaceCategories,
} from "@/features/marketplace/services/catalog.service";
import { getActiveLocationTree } from "@/features/locations/services/location.service";

export const metadata: Metadata = { title: "Post your ad" };

export default async function SellPage() {
  const [categories, brands, locations] = await Promise.all([
    getMarketplaceCategories(),
    getMarketplaceBrands(),
    getActiveLocationTree(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Post your ad</h1>
        <p className="text-muted-foreground text-sm">
          Add a few photos and details to reach thousands of buyers near you.
        </p>
      </header>

      {/* Phone Intelligence Quick Links */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Link
          href="/valuation"
          className={buttonVariants({
            variant: "outline",
            className: "flex h-auto flex-col items-center justify-center gap-2 py-4",
          })}
        >
          <span className="text-lg">💰</span>
          <span className="text-sm font-medium">Check Value</span>
          <span className="text-muted-foreground text-xs">Get price estimate</span>
        </Link>
        <Link
          href="/imei-check"
          className={buttonVariants({
            variant: "outline",
            className: "flex h-auto flex-col items-center justify-center gap-2 py-4",
          })}
        >
          <span className="text-lg">🔍</span>
          <span className="text-sm font-medium">Verify IMEI</span>
          <span className="text-muted-foreground text-xs">Check PTA status</span>
        </Link>
      </div>

      <CreateListingForm categories={categories} brands={brands} locations={locations} />
    </div>
  );
}
