import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { Region } from "@/lib/generated/prisma/enums";
import { slugify } from "@/utils/slug";
import type {
  CreateListingPromotionInput,
  CreatePromotionPaymentInput,
  CreatePromotionPlanInput,
  ListingPromotionDto,
  PromotionPaymentDto,
  PromotionPlanDto,
  PromotionPlacement,
  PromotionStatus,
} from "../types";

const planSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  placement: true,
  price: true,
  currency: true,
  durationDays: true,
  isActive: true,
  maxSlots: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PromotionPlanSelect;

const promotionSelect = {
  id: true,
  listingId: true,
  planId: true,
  status: true,
  startedAt: true,
  expiresAt: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ListingPromotionSelect;

const paymentSelect = {
  id: true,
  promotionId: true,
  amount: true,
  currency: true,
  method: true,
  status: true,
  transactionId: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PromotionPaymentSelect;

type PlanRow = Prisma.PromotionPlanGetPayload<{ select: typeof planSelect }>;
type PromotionRow = Prisma.ListingPromotionGetPayload<{ select: typeof promotionSelect }>;
type PaymentRow = Prisma.PromotionPaymentGetPayload<{ select: typeof paymentSelect }>;

function toPlanDto(row: PlanRow): PromotionPlanDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    placement: row.placement as PromotionPlacement,
    price: Number(row.price),
    currency: row.currency,
    durationDays: row.durationDays,
    isActive: row.isActive,
    maxSlots: row.maxSlots,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPromotionDto(row: PromotionRow): ListingPromotionDto {
  return {
    id: row.id,
    listingId: row.listingId,
    planId: row.planId,
    status: row.status as PromotionStatus,
    startedAt: row.startedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPaymentDto(row: PaymentRow): PromotionPaymentDto {
  return {
    id: row.id,
    promotionId: row.promotionId,
    amount: Number(row.amount),
    currency: row.currency,
    method: row.method,
    status: row.status,
    transactionId: row.transactionId,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function uniquePlanSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "plan";
  let slug = base;
  let n = 1;
  while (
    await prisma.promotionPlan.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

// ---------------------------------------------------------------------------
// Promotion Plans (Admin)
// ---------------------------------------------------------------------------

export async function createPromotionPlan(input: CreatePromotionPlanInput): Promise<string> {
  const plan = await prisma.promotionPlan.create({
    data: {
      name: input.name,
      slug: await uniquePlanSlug(input.name),
      description: input.description,
      placement: input.placement,
      price: new Prisma.Decimal(input.price),
      currency: input.region === "BAHRAIN" ? "BHD" : "PKR",
      durationDays: input.durationDays,
      maxSlots: input.maxSlots,
      isActive: input.isActive ?? true,
      region: input.region ?? "PAKISTAN",
    },
    select: { id: true },
  });
  return plan.id;
}

export async function getPromotionPlan(id: string): Promise<PromotionPlanDto | null> {
  const row = await prisma.promotionPlan.findUnique({
    where: { id },
    select: planSelect,
  });
  return row ? toPlanDto(row) : null;
}

export async function listActivePromotionPlans(region?: Region): Promise<PromotionPlanDto[]> {
  const where: Prisma.PromotionPlanWhereInput = {
    isActive: true,
    ...(region ? { region } : {}),
  };
  const rows = await prisma.promotionPlan.findMany({
    where,
    orderBy: { price: "asc" },
    select: planSelect,
  });
  return rows.map(toPlanDto);
}

export async function listAllPromotionPlans(region?: Region): Promise<PromotionPlanDto[]> {
  const where: Prisma.PromotionPlanWhereInput = region ? { region } : {};
  const rows = await prisma.promotionPlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: planSelect,
  });
  return rows.map(toPlanDto);
}

export async function updatePromotionPlan(
  id: string,
  input: Partial<CreatePromotionPlanInput>,
): Promise<PromotionPlanDto> {
  await prisma.promotionPlan.update({
    where: { id },
    data: {
      ...(input.name && {
        name: input.name,
        slug: await uniquePlanSlug(input.name, id),
      }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.placement && { placement: input.placement }),
      ...(input.price !== undefined && { price: new Prisma.Decimal(input.price) }),
      ...(input.durationDays !== undefined && { durationDays: input.durationDays }),
      ...(input.maxSlots !== undefined && { maxSlots: input.maxSlots }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
  const updated = await getPromotionPlan(id);
  if (!updated) throw new Error("Updated promotion plan could not be loaded.");
  return updated;
}

export async function deletePromotionPlan(id: string): Promise<void> {
  await prisma.promotionPlan.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Listing Promotions
// ---------------------------------------------------------------------------

export async function createListingPromotion(input: CreateListingPromotionInput): Promise<string> {
  const plan = await prisma.promotionPlan.findUnique({
    where: { id: input.planId, isActive: true },
    select: { durationDays: true, price: true },
  });
  if (!plan) throw new Error("Promotion plan not found or inactive.");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + plan.durationDays);

  const promotion = await prisma.listingPromotion.create({
    data: {
      listingId: input.listingId,
      planId: input.planId,
      expiresAt,
    },
    select: { id: true },
  });
  return promotion.id;
}

export async function getListingPromotion(listingId: string): Promise<ListingPromotionDto | null> {
  const row = await prisma.listingPromotion.findFirst({
    where: {
      listingId,
      status: "ACTIVE",
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: promotionSelect,
  });
  return row ? toPromotionDto(row) : null;
}

export async function updateListingPromotionStatus(
  id: string,
  status: "ACTIVE" | "PAUSED" | "CANCELLED",
): Promise<void> {
  await prisma.listingPromotion.update({
    where: { id },
    data: { status },
  });
}

export async function getActivePromotedListings(region?: Region): Promise<
  { listingId: string; promotion: ListingPromotionDto; listingTitle: string; amountPaid: number }[]
> {
  const rows = await prisma.listingPromotion.findMany({
    where: {
      status: "ACTIVE",
      expiresAt: { gte: new Date() },
      ...(region ? { listing: { region } } : {}),
    },
    select: {
      ...promotionSelect,
      listing: {
        select: { title: true },
      },
      plan: {
        select: { placement: true, price: true },
      },
      payments: {
        where: { status: "COMPLETED" },
        select: { amount: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((row) => ({
    listingId: row.listingId,
    promotion: toPromotionDto(row),
    listingTitle: row.listing.title,
    amountPaid:
      row.payments.length > 0 && row.payments[0]
        ? Number(row.payments[0].amount)
        : Number(row.plan.price),
  }));
}

// Mark expired promotions as expired (cron job or on-demand)
export async function markExpiredPromotions(): Promise<number> {
  const result = await prisma.listingPromotion.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lt: new Date() },
    },
    data: { status: "EXPIRED" },
  });
  return result.count;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function createPromotionPayment(input: CreatePromotionPaymentInput): Promise<string> {
  // Snapshot the plan price server-side — do NOT trust the client-supplied amount
  // (ADR-012: seller-submitted outcomes are never accepted as payment verification).
  const plan = await prisma.promotionPlan.findUnique({
    where: { id: input.promotionId },
    select: { price: true, currency: true },
  });
  if (!plan) throw new Error("Promotion plan not found.");

  const amount = new Prisma.Decimal(plan.price);
  const currency = plan.currency ?? "PKR";

  const payment = await prisma.promotionPayment.create({
    data: {
      promotionId: input.promotionId,
      amount,
      currency,
      method: input.method,
      transactionId: input.transactionId,
      status: "PENDING",
    },
    select: { id: true },
  });
  return payment.id;
}

export async function updatePromotionPaymentStatus(id: string, status: string): Promise<void> {
  await prisma.promotionPayment.update({
    where: { id },
    data: { status },
  });
}

export async function getPromotionPayments(promotionId: string): Promise<PromotionPaymentDto[]> {
  const rows = await prisma.promotionPayment.findMany({
    where: { promotionId },
    orderBy: { createdAt: "desc" },
    select: paymentSelect,
  });
  return rows.map(toPaymentDto);
}

/** Get promotion info including ownership verification data. */
export async function getPromotionInfo(promotionId: string) {
  const promotion = await prisma.listingPromotion.findUnique({
    where: { id: promotionId },
    select: {
      id: true,
      listingId: true,
      planId: true,
      status: true,
      startedAt: true,
      expiresAt: true,
      listing: {
        select: { title: true, sellerId: true },
      },
      plan: {
        select: { placement: true, price: true },
      },
    },
  });
  if (!promotion) return null;
  return promotion;
}
