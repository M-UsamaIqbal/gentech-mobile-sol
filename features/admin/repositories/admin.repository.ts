import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  LISTING_STATUSES,
  PAGINATION,
  REPORT_STATUSES,
  USER_ROLES,
  type ListingStatus,
  type ReportStatus,
  type UserRole,
} from "@/lib/constants";
import { slugify } from "@/utils/slug";
import {
  buildConversionFunnel,
  type ConversionFunnelRow,
} from "@/features/admin/lib/conversion-funnel";
import type {
  AdminCategoryRow,
  ConversionFunnel,
  AdminListingRow,
  AdminReportRow,
  AdminUserRow,
  MarketRegion,
  Paginated,
  PlatformStats,
  RegionAnalytics,
  RegionLocationCount,
  RegionMetric,
} from "@/features/admin/types";

const PAGE_SIZE = PAGINATION.defaultPageSize;

function paginate<T>(items: T[], total: number, page: number): Paginated<T> {
  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

// --------------------------------------------------------------------------
// Platform analytics
// --------------------------------------------------------------------------

export async function getPlatformStats(): Promise<PlatformStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers7d,
    statusGroups,
    openReports,
    totalBrands,
    totalModels,
    totalDealers,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } } }),
    prisma.listing.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.report.count({ where: { status: REPORT_STATUSES.OPEN } }),
    prisma.brand.count({ where: { isActive: true } }),
    prisma.phoneModel.count({ where: { isActive: true } }),
    prisma.dealer.count(),
  ]);

  const countByStatus = new Map<ListingStatus, number>(
    statusGroups.map((g) => [g.status, g._count._all]),
  );
  const totalListings = statusGroups.reduce((sum, g) => sum + g._count._all, 0);

  return {
    totalUsers,
    newUsers7d,
    totalListings,
    pendingListings: countByStatus.get(LISTING_STATUSES.PENDING_APPROVAL) ?? 0,
    activeListings: countByStatus.get(LISTING_STATUSES.ACTIVE) ?? 0,
    rejectedListings: countByStatus.get(LISTING_STATUSES.REJECTED) ?? 0,
    soldListings: countByStatus.get(LISTING_STATUSES.SOLD) ?? 0,
    openReports,
    totalBrands,
    totalModels,
    totalDealers,
  };
}

const REGION_CONFIG: ReadonlyArray<{
  region: MarketRegion;
  label: string;
  flag: string;
  currency: string;
  countryCodes: readonly string[];
}> = [
  { region: "BAHRAIN", label: "Bahrain", flag: "🇧🇭", currency: "BHD", countryCodes: ["BH"] },
  { region: "PAKISTAN", label: "Pakistan", flag: "🇵🇰", currency: "PKR", countryCodes: ["PK"] },
];

function toLocationCounts(
  rows: Array<{ name: string | null; count: number }>,
): RegionLocationCount[] {
  return rows
    .filter((row): row is { name: string; count: number } => Boolean(row.name))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ name, count }) => ({ name, count }));
}

/**
 * Region-scoped marketplace metrics. Each region keeps its own currency;
 * BHD and PKR values are never converted or aggregated into one total.
 */
export async function getRegionAnalytics(): Promise<RegionAnalytics> {
  const [
    userGroups,
    listingGroups,
    activeListingGroups,
    orderGroups,
    paymentGroups,
    cityGroups,
    areaGroups,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ["region"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.listing.groupBy({
      by: ["region"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.listing.groupBy({
      by: ["region"],
      where: { deletedAt: null, status: LISTING_STATUSES.ACTIVE },
      _count: { _all: true },
    }),
    prisma.order.groupBy({ by: ["region"], _count: { _all: true } }),
    prisma.payment.groupBy({
      by: ["country", "currency"],
      where: { status: "SUCCEEDED" },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.listing.groupBy({
      by: ["region", "city"],
      where: { deletedAt: null, city: { not: null } },
      _count: { _all: true },
    }),
    prisma.listing.groupBy({
      by: ["region", "area"],
      where: { deletedAt: null, area: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const regions: RegionMetric[] = REGION_CONFIG.map((config) => {
    const users = userGroups.find((g) => g.region === config.region)?._count._all ?? 0;
    const listings = listingGroups.find((g) => g.region === config.region)?._count._all ?? 0;
    const activeListings =
      activeListingGroups.find((g) => g.region === config.region)?._count._all ?? 0;
    const orders = orderGroups.find((g) => g.region === config.region)?._count._all ?? 0;

    const payments = paymentGroups.filter(
      (g) =>
        config.countryCodes.includes(g.country.toUpperCase()) && g.currency === config.currency,
    );

    return {
      region: config.region,
      label: config.label,
      flag: config.flag,
      currency: config.currency,
      users,
      listings,
      activeListings,
      orders,
      paidPayments: payments.reduce((sum, g) => sum + g._count._all, 0),
      paymentVolume: payments.reduce((sum, g) => sum + Number(g._sum.amount ?? 0), 0),
      topCities: toLocationCounts(
        cityGroups
          .filter((g) => g.region === config.region)
          .map((g) => ({ name: g.city, count: g._count._all })),
      ),
      topAreas: toLocationCounts(
        areaGroups
          .filter((g) => g.region === config.region)
          .map((g) => ({ name: g.area, count: g._count._all })),
      ),
    };
  });

  return { regions, generatedAt: new Date().toISOString() };
}

/**
 * Buyer conversion funnel from persisted state, never from client-side events.
 * Views, favorites and chats are listing-scoped; orders are region-scoped.
 */
export async function getConversionFunnel(): Promise<ConversionFunnel> {
  const scoped = await Promise.all(
    REGION_CONFIG.map(async (config) => {
      const listingWhere = { region: config.region, deletedAt: null } as const;
      const [views, favorites, chats, orders, paidOrders] = await Promise.all([
        prisma.listing.aggregate({ where: listingWhere, _sum: { views: true } }),
        prisma.favorite.count({ where: { listing: listingWhere } }),
        prisma.conversation.count({ where: { listing: listingWhere } }),
        prisma.order.count({ where: { region: config.region } }),
        prisma.order.count({ where: { region: config.region, paymentStatus: "PAID" } }),
      ]);

      return {
        region: config.region,
        label: config.label,
        flag: config.flag,
        views: views._sum.views ?? 0,
        favorites,
        chats,
        orders,
        paidOrders,
      } satisfies ConversionFunnelRow;
    }),
  );

  return { metrics: buildConversionFunnel(scoped), generatedAt: new Date().toISOString() };
}

// --------------------------------------------------------------------------
// Users
// --------------------------------------------------------------------------

export async function listUsers(params: {
  q?: string;
  page: number;
}): Promise<Paginated<AdminUserRow>> {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q, mode: "insensitive" } },
            { email: { contains: params.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const skip = (params.page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { listings: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const items: AdminUserRow[] = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    banned: u.banned,
    emailVerified: u.emailVerified,
    listingCount: u._count.listings,
    createdAt: u.createdAt.toISOString(),
  }));
  return paginate(items, total, params.page);
}

export async function setUserBanned(
  userId: string,
  banned: boolean,
  reason?: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { banned, banReason: banned ? (reason ?? "Violation of marketplace policy") : null },
  });
}

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { role } });
}

/** Whether `userId` is the only remaining admin (guards against self-demotion lockout). */
export async function isLastAdmin(userId: string): Promise<boolean> {
  const admins = await prisma.user.findMany({
    where: { role: USER_ROLES.ADMIN, deletedAt: null },
    select: { id: true },
    take: 2,
  });
  return admins.length === 1 && admins[0]?.id === userId;
}

// --------------------------------------------------------------------------
// Listings (admin override — not seller-scoped)
// --------------------------------------------------------------------------

export async function listListings(params: {
  q?: string;
  status?: ListingStatus;
  region?: "BAHRAIN" | "PAKISTAN" | "ALL";
  page: number;
}): Promise<Paginated<AdminListingRow>> {
  const where: Prisma.ListingWhereInput = {
    deletedAt: null,
    ...(params.status ? { status: params.status } : {}),
    ...(params.q ? { title: { contains: params.q, mode: "insensitive" } } : {}),
    ...(params.region && params.region !== "ALL" ? { region: params.region } : {}),
  };
  const skip = (params.page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        currency: true,
        status: true,
        region: true,
        city: true,
        views: true,
        createdAt: true,
        seller: { select: { name: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  const items: AdminListingRow[] = rows.map((l) => ({
    id: l.id,
    title: l.title,
    slug: l.slug,
    price: Number(l.price),
    currency: l.currency,
    status: l.status,
    region: l.region,
    city: l.city ?? "—",
    views: l.views,
    sellerName: l.seller.name,
    createdAt: l.createdAt.toISOString(),
  }));
  return paginate(items, total, params.page);
}

export async function adminSetListingStatus(
  listingId: string,
  status: ListingStatus,
): Promise<boolean> {
  if (status === LISTING_STATUSES.ACTIVE) {
    const result = await prisma.listing.updateMany({
      where: { id: listingId, status: { not: LISTING_STATUSES.ACTIVE } },
      data: { status },
    });
    return result.count > 0;
  }

  await prisma.listing.update({ where: { id: listingId }, data: { status } });
  return false;
}

export async function adminRemoveListing(listingId: string): Promise<void> {
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: LISTING_STATUSES.REMOVED, deletedAt: new Date() },
  });
}

export async function adminApproveListing(listingId: string, adminId: string): Promise<boolean> {
  const result = await prisma.listing.updateMany({
    where: { id: listingId, status: LISTING_STATUSES.PENDING_APPROVAL, deletedAt: null },
    data: {
      status: LISTING_STATUSES.ACTIVE,
      reviewedAt: new Date(),
      reviewedById: adminId,
      rejectionReason: null,
    },
  });
  return result.count > 0;
}

export async function adminRejectListing(
  listingId: string,
  adminId: string,
  reason: string,
): Promise<void> {
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      status: LISTING_STATUSES.REJECTED,
      reviewedAt: new Date(),
      reviewedById: adminId,
      rejectionReason: reason,
    },
  });
}

// --------------------------------------------------------------------------
// Reports
// --------------------------------------------------------------------------

export async function listReports(params: {
  status?: ReportStatus;
  page: number;
}): Promise<Paginated<AdminReportRow>> {
  const where: Prisma.ReportWhereInput = params.status ? { status: params.status } : {};
  const skip = (params.page - 1) * PAGE_SIZE;

  const [rows, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
        reporter: { select: { name: true } },
        listing: { select: { title: true, slug: true } },
        reportedUser: { select: { name: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  const items: AdminReportRow[] = rows.map((r) => ({
    id: r.id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    reporterName: r.reporter.name,
    listing: r.listing ? { title: r.listing.title, slug: r.listing.slug } : null,
    reportedUserName: r.reportedUser?.name ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
  return paginate(items, total, params.page);
}

export async function setReportStatus(reportId: string, status: ReportStatus): Promise<void> {
  await prisma.report.update({ where: { id: reportId }, data: { status } });
}

// --------------------------------------------------------------------------
// Categories
// --------------------------------------------------------------------------

export async function listCategories(): Promise<AdminCategoryRow[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      position: true,
      parent: { select: { name: true } },
      _count: { select: { listings: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentName: c.parent?.name ?? null,
    isActive: c.isActive,
    listingCount: c._count.listings,
    position: c.position,
  }));
}

/** Creates a category with a unique slug derived from its name. */
export async function createCategory(input: { name: string; parentId?: string }): Promise<void> {
  const base = slugify(input.name) || "category";
  // Ensure slug uniqueness without a random suffix (categories want clean URLs).
  let slug = base;
  for (
    let i = 2;
    await prisma.category.findUnique({ where: { slug }, select: { id: true } });
    i++
  ) {
    slug = `${base}-${i}`;
  }
  await prisma.category.create({
    data: { name: input.name, slug, parentId: input.parentId },
  });
}

export async function renameCategory(categoryId: string, name: string): Promise<void> {
  await prisma.category.update({ where: { id: categoryId }, data: { name } });
}

export async function setCategoryActive(categoryId: string, isActive: boolean): Promise<void> {
  await prisma.category.update({ where: { id: categoryId }, data: { isActive } });
}

/** Deletes a category only if it has no listings; returns false otherwise. */
export async function deleteCategory(categoryId: string): Promise<boolean> {
  const count = await prisma.listing.count({ where: { categoryId } });
  if (count > 0) return false;
  await prisma.category.delete({ where: { id: categoryId } });
  return true;
}

/** Flat list of categories for the "parent" selector when creating. */
export async function listCategoryOptions(): Promise<Array<{ id: string; name: string }>> {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
