export interface PromotionPlanDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  placement: PromotionPlacement;
  price: number;
  currency: string;
  durationDays: number;
  isActive: boolean;
  maxSlots: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListingPromotionDto {
  id: string;
  listingId: string;
  planId: string;
  status: PromotionStatus;
  startedAt: string;
  expiresAt: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionPaymentDto {
  id: string;
  promotionId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export type PromotionPlacement =
  | "FEATURED"
  | "BOOSTED"
  | "TOP_SEARCH"
  | "CATEGORY_FEATURED"
  | "HOMEPAGE_FEATURED";

export type PromotionStatus = "ACTIVE" | "PAUSED" | "EXPIRED" | "CANCELLED";

export interface CreatePromotionPlanInput {
  name: string;
  description?: string;
  placement: PromotionPlacement;
  price: number;
  durationDays: number;
  maxSlots?: number | null;
  isActive?: boolean;
  region?: "BAHRAIN" | "PAKISTAN";
}

export interface CreateListingPromotionInput {
  listingId: string;
  planId: string;
}

export interface CreatePromotionPaymentInput {
  promotionId: string;
  amount: number;
  method: string;
  transactionId?: string;
}
