import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { LISTING_STATUSES, type ListingStatus } from "@/lib/constants";
import { MOBILE_CAROUSEL_IMAGE_LIMIT } from "@/lib/mobile-carousel";
import type { ListingModelAssetData, ListingModelData } from "@/types/marketplace";
import type { SellerListingRow, SellerStats } from "@/features/seller/types";
import type { UploadedModel } from "@/features/listings/schemas/create-listing";

/** Projection for a seller management row, incl. favorites count + primary image. */
const rowSelect = {
  id: true,
  title: true,
  slug: true,
  price: true,
  currency: true,
  condition: true,
  city: true,
  status: true,
  views: true,
  isFeatured: true,
  createdAt: true,
  soldAt: true,
  images: {
    take: MOBILE_CAROUSEL_IMAGE_LIMIT,
    select: { url: true, publicId: true, width: true, height: true },
    orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
  },
  model3d: {
    select: {
      url: true,
      publicId: true,
      format: true,
      sizeBytes: true,
      assets: true,
      sourceType: true,
      processingStatus: true,
      sourceImageUrl: true,
      sourceImagePublicId: true,
      generator: true,
      generatorVersion: true,
      generationReceipt: true,
    },
  },
  _count: { select: { favorites: true } },
} satisfies Prisma.ListingSelect;

type SellerListingRecord = Prisma.ListingGetPayload<{ select: typeof rowSelect }>;

function toModelData(model: SellerListingRecord["model3d"]): ListingModelData | null {
  if (!model) return null;
  const assets: ListingModelAssetData[] = Array.isArray(model.assets)
    ? model.assets.flatMap((entry) => {
        if (typeof entry !== "object" || entry === null) return [];
        const asset = entry as Record<string, unknown>;
        if (
          typeof asset.uri !== "string" ||
          typeof asset.url !== "string" ||
          typeof asset.publicId !== "string"
        ) {
          return [];
        }
        return [
          {
            uri: asset.uri,
            url: asset.url,
            publicId: asset.publicId,
            bytes: typeof asset.bytes === "number" ? asset.bytes : 0,
          },
        ];
      })
    : [];
  const receipt =
    typeof model.generationReceipt === "object" && model.generationReceipt !== null
      ? (model.generationReceipt as Record<string, unknown>)
      : undefined;

  return {
    url: model.url,
    publicId: model.publicId,
    format: model.format === "GLTF" ? "GLTF" : "GLB",
    sizeBytes: model.sizeBytes,
    assets,
    sourceType: model.sourceType === "GENERATED" ? "GENERATED" : "UPLOADED",
    processingStatus:
      model.processingStatus === "GENERATING" || model.processingStatus === "FAILED"
        ? model.processingStatus
        : "READY",
    sourceImageUrl: model.sourceImageUrl ?? undefined,
    sourceImagePublicId: model.sourceImagePublicId ?? undefined,
    generator: model.generator ?? undefined,
    generatorVersion: model.generatorVersion ?? undefined,
    generationReceipt: receipt
      ? {
          runId: typeof receipt.runId === "string" ? receipt.runId : undefined,
          vertices: typeof receipt.vertices === "number" ? receipt.vertices : undefined,
          faces: typeof receipt.faces === "number" ? receipt.faces : undefined,
          durationMs: typeof receipt.durationMs === "number" ? receipt.durationMs : undefined,
        }
      : undefined,
  };
}

function toRow(row: SellerListingRecord): SellerListingRow {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    price: Number(row.price),
    currency: row.currency,
    condition: row.condition,
    city: row.city ?? "—",
    status: row.status,
    views: row.views,
    favorites: row._count.favorites,
    isFeatured: row.isFeatured,
    imageUrl: row.images[0]?.url,
    imageUrls: row.images.map((image) => image.url),
    sourceImages: row.images.map((image) => ({
      url: image.url,
      publicId: image.publicId ?? undefined,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
    })),
    model3d: toModelData(row.model3d),
    createdAt: row.createdAt.toISOString(),
    soldAt: row.soldAt ? row.soldAt.toISOString() : undefined,
  };
}

/** Aggregate stats across a seller's (non-deleted) listings, in a few grouped queries. */
export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  const baseWhere: Prisma.ListingWhereInput = { sellerId, deletedAt: null };

  const [statusGroups, viewsAgg, favorites] = await Promise.all([
    prisma.listing.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),
    prisma.listing.aggregate({ where: baseWhere, _sum: { views: true } }),
    prisma.favorite.count({ where: { listing: { sellerId, deletedAt: null } } }),
  ]);

  const countByStatus = new Map<ListingStatus, number>(
    statusGroups.map((g) => [g.status, g._count._all]),
  );
  const totalListings = statusGroups.reduce((sum, g) => sum + g._count._all, 0);

  return {
    totalListings,
    activeListings: countByStatus.get(LISTING_STATUSES.ACTIVE) ?? 0,
    soldListings: countByStatus.get(LISTING_STATUSES.SOLD) ?? 0,
    totalViews: viewsAgg._sum.views ?? 0,
    totalFavorites: favorites,
  };
}

/** A seller's listings (optionally filtered by status), newest first. */
export async function getSellerListings(
  sellerId: string,
  status?: ListingStatus,
): Promise<SellerListingRow[]> {
  const rows = await prisma.listing.findMany({
    where: { sellerId, deletedAt: null, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    select: rowSelect,
  });
  return rows.map(toRow);
}

/**
 * Updates a listing's status, scoped to its owner. Sets/clears `soldAt` for SOLD/ACTIVE.
 * Returns the number of rows affected (0 ⇒ not found or not owned by the seller).
 */
export async function setListingStatus(
  sellerId: string,
  listingId: string,
  status: ListingStatus,
): Promise<number> {
  const data: Prisma.ListingUpdateManyMutationInput = { status };
  if (status === LISTING_STATUSES.SOLD) data.soldAt = new Date();
  if (status === LISTING_STATUSES.ACTIVE) data.soldAt = null;

  const result = await prisma.listing.updateMany({
    where: { id: listingId, sellerId, deletedAt: null },
    data,
  });
  return result.count;
}

/** Soft-deletes a listing (owner-scoped). Returns rows affected. */
export async function softDeleteListing(
  sellerId: string,
  listingId: string,
): Promise<number> {
  const result = await prisma.listing.updateMany({
    where: { id: listingId, sellerId, deletedAt: null },
    data: { status: LISTING_STATUSES.REMOVED, deletedAt: new Date() },
  });
  return result.count;
}

function publicIdsFromStoredModel(model: {
  publicId: string;
  assets: unknown;
}): string[] {
  const ids = [model.publicId];
  if (Array.isArray(model.assets)) {
    for (const entry of model.assets) {
      if (typeof entry !== "object" || entry === null) continue;
      const publicId = (entry as Record<string, unknown>).publicId;
      if (typeof publicId === "string") ids.push(publicId);
    }
  }
  return ids;
}

/**
 * Replaces or removes a listing's optional model, scoped to the owner.
 * Returns the previous Cloudinary public IDs so the service can delete them
 * only after the database transaction has committed.
 */
export async function replaceOwnedListingModel(
  sellerId: string,
  listingId: string,
  model: UploadedModel | null,
): Promise<{ ok: boolean; previousPublicIds: string[] }> {
  const result = await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findFirst({
      where: { id: listingId, sellerId, deletedAt: null },
      select: {
        id: true,
        model3d: { select: { publicId: true, assets: true } },
      },
    });
    if (!listing) return null;

    const previousPublicIds = listing.model3d
      ? publicIdsFromStoredModel(listing.model3d)
      : [];

    if (model) {
      await tx.listingModel.upsert({
        where: { listingId },
        create: {
          listingId,
          url: model.url,
          publicId: model.publicId,
          format: model.format,
          sizeBytes: model.sizeBytes,
          assets: model.assets as unknown as Prisma.InputJsonValue,
          sourceType: model.sourceType ?? "UPLOADED",
          processingStatus: model.processingStatus ?? "READY",
          sourceImageUrl: model.sourceImageUrl,
          sourceImagePublicId: model.sourceImagePublicId,
          generator: model.generator,
          generatorVersion: model.generatorVersion,
          generationReceipt: model.generationReceipt as unknown as Prisma.InputJsonValue,
        },
        update: {
          url: model.url,
          publicId: model.publicId,
          format: model.format,
          sizeBytes: model.sizeBytes,
          assets: model.assets as unknown as Prisma.InputJsonValue,
          sourceType: model.sourceType ?? "UPLOADED",
          processingStatus: model.processingStatus ?? "READY",
          sourceImageUrl: model.sourceImageUrl,
          sourceImagePublicId: model.sourceImagePublicId,
          generator: model.generator,
          generatorVersion: model.generatorVersion,
          generationReceipt: model.generationReceipt as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      await tx.listingModel.deleteMany({ where: { listingId } });
    }

    return { previousPublicIds };
  });

  return result
    ? { ok: true, previousPublicIds: result.previousPublicIds }
    : { ok: false, previousPublicIds: [] };
}
