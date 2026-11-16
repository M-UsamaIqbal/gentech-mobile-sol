import type { Metadata } from "next";

import { getCategoriesWithCounts } from "@/features/marketplace/services/category.service";
import { getActiveBrands } from "@/features/marketplace/services/brand.service";
import { CreateListingForm } from "@/features/listings/components/create-listing-form";

export const metadata: Metadata = { title: "Post your ad" };

export default async function SellPage() {
  const [categories, brands] = await Promise.all([getCategoriesWithCounts(), getActiveBrands()]);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Post your ad</h1>
        <p className="text-muted-foreground text-sm">
          Add a few photos and details to reach thousands of buyers near you.
        </p>
      </header>
      <CreateListingForm categories={categories} brands={brands} />
    </div>
  );
}
