import { z } from "zod";

export const PROMOTION_PLACEMENTS = [
  "FEATURED",
  "BOOSTED",
  "TOP_SEARCH",
  "CATEGORY_FEATURED",
  "HOMEPAGE_FEATURED",
] as const;

export const PROMOTION_STATUSES = ["ACTIVE", "PAUSED", "EXPIRED", "CANCELLED"] as const;

export const createPromotionPlanSchema = z.object({
  name: z.string().trim().min(3, "Name is too short").max(100),
  description: z.string().trim().max(500).optional(),
  placement: z.enum(PROMOTION_PLACEMENTS),
  price: z.number({ message: "Enter a valid price" }).positive("Price must be greater than 0"),
  durationDays: z
    .number({ message: "Enter a valid duration" })
    .int()
    .positive("Duration must be at least 1 day"),
  maxSlots: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updatePromotionPlanSchema = createPromotionPlanSchema.partial().extend({
  id: z.string().trim().min(1, "Plan ID is required"),
});

export const createListingPromotionSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  planId: z.string().min(1, "Plan ID is required"),
});

export const createPromotionPaymentSchema = z.object({
  promotionId: z.string().min(1, "Promotion ID is required"),
  amount: z.number({ message: "Enter a valid amount" }).positive("Amount must be greater than 0"),
  // NOTE: status and transactionId are NOT client-supplied; they come from provider verification.
  // This prevents seller-submitted outcomes from being accepted (ADR-012).
  method: z.string().trim().min(1, "Payment method is required"),
  transactionId: z.string().trim().optional(),
});

export type CreatePromotionPlanInput = z.infer<typeof createPromotionPlanSchema>;
export type CreateListingPromotionInput = z.infer<typeof createListingPromotionSchema>;
export type CreatePromotionPaymentInput = z.infer<typeof createPromotionPaymentSchema>;
