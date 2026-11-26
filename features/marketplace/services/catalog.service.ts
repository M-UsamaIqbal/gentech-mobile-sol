import "server-only";

import { unstable_cache } from "next/cache";

import type { BrandItem, CategoryItem } from "@/types/marketplace";
import { DEMO_BRANDS, getDemoCategories, getDemoListings } from "@/features/marketplace/data/fixtures";
import { categorySlugsForFilter, filterBrandsForCategory } from "@/lib/catalog/category-filters";
import { ListingStatus, type Region } from "@/lib/generated/prisma/enums";
import { CATALOG_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

/**
 * Returns active brands from the database, projected as `BrandItem[]`.
 * When a category is supplied, only brands with active listings in that category
 * (including descendants) are returned so the filter stays relevant to the feed.
 * Falls back to demo fixtures if the database is unreachable.
 */
export async function getMarketplaceBrands(
  region?: Region,
  category?: string,
): Promise<BrandItem[]> {
  return unstable_cache(
    async () => {
      const slugs = [...categorySlugsForFilter(category)];
      const demoFallback = () => filterBrandsForCategory(DEMO_BRANDS, getDemoListings(region), category);

      try {
        const rows = await prisma.brand.findMany({
          where: {
            isActive: true,
            ...(slugs.length > 0
              ? {
                  listings: {
                    some: {
                      status: ListingStatus.ACTIVE,
                      deletedAt: null,
                      ...(region ? { region } : {}),
                      category: { slug: { in: slugs } },
                    },
                  },
                }
              : {}),
          },
          orderBy: [{ position: "asc" }, { name: "asc" }],
          select: { id: true, name: true, slug: true },
        });
        if (rows.length > 0) return rows;
        return slugs.length > 0 ? demoFallback() : DEMO_BRANDS;
      } catch {
        return demoFallback();
      }
    },
    ["marketplace-brands", region ?? "all", category ?? "all"],
    {
      revalidate: CATALOG_REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.catalog],
    },
  )();
}

/**
 * Returns active top-level categories from the database.
 * Falls back to demo fixtures if the database is unreachable.
 */
export async function getMarketplaceCategories(region?: Region): Promise<CategoryItem[]> {
  return unstable_cache(
    async () => {
      try {
        const rows = await prisma.category.findMany({
          where: {
            isActive: true,
            ...(region ? { OR: [{ region }, { region: null }] } : {}),
          },
          orderBy: [{ position: "asc" }, { name: "asc" }],
          select: { id: true, name: true, slug: true, icon: true },
        });
        if (rows.length === 0) return getDemoCategories(region);
        return rows.map((r) => ({ id: r.id, name: r.name, slug: r.slug, icon: r.icon ?? undefined }));
      } catch {
        return getDemoCategories(region);
      }
    },
    ["marketplace-categories", region ?? "all"],
    {
      revalidate: CATALOG_REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.catalog],
    },
  )();
}

