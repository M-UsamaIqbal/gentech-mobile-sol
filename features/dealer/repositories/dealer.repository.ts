import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { slugify } from "@/utils/slug";
import type {
  CreateBranchInput,
  CreateDealerInput,
  DealerBranchDto,
  DealerApplicationDto,
  DealerDto,
  DealerInventoryDto,
  DealerUserDto,
  UpdateDealerInput,
} from "../types";

// ---------------------------------------------------------------------------
// Selects
// ---------------------------------------------------------------------------

const dealerSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logo: true,
  coverImage: true,
  businessName: true,
  businessType: true,
  taxNumber: true,
  phone: true,
  email: true,
  website: true,
  city: true,
  address: true,
  latitude: true,
  longitude: true,
  status: true,
  plan: true,
  planExpiresAt: true,
  featuredUntil: true,
  isVerified: true,
  verifiedAt: true,
  reviewNote: true,
  listingCount: true,
  soldCount: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DealerSelect;

const adminDealerSelect = {
  ...dealerSelect,
  users: {
    where: { role: "owner", isActive: true },
    take: 1,
    select: { user: { select: { name: true, email: true } } },
  },
} satisfies Prisma.DealerSelect;

const branchSelect = {
  id: true,
  dealerId: true,
  name: true,
  address: true,
  city: true,
  phone: true,
  email: true,
  latitude: true,
  longitude: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DealerBranchSelect;

const inventorySelect = {
  id: true,
  dealerId: true,
  listingId: true,
  sku: true,
  stockCount: true,
  location: true,
  costPrice: true,
  acquiredAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DealerInventorySelect;

const dealerUserSelect = {
  id: true,
  dealerId: true,
  userId: true,
  role: true,
  isActive: true,
  joinedAt: true,
  user: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.DealerUserSelect;

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function toDealerDto(row: Prisma.DealerGetPayload<{ select: typeof dealerSelect }>): DealerDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    logo: row.logo,
    coverImage: row.coverImage,
    businessName: row.businessName,
    businessType: row.businessType,
    taxNumber: row.taxNumber,
    phone: row.phone,
    email: row.email,
    website: row.website,
    city: row.city,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
    plan: row.plan,
    planExpiresAt: row.planExpiresAt?.toISOString() ?? null,
    featuredUntil: row.featuredUntil?.toISOString() ?? null,
    isVerified: row.isVerified,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    reviewNote: row.reviewNote,
    listingCount: row.listingCount,
    soldCount: row.soldCount,
    rating: row.rating,
    reviewCount: row.reviewCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toBranchDto(
  row: Prisma.DealerBranchGetPayload<{ select: typeof branchSelect }>,
): DealerBranchDto {
  return {
    id: row.id,
    dealerId: row.dealerId,
    name: row.name,
    address: row.address,
    city: row.city,
    phone: row.phone,
    email: row.email,
    latitude: row.latitude,
    longitude: row.longitude,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toInventoryDto(
  row: Prisma.DealerInventoryGetPayload<{ select: typeof inventorySelect }>,
): DealerInventoryDto {
  return {
    id: row.id,
    dealerId: row.dealerId,
    listingId: row.listingId,
    sku: row.sku,
    stockCount: row.stockCount,
    location: row.location,
    costPrice: row.costPrice ? Number(row.costPrice) : null,
    acquiredAt: row.acquiredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDealerUserDto(
  row: Prisma.DealerUserGetPayload<{ select: typeof dealerUserSelect }>,
): DealerUserDto {
  return {
    id: row.id,
    dealerId: row.dealerId,
    userId: row.userId,
    userName: row.user.name,
    userEmail: row.user.email,
    role: row.role,
    isActive: row.isActive,
    joinedAt: row.joinedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Dealers
// ---------------------------------------------------------------------------

async function uniqueDealerSlug(name: string): Promise<string> {
  const base = slugify(name) || "dealer";
  let slug = base;
  let n = 1;
  while (await prisma.dealer.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function createDealer(input: CreateDealerInput, ownerId: string): Promise<string> {
  const slug = await uniqueDealerSlug(input.name);

  const dealer = await prisma.dealer.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      businessName: input.businessName,
      businessType: input.businessType,
      taxNumber: input.taxNumber,
      phone: input.phone,
      email: input.email,
      website: input.website,
      city: input.city,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      users: {
        create: {
          userId: ownerId,
          role: "owner",
        },
      },
    },
    select: { id: true },
  });

  return dealer.id;
}

export async function getDealerById(id: string): Promise<DealerDto | null> {
  const row = await prisma.dealer.findUnique({
    where: { id },
    select: dealerSelect,
  });
  return row ? toDealerDto(row) : null;
}

export async function getDealerBySlug(slug: string): Promise<DealerDto | null> {
  const row = await prisma.dealer.findUnique({
    where: { slug },
    select: dealerSelect,
  });
  return row ? toDealerDto(row) : null;
}

export async function getDealerByUserId(userId: string): Promise<DealerDto | null> {
  const dealerUser = await prisma.dealerUser.findFirst({
    where: { userId, isActive: true },
    select: { dealer: { select: dealerSelect } },
  });
  return dealerUser?.dealer ? toDealerDto(dealerUser.dealer) : null;
}

export async function getDealerMembershipByUserId(userId: string): Promise<{
  dealer: DealerDto;
  role: string;
} | null> {
  const membership = await prisma.dealerUser.findFirst({
    where: { userId, isActive: true },
    select: { role: true, dealer: { select: dealerSelect } },
  });
  if (!membership) return null;
  return { dealer: toDealerDto(membership.dealer), role: membership.role };
}

export async function updateDealer(
  id: string,
  input: UpdateDealerInput,
  resubmit = false,
): Promise<void> {
  await prisma.dealer.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.logo !== undefined && { logo: input.logo }),
      ...(input.coverImage !== undefined && { coverImage: input.coverImage }),
      ...(input.businessName !== undefined && { businessName: input.businessName }),
      ...(input.businessType !== undefined && { businessType: input.businessType }),
      ...(input.taxNumber !== undefined && { taxNumber: input.taxNumber }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.website !== undefined && { website: input.website }),
      ...(input.city !== undefined && { city: input.city }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.latitude !== undefined && { latitude: input.latitude }),
      ...(input.longitude !== undefined && { longitude: input.longitude }),
      ...(resubmit && {
        status: "PENDING",
        isVerified: false,
        verifiedAt: null,
        reviewNote: null,
      }),
    },
  });
}

export async function getDealerReviewQueue(params: {
  status?: DealerDto["status"];
  q?: string;
}): Promise<DealerApplicationDto[]> {
  const query = params.q?.trim().slice(0, 100);
  const rows = await prisma.dealer.findMany({
    where: {
      ...(params.status ? { status: params.status } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { businessName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: adminDealerSelect,
  });

  return rows.map((row) => ({
    ...toDealerDto(row),
    owner: row.users[0]?.user ?? null,
  }));
}

export async function getDealerStatusCounts(): Promise<Record<DealerDto["status"], number>> {
  const groups = await prisma.dealer.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return {
    ACTIVE: groups.find((group) => group.status === "ACTIVE")?._count._all ?? 0,
    SUSPENDED: groups.find((group) => group.status === "SUSPENDED")?._count._all ?? 0,
    PENDING: groups.find((group) => group.status === "PENDING")?._count._all ?? 0,
    REJECTED: groups.find((group) => group.status === "REJECTED")?._count._all ?? 0,
  };
}

export async function reviewDealerApplication(input: {
  dealerId: string;
  status: "ACTIVE" | "REJECTED";
  reason?: string;
}): Promise<boolean> {
  const result = await prisma.dealer.updateMany({
    where: { id: input.dealerId, status: "PENDING" },
    data: {
      status: input.status,
      isVerified: input.status === "ACTIVE",
      verifiedAt: input.status === "ACTIVE" ? new Date() : null,
      reviewNote: input.status === "REJECTED" ? input.reason : null,
    },
  });
  return result.count === 1;
}

export async function listActiveDealers(limit = 20): Promise<DealerDto[]> {
  const rows = await prisma.dealer.findMany({
    where: { status: "ACTIVE", isVerified: true },
    orderBy: { listingCount: "desc" },
    take: limit,
    select: dealerSelect,
  });
  return rows.map(toDealerDto);
}

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

export async function createBranch(input: CreateBranchInput): Promise<string> {
  const branch = await prisma.dealerBranch.create({
    data: {
      dealerId: input.dealerId,
      name: input.name,
      address: input.address,
      city: input.city,
      phone: input.phone,
      email: input.email,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    select: { id: true },
  });
  return branch.id;
}

export async function getBranchesByDealer(dealerId: string): Promise<DealerBranchDto[]> {
  const rows = await prisma.dealerBranch.findMany({
    where: { dealerId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: branchSelect,
  });
  return rows.map(toBranchDto);
}

export async function setDealerBranchActive(input: {
  dealerId: string;
  branchId: string;
  isActive: boolean;
}): Promise<boolean> {
  const result = await prisma.dealerBranch.updateMany({
    where: { id: input.branchId, dealerId: input.dealerId },
    data: { isActive: input.isActive },
  });
  return result.count === 1;
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export async function addInventoryToDealer(input: {
  dealerId: string;
  listingId?: string;
  sku?: string;
  stockCount: number;
  location?: string;
  costPrice?: number;
}): Promise<string> {
  if (input.listingId) {
    const listing = await prisma.listing.findFirst({
      where: { id: input.listingId, dealerId: input.dealerId, deletedAt: null },
      select: { id: true },
    });
    if (!listing) {
      throw new Error("Choose a listing that belongs to your dealer account.");
    }
  }

  const inventory = await prisma.dealerInventory.create({
    data: {
      dealerId: input.dealerId,
      listingId: input.listingId || undefined,
      sku: input.sku || undefined,
      stockCount: input.stockCount,
      location: input.location || undefined,
      costPrice: input.costPrice !== undefined ? new Prisma.Decimal(input.costPrice) : undefined,
      acquiredAt: new Date(),
    },
    select: { id: true },
  });
  return inventory.id;
}

export async function updateDealerInventory(input: {
  dealerId: string;
  inventoryId: string;
  stockCount: number;
  location?: string;
}): Promise<boolean> {
  const result = await prisma.dealerInventory.updateMany({
    where: { id: input.inventoryId, dealerId: input.dealerId },
    data: {
      stockCount: input.stockCount,
      ...(input.location !== undefined ? { location: input.location || null } : {}),
    },
  });
  return result.count === 1;
}

export async function removeDealerInventory(input: {
  dealerId: string;
  inventoryId: string;
}): Promise<boolean> {
  const result = await prisma.dealerInventory.deleteMany({
    where: { id: input.inventoryId, dealerId: input.dealerId },
  });
  return result.count === 1;
}

export async function getDealerInventory(dealerId: string): Promise<DealerInventoryDto[]> {
  const rows = await prisma.dealerInventory.findMany({
    where: { dealerId },
    orderBy: { createdAt: "desc" },
    select: inventorySelect,
  });
  return rows.map(toInventoryDto);
}

// ---------------------------------------------------------------------------
// Dealer Users
// ---------------------------------------------------------------------------

export async function addUserToDealer(
  dealerId: string,
  userId: string,
  role: string = "staff",
): Promise<void> {
  await prisma.dealerUser.create({
    data: {
      dealerId,
      userId,
      role,
    },
  });
}

export async function getDealerUsers(dealerId: string): Promise<DealerUserDto[]> {
  const rows = await prisma.dealerUser.findMany({
    where: { dealerId },
    orderBy: { joinedAt: "desc" },
    select: dealerUserSelect,
  });
  return rows.map(toDealerUserDto);
}

export async function removeUserFromDealer(dealerId: string, userId: string): Promise<void> {
  await prisma.dealerUser.deleteMany({
    where: { dealerId, userId },
  });
}

/**
 * Converts a dealer lead to a dealer account.
 * Creates the dealer and links the converted lead.
 */
export async function convertLeadToDealer(input: {
  dealerId: string;
  leadId: string;
  source: "admin" | "import" | "conversation";
  conversionNotes?: string;
}): Promise<{ dealer: DealerDto; leadConverted: boolean }> {
  // Check if dealer already exists
  const existingDealer = await prisma.dealer.findUnique({
    where: { id: input.dealerId },
  });

  if (existingDealer) {
    return { dealer: toDealerDto(existingDealer), leadConverted: false };
  }

  // Create the dealer account
  const ownerId = input.leadId; // Using lead ID as temporary owner user ID
  const slug = await uniqueDealerSlug(input.leadId || "dealer");

  const newDealer = await prisma.dealer.create({
    data: {
      name: input.leadId || "New Dealer",
      slug,
      description: `Dealer converted from lead`,
      businessName: input.leadId || "New Dealer",
      businessType: "retailer",
      taxNumber: "",
      phone: "",
      email: "",
      city: "",
      address: "",
      status: "PENDING",
      plan: "BASIC",
      featuredUntil: null,
      isVerified: false,
      verifiedAt: null,
      reviewNote: null,
      listingCount: 0,
      soldCount: 0,
      rating: 0,
      reviewCount: 0,
      users: {
        create: {
          userId: ownerId,
          role: "owner",
        },
      },
    },
    select: dealerSelect,
  });

  return { dealer: toDealerDto(newDealer), leadConverted: true };
}
