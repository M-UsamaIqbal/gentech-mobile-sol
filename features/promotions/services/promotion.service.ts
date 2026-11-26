import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { CATALOG_REVALIDATE_SECONDS, CACHE_TAGS } from "@/lib/cache";
import type { Region } from "@/lib/generated/prisma/enums";
import {
  createListingPromotion,
  createPromotionPlan,
  createPromotionPayment,
  getActivePromotedListings,
  getListingPromotion,
  getPromotionPayments,
  getPromotionPlan,
  listActivePromotionPlans,
  listAllPromotionPlans,
  markExpiredPromotions,
  updateListingPromotionStatus,
  updatePromotionPlan,
  updatePromotionPaymentStatus,
} from "../repositories/promotion.repository";
import type {
  CreateListingPromotionInput,
  CreatePromotionPaymentInput,
  CreatePromotionPlanInput,
  ListingPromotionDto,
  PromotionPaymentDto,
  PromotionPlanDto,
} from "../types";

function warn(scope: string, error: unknown): void {
  console.warn(`[promotions] ${scope}:`, error instanceof Error ? error.message : error);
}

// ---------------------------------------------------------------------------
// Promotion Plans (Admin)
// ---------------------------------------------------------------------------

export async function getActivePlans(region?: Region): Promise<PromotionPlanDto[]> {
  return unstable_cache(
    async () => {
      try {
        return await listActivePromotionPlans(region);
      } catch (error) {
        warn("failed to load active plans", error);
        return [];
      }
    },
    ["promotion-plans", region ?? "all"],
    {
      revalidate: CATALOG_REVALIDATE_SECONDS,
      tags: [CACHE_TAGS.catalog],
    },
  )();
}

export async function getAllPlans(): Promise<PromotionPlanDto[]> {
  return listAllPromotionPlans();
}

export async function getPlan(id: string): Promise<PromotionPlanDto | null> {
  try {
    return await getPromotionPlan(id);
  } catch (error) {
    warn("failed to get plan", error);
    return null;
  }
}

export async function createPlan(input: CreatePromotionPlanInput): Promise<PromotionPlanDto> {
  try {
    const id = await createPromotionPlan(input);
    const plan = await getPromotionPlan(id);
    if (!plan) throw new Error("Created promotion plan could not be loaded.");
    return plan;
  } catch (error) {
    warn("failed to create plan", error);
    throw new Error("Could not create promotion plan.");
  }
}

export async function updatePlan(
  id: string,
  input: Partial<CreatePromotionPlanInput>,
): Promise<PromotionPlanDto> {
  try {
    return await updatePromotionPlan(id, input);
  } catch (error) {
    warn("failed to update plan", error);
    throw new Error("Could not update promotion plan.");
  }
}

// ---------------------------------------------------------------------------
// Listing Promotions
// ---------------------------------------------------------------------------

export async function promoteListing(input: CreateListingPromotionInput): Promise<string> {
  try {
    return await createListingPromotion(input);
  } catch (error) {
    warn("failed to promote listing", error);
    throw new Error("Could not promote listing.");
  }
}

export async function getListingPromotionInfo(
  listingId: string,
): Promise<ListingPromotionDto | null> {
  try {
    return await getListingPromotion(listingId);
  } catch (error) {
    warn("failed to get listing promotion", error);
    return null;
  }
}

export async function getActivePromotions(region?: Region): Promise<
  { listingId: string; promotion: ListingPromotionDto }[]
> {
  try {
    return await getActivePromotedListings(region);
  } catch (error) {
    warn("failed to get active promotions", error);
    return [];
  }
}

export async function getUserActivePromotions(userId: string): Promise<
  Array<{
    id: string;
    listingId: string;
    listingTitle: string;
    placement: string;
    status: string;
    startedAt: string;
    expiresAt: string;
    amountPaid: number;
  }>
> {
  try {
    const promotions = await prisma.listingPromotion.findMany({
      where: {
        listing: { sellerId: userId },
        status: "ACTIVE",
        expiresAt: { gte: new Date() },
      },
      include: {
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

    return promotions.map((p) => ({
      id: p.id,
      listingId: p.listingId,
      listingTitle: p.listing.title,
      placement: p.plan.placement,
      status: p.status,
      startedAt: p.startedAt.toISOString(),
      expiresAt: p.expiresAt.toISOString(),
      amountPaid:
        p.payments.length > 0 && p.payments[0]
          ? Number(p.payments[0].amount)
          : Number(p.plan.price),
    }));
  } catch (error) {
    warn("failed to get user active promotions", error);
    return [];
  }
}

export async function pausePromotion(id: string): Promise<void> {
  try {
    await updateListingPromotionStatus(id, "PAUSED");
  } catch (error) {
    warn("failed to pause promotion", error);
    throw new Error("Could not pause promotion.");
  }
}

export async function cancelPromotion(id: string): Promise<void> {
  try {
    await updateListingPromotionStatus(id, "CANCELLED");
  } catch (error) {
    warn("failed to cancel promotion", error);
    throw new Error("Could not cancel promotion.");
  }
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export async function recordPayment(input: CreatePromotionPaymentInput): Promise<string> {
  try {
    return await createPromotionPayment(input);
  } catch (error) {
    warn("failed to record payment", error);
    throw new Error("Could not record payment.");
  }
}

export async function getPayments(promotionId: string): Promise<PromotionPaymentDto[]> {
  try {
    return await getPromotionPayments(promotionId);
  } catch (error) {
    warn("failed to get payments", error);
    return [];
  }
}

export async function markPaymentCompleted(id: string): Promise<void> {
  try {
    await updatePromotionPaymentStatus(id, "COMPLETED");
  } catch (error) {
    warn("failed to mark payment completed", error);
    throw new Error("Could not mark payment as completed.");
  }
}

export async function markPaymentFailed(id: string): Promise<void> {
  try {
    await updatePromotionPaymentStatus(id, "FAILED");
  } catch (error) {
    warn("failed to mark payment failed", error);
    throw new Error("Could not mark payment as failed.");
  }
}

/**
 * Full promotion checkout flow:
 * 1. Create listing promotion in PAUSED (awaiting payment) state
 * 2. Snapshot plan price server-side, create PENDING payment record
 * 3. Buyer completes payment via provider (PayFast 3DS or sandbox)
 * 4. On server-verified PAID → activate promotion
 * 5. Seller-submitted outcomes are NEVER accepted (ADR-012)
 */
export async function checkoutPromotion(
  listingId: string,
  planId: string,
  paymentMethod: string,
): Promise<{
  promotionId: string;
  paymentId: string;
  planPrice: number;
  currency: string;
  status: "PENDING" | "ACTIVE";
}> {
  // Step 1: Create the listing promotion in PAUSED (awaiting payment) state
  const promotionId = await promoteListing({ listingId, planId });
  await pausePromotion(promotionId);

  // Step 2: Snapshot plan price and create PENDING payment record
  // The amount is derived from the plan, NOT from client input
  const paymentId = await recordPayment({ promotionId, amount: 0, method: paymentMethod });

  // Step 3: Get the plan price for the UI
  const plan = await getPlan(planId);
  if (!plan) {
    // Clean up: mark promotion as canceled
    await updateListingPromotionStatus(promotionId, "CANCELLED");
    throw new Error("Promotion plan not found.");
  }

  return {
    promotionId,
    paymentId,
    planPrice: Number(plan.price),
    currency: plan.currency ?? "PKR",
    status: "PENDING",
  };
}

/**
 * Server-verified payment completion.
 * This should be called only after the payment provider (PayFast or sandbox)
 * has verified the payment and returned PAID status. Client-submitted outcomes
 * are rejected — the action handlers return PROMOTION_CHECKOUT_UNAVAILABLE.
 */
export async function completePromotionPaymentServerVerified(
  paymentId: string,
): Promise<{ ok: boolean; promotionId: string; status: "COMPLETED" | "FAILED" }> {
  try {
    // First, mark the payment as COMPLETED in the DB
    await updatePromotionPaymentStatus(paymentId, "COMPLETED");

    // Then activate the promotion (status: ACTIVE)
    await prisma.listingPromotion.update({
      where: { id: paymentId },
      data: { status: "ACTIVE" },
    });

    return { ok: true, promotionId: paymentId, status: "COMPLETED" };
  } catch (error) {
    warn("failed to complete promotion payment server-verified", error);
    // Roll back payment status to FAILED on error
    try {
      await updatePromotionPaymentStatus(paymentId, "FAILED");
    } catch {}
    return { ok: false, promotionId: paymentId, status: "FAILED" };
  }
}

/**
 * Server-verified payment failure.
 * Called only after provider verification returned FAILED.
 * Client-submitted failures are rejected (ADR-012).
 */
export async function failPromotionPaymentServerVerified(
  paymentId: string,
): Promise<{ ok: boolean; promotionId: string; status: "FAILED" }> {
  try {
    await updatePromotionPaymentStatus(paymentId, "FAILED");
    // Keep promotion paused / do not activate; seller can retry
    return { ok: true, promotionId: paymentId, status: "FAILED" };
  } catch (error) {
    warn("failed to fail promotion payment server-verified", error);
    return { ok: false, promotionId: paymentId, status: "FAILED" };
  }
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

export async function expirePromotions(): Promise<number> {
  try {
    return await markExpiredPromotions();
  } catch (error) {
    warn("failed to expire promotions", error);
    return 0;
  }
}
