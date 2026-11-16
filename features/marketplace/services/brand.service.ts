import "server-only";

import { prisma } from "@/lib/prisma";
import { DEMO_BRANDS } from "@/features/marketplace/data/fixtures";
import type { BrandItem } from "@/types/marketplace";

/**
 * Active brands for filter UIs. Falls back to the demo brand list only when the
 * database is empty or unreachable (keeps the filter usable during setup).
 */
export async function getActiveBrands(): Promise<BrandItem[]> {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true },
    });
    return brands.length > 0 ? brands : DEMO_BRANDS;
  } catch (error) {
    console.warn(
      "[marketplace] could not load brands — using demo layout.",
      error instanceof Error ? error.message : error,
    );
    return DEMO_BRANDS;
  }
}
