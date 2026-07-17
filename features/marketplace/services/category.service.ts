import "server-only";

import { prisma } from "@/lib/prisma";
import { LISTING_STATUSES } from "@/lib/constants";
import { DEMO_CATEGORIES } from "@/features/marketplace/data/fixtures";
import type { CategoryItem } from "@/types/marketplace";

/** Demo categories with their fake `count` stripped — used only as a layout fallback. */
function demoCategoriesWithoutCounts(): CategoryItem[] {
  return DEMO_CATEGORIES.map((c) => ({ id: c.id, name: c.name, slug: c.slug, icon: c.icon }));
}

/**
 * Active categories with a *real* active-listing count each. The count is attached
 * only when greater than zero, so empty categories simply omit the "N ads" line
 * rather than showing a misleading number. Falls back to the demo layout (no counts)
 * when the database is empty or unreachable.
 */
export async function getCategoriesWithCounts(limit?: number): Promise<CategoryItem[]> {
  try {
    const [categories, groups] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ position: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, icon: true },
      }),
      prisma.listing.groupBy({
        by: ["categoryId"],
        where: { status: LISTING_STATUSES.ACTIVE, deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    if (categories.length === 0) return demoCategoriesWithoutCounts();

    const countByCategory = new Map(groups.map((g) => [g.categoryId, g._count._all]));

    const items: CategoryItem[] = categories.map((category) => {
      const count = countByCategory.get(category.id) ?? 0;
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon ?? undefined,
        // Only surface a number when there is something to count.
        ...(count > 0 ? { count } : {}),
      };
    });

    // Show categories with listings first, then the rest (keeps the grid useful).
    items.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

    return typeof limit === "number" ? items.slice(0, limit) : items;
  } catch (error) {
    console.warn(
      "[marketplace] could not load category counts — using demo layout.",
      error instanceof Error ? error.message : error,
    );
    return demoCategoriesWithoutCounts();
  }
}
