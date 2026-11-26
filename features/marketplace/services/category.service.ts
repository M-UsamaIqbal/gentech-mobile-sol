import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { CATALOG_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache";
import { LISTING_STATUSES } from "@/lib/constants";
import { getDemoCategories } from "@/features/marketplace/data/fixtures";
import type { Region } from "@/lib/generated/prisma/enums";
import type { CategoryItem } from "@/types/marketplace";

/** Demo categories with their synthetic counts stripped — layout fallback only. */
function demoCategoriesWithoutCounts(region?: Region): CategoryItem[] {
  return getDemoCategories(region).map(({ id, name, slug, icon }) => ({ id, name, slug, icon }));
}

/**
 * Active categories with a *real* active-listing count each. The count is attached
 * only when greater than zero, so empty categories simply omit the "N ads" line
 * rather than showing a misleading number. Falls back to the demo layout (no counts)
 * when the database is empty or unreachable.
 */
export async function getCategoriesWithCounts(
  limit?: number,
  region?: Region,
): Promise<CategoryItem[]> {
  return unstable_cache(
    async () => {
      try {
        const [categories, groups] = await Promise.all([
          prisma.category.findMany({
            where: {
              isActive: true,
              ...(region ? { OR: [{ region }, { region: null }] } : {}),
            },
            orderBy: [{ position: "asc" }, { name: "asc" }],
            select: { id: true, name: true, slug: true, icon: true },
          }),
          prisma.listing.groupBy({
            by: ["categoryId"],
            where: {
              status: LISTING_STATUSES.ACTIVE,
              deletedAt: null,
              ...(region ? { region } : {}),
            },
            _count: { _all: true },
          }),
        ]);

        if (categories.length === 0) return demoCategoriesWithoutCounts(region);

        const countByCategory = new Map(groups.map((g) => [g.categoryId, g._count._all]));

        const items: CategoryItem[] = categories.map((category) => {
          const count = countByCategory.get(category.id) ?? 0;
          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            icon: category.icon ?? undefined,
            ...(count > 0 ? { count } : {}),
          };
        });

        items.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

        return typeof limit === "number" ? items.slice(0, limit) : items;
      } catch (error) {
        console.warn(
          "[marketplace] could not load category counts — using demo layout.",
          error instanceof Error ? error.message : error,
        );
        return demoCategoriesWithoutCounts(region);
      }
    },
    ["categories-with-counts", String(limit ?? "all"), region ?? "all"],
    {
      revalidate: CATALOG_REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.catalog],
    },
  )();
}
