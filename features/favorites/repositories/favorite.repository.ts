import "server-only";

import { prisma } from "@/lib/prisma";

export async function listFavoriteIds(userId: string, listingIds?: string[]): Promise<string[]> {
  const rows = await prisma.favorite.findMany({
    where: {
      userId,
      listing: {
        status: "ACTIVE",
        deletedAt: null,
        ...(listingIds ? { id: { in: listingIds } } : {}),
      },
    },
    orderBy: { createdAt: "desc" },
    select: { listingId: true },
  });
  return rows.map(({ listingId }) => listingId);
}

export async function setFavorite(
  userId: string,
  listingId: string,
  favorite: boolean,
): Promise<void> {
  if (!favorite) {
    await prisma.favorite.deleteMany({ where: { userId, listingId } });
    return;
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!listing) throw new Error("This listing is no longer available.");

  await prisma.favorite.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: { userId },
  });
}
