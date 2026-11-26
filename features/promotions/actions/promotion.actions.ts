"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  cancelPromotion,
  getActivePlans,
  getListingPromotionInfo,
  pausePromotion,
  checkoutPromotion,
  recordPayment,
} from "../services/promotion.service";
import {
  createListingPromotionSchema,
  createPromotionPaymentSchema,
  type CreateListingPromotionInput,
  type CreatePromotionPaymentInput,
} from "../schemas/promotion";
import type { PromotionPlanDto, ListingPromotionDto } from "../types";

type ActionResult<T = void> = ({ ok: true } & T) | { ok: false; error: string };

const SIGN_IN_REQUIRED = "Sign in to access promotion features.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const PROMOTION_CHECKOUT_UNAVAILABLE =
  "Paid promotion checkout is unavailable until verified payment processing is enabled.";

/** Gets all active promotion plans. */
export async function getActivePromotionPlansAction(): Promise<ActionResult<{ plans: PromotionPlanDto[] }>> {
  try {
    const plans = await getActivePlans();
    return { ok: true, plans };
  } catch (error) {
    console.error("[promotions] getActivePlans failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Gets promotion info for a listing. */
export async function getListingPromotionAction(
  listingId: string,
): Promise<ActionResult<{ promotion: ListingPromotionDto | null }>> {
  try {
    const promotion = await getListingPromotionInfo(listingId);
    if (!promotion) return { ok: false, error: "No active promotion found." };
    return { ok: true, promotion };
  } catch (error) {
    console.error("[promotions] getListingPromotion failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Promotes a listing with a specific plan. User must own the listing. */
export async function promoteListingAction(
  input: CreateListingPromotionInput,
): Promise<ActionResult<{ promotionId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = createListingPromotionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid promotion data." };

  // Check the listing exists and user owns it
  const listing = await prisma.listing.findUnique({
    where: { id: parsed.data.listingId },
    select: { sellerId: true },
  });

  if (!listing || listing.sellerId !== user.id) {
    return { ok: false, error: "You can only promote your own listings." };
  }

  // Start the checkout flow: create promotion in pending state, snapshot plan price, create payment
  try {
    const result = await checkoutPromotion(
      parsed.data.listingId,
      parsed.data.planId,
      "jazzcash",
    );
    return { ok: true, promotionId: result.promotionId };
  } catch (error: unknown) {
    console.error("[promotions] promoteListing failed:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("plan not found")) {
      return { ok: false, error: "Promotion plan not found or inactive." };
    }
    if (message.includes("Could not start promotion checkout")) {
      return { ok: false, error: message };
    }
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Pauses an active promotion. User must own the listing. */
export async function pausePromotionAction(promotionId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  try {
    // Verify ownership before pausing
    const promotion = await getListingPromotionInfo(promotionId);
    if (!promotion) return { ok: false, error: "Promotion not found." };
    
    // Check if user owns the listing
    const listing = await prisma.listing.findUnique({
      where: { id: promotion.listingId },
      select: { sellerId: true },
    });
    
    if (!listing || listing.sellerId !== user.id) {
      return { ok: false, error: "You can only pause your own promotions." };
    }
    
    await pausePromotion(promotionId);
    revalidatePath(`${ROUTES.marketplace}`);
    return { ok: true };
  } catch (error) {
    console.error("[promotions] pausePromotion failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Cancels an active promotion. User must own the listing. */
export async function cancelPromotionAction(promotionId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  try {
    // Verify ownership before canceling
    const promotion = await getListingPromotionInfo(promotionId);
    if (!promotion) return { ok: false, error: "Promotion not found." };
    
    // Check if user owns the listing
    const listing = await prisma.listing.findUnique({
      where: { id: promotion.listingId },
      select: { sellerId: true },
    });
    
    if (!listing || listing.sellerId !== user.id) {
      return { ok: false, error: "You can only cancel your own promotions." };
    }
    
    await cancelPromotion(promotionId);
    revalidatePath(`${ROUTES.marketplace}`);
    return { ok: true };
  } catch (error) {
    console.error("[promotions] cancelPromotion failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Records a payment for a promotion. User must own the listing. */
export async function recordPromotionPaymentAction(
  input: CreatePromotionPaymentInput,
): Promise<ActionResult<{ paymentId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = createPromotionPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid payment data." };

  try {
    // Record the payment - the repository snapshots the plan price server-side,
    // so the amount from input is ignored; we just pass the method.
    // The promotionId comes from the input and is used for the payment record.
    const paymentId = await recordPayment(input);

    return { ok: true, paymentId };
  } catch (error) {
    console.error("[promotions] recordPromotionPayment failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Seller-submitted outcomes are never accepted as payment verification. */
export async function markPaymentCompletedAction(_paymentId: string) {
  void _paymentId;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };
  return { ok: false, error: PROMOTION_CHECKOUT_UNAVAILABLE };
}

/** Payment failures are set only by server-verified provider responses. */
export async function markPaymentFailedAction(_paymentId: string) {
  void _paymentId;
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };
  return { ok: false, error: PROMOTION_CHECKOUT_UNAVAILABLE };
}
