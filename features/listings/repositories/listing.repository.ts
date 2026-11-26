import "server-only";

import { prisma } from "@/lib/prisma";
import { categorySlugsForFilter } from "@/lib/catalog/category-filters";
import { MOBILE_CAROUSEL_IMAGE_LIMIT } from "@/lib/mobile-carousel";
import { Prisma } from "@/lib/generated/prisma/client";
import type { Region } from "@/lib/generated/prisma/enums";
import { uniqueSlug } from "@/utils/slug";
import type {
  ListingCardData,
  ListingDetail,
  ListingFilters,
  ListingFilterOptions,
  ListingModelAssetData,
  ListingModelData,
  ListingSearchResult,
} from "@/types/marketplace";
import type { CreateListingInput } from "@/features/listings/schemas/create-listing";
import { formatAttributes } from "@/features/listings/lib/attributes";

/** Columns projected for a listing card — keep this tight to avoid over-fetching. */
const cardSelect = {
  id: true,
  dealerId: true,
  title: true,
  slug: true,
  price: true,
  currency: true,
  condition: true,
  region: true,
  city: true,
  isFeatured: true,
  negotiable: true,
  views: true,
  createdAt: true,
  attributes: true,
  brand: { select: { name: true, slug: true } },
  category: { select: { slug: true } },
  images: {
    take: MOBILE_CAROUSEL_IMAGE_LIMIT,
    select: { url: true },
    orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
  },
  seller: { select: { emailVerified: true } },
  inspections: {
    where: { status: "COMPLETED" },
    take: 1,
    select: { id: true },
  },
} satisfies Prisma.ListingSelect;

type ListingCardRow = Prisma.ListingGetPayload<{ select: typeof cardSelect }>;

function buildListingConditions(filters: ListingFilters, ranked: boolean): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`l."status"::text = 'ACTIVE'`,
    Prisma.sql`l."deletedAt" IS NULL`,
  ];

  if (ranked && filters.q) {
    conditions.push(Prisma.sql`l."searchVector" @@ websearch_to_tsquery('english', ${filters.q})`);
  } else if (filters.q) {
    conditions.push(
      Prisma.sql`(position(lower(${filters.q}) in lower(l."title")) > 0 OR position(lower(${filters.q}) in lower(l."description")) > 0)`,
    );
  }
  if (filters.category) {
    const slugs = [...categorySlugsForFilter(filters.category)];
    conditions.push(
      Prisma.sql`l."categoryId" IN (SELECT "id" FROM "category" WHERE "slug" = ANY(${slugs}))`,
    );
  }
  if (filters.brand) {
    conditions.push(
      Prisma.sql`l."brandId" IN (SELECT "id" FROM "brand" WHERE "slug" = ${filters.brand})`,
    );
  }
  if (filters.condition) {
    conditions.push(Prisma.sql`l."condition"::text = ${filters.condition}`);
  }
  if (filters.city) {
    conditions.push(Prisma.sql`lower(l."city") = lower(${filters.city})`);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(Prisma.sql`l."price" >= ${filters.minPrice}`);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(Prisma.sql`l."price" <= ${filters.maxPrice}`);
  }
  if (filters.storage) {
    conditions.push(Prisma.sql`l."attributes"->>'storage' = ${filters.storage}`);
  }
  if (filters.ram) {
    conditions.push(Prisma.sql`l."attributes"->>'ram' = ${filters.ram}`);
  }
  if (filters.color) {
    conditions.push(Prisma.sql`l."attributes"->>'color' = ${filters.color}`);
  }
  if (filters.batteryHealthMin !== undefined) {
    conditions.push(
      Prisma.sql`CASE WHEN jsonb_typeof(l."attributes"->'batteryHealth') = 'number' THEN (l."attributes"->>'batteryHealth')::numeric >= ${filters.batteryHealthMin} ELSE false END`,
    );
  }
  if (filters.ptaStatus) {
    conditions.push(Prisma.sql`l."attributes"->>'ptaStatus' = ${filters.ptaStatus}`);
  }
  if (filters.cpidStatus) {
    conditions.push(Prisma.sql`l."attributes"->>'cpidStatus' = ${filters.cpidStatus}`);
  }
  if (filters.warranty) {
    conditions.push(Prisma.sql`l."attributes"->>'warranty' = ${filters.warranty}`);
  }
  if (filters.processor) {
    conditions.push(Prisma.sql`l."attributes"->>'processor' = ${filters.processor}`);
  }
  if (filters.operatingSystem) {
    conditions.push(Prisma.sql`l."attributes"->>'operatingSystem' = ${filters.operatingSystem}`);
  }
  if (filters.screenSize) {
    conditions.push(Prisma.sql`l."attributes"->>'screenSize' = ${filters.screenSize}`);
  }
  if (filters.connectivity) {
    conditions.push(Prisma.sql`l."attributes"->>'connectivity' = ${filters.connectivity}`);
  }
  if (filters.accessoryType) {
    conditions.push(Prisma.sql`l."attributes"->>'accessoryType' = ${filters.accessoryType}`);
  }
  if (filters.compatibility) {
    conditions.push(Prisma.sql`l."attributes"->>'compatibility' = ${filters.compatibility}`);
  }
  if (filters.isInspected !== undefined) {
    conditions.push(
      filters.isInspected
        ? Prisma.sql`EXISTS (SELECT 1 FROM "inspection_request" ir WHERE ir."listingId" = l."id" AND ir."status"::text = 'COMPLETED')`
        : Prisma.sql`NOT EXISTS (SELECT 1 FROM "inspection_request" ir WHERE ir."listingId" = l."id" AND ir."status"::text = 'COMPLETED')`,
    );
  }
  if (filters.isDealer !== undefined) {
    conditions.push(
      filters.isDealer ? Prisma.sql`l."dealerId" IS NOT NULL` : Prisma.sql`l."dealerId" IS NULL`,
    );
  }
  if (filters.isVerifiedSeller !== undefined) {
    conditions.push(
      Prisma.sql`l."sellerId" IN (SELECT "id" FROM "user" WHERE "emailVerified" = ${filters.isVerifiedSeller})`,
    );
  }

  return conditions;
}

function buildOrderBy(filters: ListingFilters, ranked: boolean): Prisma.Sql {
  if (ranked && filters.q) {
    return Prisma.sql`l."isFeatured" DESC, ts_rank(l."searchVector", websearch_to_tsquery('english', ${filters.q})) DESC, l."createdAt" DESC`;
  }

  switch (filters.sort) {
    case "price_asc":
      return Prisma.sql`l."isFeatured" DESC, l."price" ASC, l."createdAt" DESC`;
    case "price_desc":
      return Prisma.sql`l."isFeatured" DESC, l."price" DESC, l."createdAt" DESC`;
    case "popular":
      return Prisma.sql`l."isFeatured" DESC, l."views" DESC, l."createdAt" DESC`;
    case "recent":
    default:
      return Prisma.sql`l."isFeatured" DESC, l."createdAt" DESC`;
  }
}

/** Tests many saved-search filters against one listing in a single DB round-trip. */
export async function matchListingFilters(
  listingId: string,
  filterSets: ListingFilters[],
): Promise<boolean[]> {
  if (filterSets.length === 0) return [];

  const projections = filterSets.map((filters, index) => {
    const conditions = Prisma.join(buildListingConditions(filters, false), " AND ");
    const alias = Prisma.raw(`"match_${index}"`);
    return Prisma.sql`EXISTS (SELECT 1 FROM "listing" l WHERE l."id" = ${listingId} AND ${conditions}) AS ${alias}`;
  });
  const rows = await prisma.$queryRaw<Array<Record<string, boolean>>>(Prisma.sql`
    SELECT ${Prisma.join(projections, ", ")}
  `);
  const row = rows[0];
  return filterSets.map((_, index) => row?.[`match_${index}`] === true);
}

export async function getListingAlertDetails(
  listingId: string,
): Promise<{ id: string; title: string; slug: string; sellerId: string } | null> {
  return prisma.listing.findFirst({
    where: { id: listingId, status: "ACTIVE", deletedAt: null },
    select: { id: true, title: true, slug: true, sellerId: true },
  });
}

function toCardData(row: ListingCardRow): ListingCardData {
  const attrs = row.attributes as Record<string, unknown> | null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    price: Number(row.price),
    currency: row.currency,
    condition: row.condition,
    region: row.region,
    city: row.city ?? "—",
    brand: row.brand?.name,
    brandSlug: row.brand?.slug,
    categorySlug: row.category?.slug,
    isFeatured: row.isFeatured,
    negotiable: row.negotiable,
    views: row.views,
    createdAt: row.createdAt.toISOString(),
    imageUrl: row.images[0]?.url,
    imageUrls: row.images.map((image) => image.url),
    // Phone-specific attributes
    storage: typeof attrs?.storage === "string" ? attrs.storage : undefined,
    ram: typeof attrs?.ram === "string" ? attrs.ram : undefined,
    color: typeof attrs?.color === "string" ? attrs.color : undefined,
    batteryHealth: typeof attrs?.batteryHealth === "number" ? attrs.batteryHealth : undefined,
    ptaStatus: typeof attrs?.ptaStatus === "string" ? attrs.ptaStatus : undefined,
    cpidStatus: typeof attrs?.cpidStatus === "string" ? attrs.cpidStatus : undefined,
    model: typeof attrs?.model === "string" ? attrs.model : undefined,
    modelNumber: typeof attrs?.modelNumber === "string" ? attrs.modelNumber : undefined,
    warranty: typeof attrs?.warranty === "string" ? attrs.warranty : undefined,
    isInspected: row.inspections.length > 0,
    isVerifiedSeller: row.seller?.emailVerified ?? false,
    isDealer: row.dealerId !== null,
  };
}

interface ListingCardRawRow {
  id: string;
  title: string;
  slug: string;
  price: Prisma.Decimal | string | number;
  currency: string;
  condition: ListingCardData["condition"];
  city: string | null;
  isFeatured: boolean;
  negotiable: boolean;
  views: number;
  createdAt: Date;
  attributes: Record<string, unknown> | null;
  brandName: string | null;
  brandSlug: string | null;
  categorySlug: string | null;
  imageUrls: unknown;
  sellerEmailVerified: boolean;
  isInspected: boolean;
  dealerId: string | null;
  total: bigint | number;
}

function toSearchCardImageUrls(value: unknown): string[] {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((url): url is string => typeof url === "string" && url.length > 0)
    .slice(0, MOBILE_CAROUSEL_IMAGE_LIMIT);
}

function toSearchCardData(row: ListingCardRawRow): ListingCardData {
  const attrs = row.attributes;
  const imageUrls = toSearchCardImageUrls(row.imageUrls);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    price: Number(row.price),
    currency: row.currency,
    condition: row.condition,
    city: row.city ?? "—",
    brand: row.brandName ?? undefined,
    brandSlug: row.brandSlug ?? undefined,
    categorySlug: row.categorySlug ?? undefined,
    isFeatured: row.isFeatured,
    negotiable: row.negotiable,
    views: row.views,
    createdAt: row.createdAt.toISOString(),
    imageUrl: imageUrls[0],
    imageUrls,
    storage: typeof attrs?.storage === "string" ? attrs.storage : undefined,
    ram: typeof attrs?.ram === "string" ? attrs.ram : undefined,
    color: typeof attrs?.color === "string" ? attrs.color : undefined,
    batteryHealth: typeof attrs?.batteryHealth === "number" ? attrs.batteryHealth : undefined,
    ptaStatus: typeof attrs?.ptaStatus === "string" ? attrs.ptaStatus : undefined,
    cpidStatus: typeof attrs?.cpidStatus === "string" ? attrs.cpidStatus : undefined,
    warranty: typeof attrs?.warranty === "string" ? attrs.warranty : undefined,
    isInspected: row.isInspected,
    isVerifiedSeller: row.sellerEmailVerified,
    isDealer: row.dealerId !== null,
  };
}

async function searchListingRows(
  filters: ListingFilters,
  ranked: boolean,
  region?: Region,
): Promise<ListingSearchResult> {
  const conditions = buildListingConditions(filters, ranked);

  if (region) {
    conditions.push(Prisma.sql`l."region"::text = ${region}`);
  }

  const rows = await prisma.$queryRaw<ListingCardRawRow[]>(Prisma.sql`
    SELECT
      l."id",
      l."title",
      l."slug",
      l."price",
      l."currency",
      l."condition"::text AS "condition",
      l."city",
      l."isFeatured",
      l."negotiable",
      l."views",
      l."createdAt",
      l."attributes",
      l."dealerId",
      b."name" AS "brandName",
      b."slug" AS "brandSlug",
      c."slug" AS "categorySlug",
      (
        SELECT COALESCE(
          jsonb_agg(i."url" ORDER BY i."isPrimary" DESC, i."position" ASC),
          '[]'::jsonb
        )
        FROM (
          SELECT "url", "isPrimary", "position"
          FROM "listing_image"
          WHERE "listingId" = l."id"
          ORDER BY "isPrimary" DESC, "position" ASC
          LIMIT ${MOBILE_CAROUSEL_IMAGE_LIMIT}
        ) i
      ) AS "imageUrls",
      s."emailVerified" AS "sellerEmailVerified",
      EXISTS (
        SELECT 1
        FROM "inspection_request" ir
        WHERE ir."listingId" = l."id" AND ir."status"::text = 'COMPLETED'
      ) AS "isInspected",
      count(*) OVER() AS "total"
    FROM "listing" l
    LEFT JOIN "brand" b ON b."id" = l."brandId"
    LEFT JOIN "category" c ON c."id" = l."categoryId"
    LEFT JOIN "user" s ON s."id" = l."sellerId"
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY ${buildOrderBy(filters, ranked)}
    LIMIT ${filters.pageSize} OFFSET ${(filters.page - 1) * filters.pageSize}
  `);

  const total = Number(rows[0]?.total ?? 0);

  return {
    items: rows.map(toSearchCardData),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function searchListings(filters: ListingFilters, region?: Region): Promise<ListingSearchResult> {
  return searchListingRows(filters, false, region);
}

/**
 * Ranked full-text search. Uses `websearch_to_tsquery` + `ts_rank` over the
 * `searchVector` GIN index, with the same structured filters as `searchListings`.
 * Requires `filters.q` to be present.
 */
export async function searchListingsRanked(filters: ListingFilters, region?: Region): Promise<ListingSearchResult> {
  return searchListingRows(filters, true, region);
}

export async function getListingFilterOptions(
  region?: Region,
  category?: string,
): Promise<ListingFilterOptions> {
  const slugs = category ? [...categorySlugsForFilter(category)] : [];

  async function getValues(attribute: "storage" | "ram" | "color"): Promise<string[]> {
    const expression = {
      storage: Prisma.sql`"attributes"->>'storage'`,
      ram: Prisma.sql`"attributes"->>'ram'`,
      color: Prisma.sql`"attributes"->>'color'`,
    }[attribute];
    const rows = await prisma.$queryRaw<Array<{ value: string }>>(Prisma.sql`
      SELECT DISTINCT ${expression} AS "value"
      FROM "listing"
      WHERE "status"::text = 'ACTIVE'
        AND "deletedAt" IS NULL
        AND jsonb_typeof("attributes"->${attribute}) = 'string'
        AND length(trim(${expression})) BETWEEN 1 AND 40
        AND (${region ? Prisma.sql`"region"::text = ${region}` : Prisma.sql`TRUE`})
        AND (
          ${slugs.length > 0
            ? Prisma.sql`"categoryId" IN (SELECT "id" FROM "category" WHERE "slug" = ANY(${slugs}))`
            : Prisma.sql`TRUE`}
        )
      ORDER BY "value" ASC
      LIMIT 100
    `);
    return rows.map(({ value }) => value);
  }

  const [storage, ram, colors] = await Promise.all([
    getValues("storage"),
    getValues("ram"),
    getValues("color"),
  ]);
  return { storage, ram, colors };
}

/** Full projection for the listing detail page. */
const detailSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  price: true,
  currency: true,
  condition: true,
  negotiable: true,
  city: true,
  area: true,
  latitude: true,
  longitude: true,
  isFeatured: true,
  views: true,
  videoUrl: true,
  attributes: true,
  createdAt: true,
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: {
    orderBy: { position: "asc" },
    select: { url: true, width: true, height: true },
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
  seller: {
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      profile: { select: { city: true, phone: true } },
    },
  },
  dealer: { select: { phone: true } },
} satisfies Prisma.ListingSelect;

type ListingDetailRow = Prisma.ListingGetPayload<{ select: typeof detailSelect }>;

/** Persisted 3D assets are validated again at read time before reaching a client. */
function toModelData(model: ListingDetailRow["model3d"]): ListingModelData | null {
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

function toDetail(row: ListingDetailRow): ListingDetail {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    condition: row.condition,
    negotiable: row.negotiable,
    city: row.city ?? "—",
    area: row.area ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    brand: row.brand?.name,
    brandSlug: row.brand?.slug,
    categorySlug: row.category.slug,
    categoryName: row.category.name,
    isFeatured: row.isFeatured,
    views: row.views,
    createdAt: row.createdAt.toISOString(),
    images: row.images.map((img) => ({
      url: img.url,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
    })),
    model3d: toModelData(row.model3d),
    attributes: formatAttributes(row.attributes),
    videoUrl: row.videoUrl ?? undefined,
    seller: {
      id: row.seller.id,
      name: row.seller.name,
      image: row.seller.image,
      phone: row.dealer?.phone ?? row.seller.profile?.phone ?? undefined,
      city: row.seller.profile?.city ?? row.city ?? undefined,
      memberSince: row.seller.createdAt.toISOString(),
    },
  };
}

/** A single listing by slug. Increments the view counter (best effort). */
export async function getListingBySlug(slug: string, region?: Region): Promise<ListingDetail | null> {
  const row = await prisma.listing.findFirst({
    where: { slug, deletedAt: null, ...(region ? { region } : {}) },
    select: detailSelect,
  });
  if (!row) return null;

  void prisma.listing
    .update({ where: { id: row.id }, data: { views: { increment: 1 } } })
    .catch(() => {
      /* view counting is best-effort */
    });

  return toDetail(row);
}

/** Top listing title matches for the search autocomplete. */
export async function suggestListings(
  q: string,
  limit = 6,
  region?: Region,
): Promise<Array<{ title: string; slug: string }>> {
  return prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      title: { contains: q, mode: "insensitive" },
      ...(region ? { region } : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { views: "desc" }],
    take: limit,
    select: { title: true, slug: true },
  });
}

/** Up to `limit` other active listings in the same category. */
export async function getRelatedListings(
  categorySlug: string | undefined,
  excludeId: string,
  limit = 4,
  region?: Region,
): Promise<ListingCardData[]> {
  const rows = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      id: { not: excludeId },
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(region ? { region } : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCardData);
}

/** All of a seller's listings (any status), newest first. */
export async function getSellerListings(sellerId: string, region?: Region): Promise<ListingCardData[]> {
  const rows = await prisma.listing.findMany({
    where: { sellerId, deletedAt: null, ...(region ? { region } : {}) },
    orderBy: { createdAt: "desc" },
    select: cardSelect,
  });
  return rows.map(toCardData);
}

/** Loads active listing cards in the same order as the requested ids. */
export async function getListingCardsByIds(
  ids: string[],
  region?: Region,
): Promise<ListingCardData[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.listing.findMany({
    where: {
      id: { in: ids },
      status: "ACTIVE",
      deletedAt: null,
      ...(region ? { region } : {}),
    },
    select: cardSelect,
  });
  const byId = new Map(rows.map((row) => [row.id, toCardData(row)]));
  return ids
    .map((id) => byId.get(id))
    .filter((listing): listing is ListingCardData => Boolean(listing));
}

/** Active listings whose title matches any previously compared phone model name. */
export async function getListingsByModelNames(
  modelNames: string[],
  region: Region,
  excludeId: string,
  limit = 6,
): Promise<ListingCardData[]> {
  const names = modelNames.map((name) => name.trim()).filter(Boolean).slice(0, 8);
  if (names.length === 0) return [];
  const rows = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      region,
      id: { not: excludeId },
      OR: names.map((name) => ({ title: { contains: name, mode: "insensitive" as const } })),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCardData);
}

/** Builds the category-specific attributes JSON from the validated input. */
function buildAttributes(
  input: CreateListingInput,
  region: Region,
): Prisma.InputJsonValue | undefined {
  const attributes: Record<string, string | number | boolean> = {};
  if (input.storage) attributes.storage = input.storage;
  if (input.ram) attributes.ram = input.ram;
  if (input.color) attributes.color = input.color;
  if (input.batteryHealth) attributes.batteryHealth = Number(input.batteryHealth);
  // PTA/CPID are Pakistan-only regulatory signals; never persist them on Bahrain listings.
  if (region === "PAKISTAN") {
    if (input.ptaApproved !== undefined) attributes.ptaApproved = input.ptaApproved;
    if (input.ptaStatus) attributes.ptaStatus = input.ptaStatus;
    if (input.cpidStatus) attributes.cpidStatus = input.cpidStatus;
  }

  // Extended phone attributes
  if (input.model) attributes.model = input.model;
  if (input.variant) attributes.variant = input.variant;
  if (input.networkType) attributes.networkType = input.networkType;
  if (input.carrier) attributes.carrier = input.carrier;
  if (input.isUnlocked !== undefined) attributes.isUnlocked = input.isUnlocked;
  if (input.modelNumber) attributes.modelNumber = input.modelNumber;
  if (input.region) attributes.region = input.region;
  if (input.warranty) attributes.warranty = input.warranty;
  if (input.warrantyExpiry) attributes.warrantyExpiry = input.warrantyExpiry;
  if (input.hasOriginalBox !== undefined) attributes.hasOriginalBox = input.hasOriginalBox;
  if (input.hasCharger !== undefined) attributes.hasCharger = input.hasCharger;
  if (input.hasHeadphones !== undefined) attributes.hasHeadphones = input.hasHeadphones;
  if (input.repairHistory) attributes.repairHistory = input.repairHistory;

  // Category-specific specifications.
  if (input.processor) attributes.processor = input.processor;
  if (input.operatingSystem) attributes.operatingSystem = input.operatingSystem;
  if (input.screenSize) attributes.screenSize = input.screenSize;
  if (input.connectivity) attributes.connectivity = input.connectivity;
  if (input.accessoryType) attributes.accessoryType = input.accessoryType;
  if (input.compatibility) attributes.compatibility = input.compatibility;

  return Object.keys(attributes).length > 0 ? attributes : undefined;
}

/** Creates a listing (resolving category/brand by slug) with its images. */
export async function createListing(
  input: CreateListingInput,
  sellerId: string,
): Promise<{ id: string; slug: string }> {
  // Resolve seller's region for region isolation
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { region: true },
  })
  const sellerRegion = seller?.region ?? "PAKISTAN"

  // Resolve currency based on seller's region
  const currency = sellerRegion === "BAHRAIN" ? "BHD" : "PKR"

  const city = await prisma.city.findFirst({
    where: {
      id: input.cityId,
      countryId: input.countryId,
      isActive: true,
      country: { isActive: true },
    },
    select: {
      id: true,
      name: true,
      areas: {
        where: { id: input.areaId || undefined, isActive: true },
        select: { id: true, name: true },
        take: 1,
      },
    },
  });
  if (!city) throw new Error("Choose an active city in the selected country.");
  const area = input.areaId ? city.areas[0] : undefined;
  if (input.areaId && !area) throw new Error("Choose an active area in the selected city.");

  const category = await prisma.category.findUnique({
    where: { slug: input.categorySlug },
    select: { id: true },
  });
  if (!category) throw new Error("Selected category does not exist.");

  const brandId = input.brandSlug
    ? (
        await prisma.brand.findUnique({
          where: { slug: input.brandSlug },
          select: { id: true },
        })
      )?.id
    : undefined;

  const listing = await prisma.listing.create({
    data: {
      title: input.title,
      slug: uniqueSlug(input.title),
      description: input.description,
      price: new Prisma.Decimal(input.price),
      currency,
      negotiable: input.negotiable ?? false,
      condition: input.condition,
      status: "PENDING_APPROVAL",
      city: city.name,
      area: area?.name,
      cityId: city.id,
      areaId: area?.id,
      region: sellerRegion,
      attributes: buildAttributes(input, sellerRegion),
      sellerId,
      categoryId: category.id,
      brandId,
      images: {
        create: input.images.map((image, index) => ({
          url: image.url,
          publicId: image.publicId,
          width: image.width,
          height: image.height,
          position: index,
          isPrimary: index === 0,
        })),
      },
      ...(input.model3d
        ? {
            model3d: {
              create: {
                url: input.model3d.url,
                publicId: input.model3d.publicId,
                format: input.model3d.format,
                sizeBytes: input.model3d.sizeBytes,
                assets: input.model3d.assets,
                sourceType: input.model3d.sourceType ?? "UPLOADED",
                processingStatus: input.model3d.processingStatus ?? "READY",
                sourceImageUrl: input.model3d.sourceImageUrl,
                sourceImagePublicId: input.model3d.sourceImagePublicId,
                generator: input.model3d.generator,
                generatorVersion: input.model3d.generatorVersion,
                generationReceipt:
                  input.model3d.generationReceipt as unknown as Prisma.InputJsonValue,
              },
            },
          }
        : {}),
    },
    select: { id: true, slug: true },
  });

  // Populate the full-text search vector (kept in the app layer so the column stays
  // a normal Prisma-managed column — no DB triggers/generated expressions to maintain).
  await prisma.$executeRaw`
    UPDATE "listing"
    SET "searchVector" = to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    WHERE id = ${listing.id}
  `;

  return listing;
}
