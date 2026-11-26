import { describe, expect, it } from "vitest";

import {
  createPromotionPlanSchema,
  updatePromotionPlanSchema,
} from "@/features/promotions/schemas/promotion";

describe("promotion plan validation", () => {
  it("accepts a positive PKR package with optional unlimited slots", () => {
    expect(
      createPromotionPlanSchema.safeParse({
        name: "Featured Week",
        description: "Highlight your listing for buyers.",
        placement: "FEATURED",
        price: 2500,
        durationDays: 7,
        maxSlots: null,
        isActive: true,
      }).success,
    ).toBe(true);
  });

  it("rejects invalid price, duration, and slot limits", () => {
    const base = {
      name: "Featured Week",
      placement: "FEATURED",
      price: 2500,
      durationDays: 7,
    };

    expect(createPromotionPlanSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
    expect(createPromotionPlanSchema.safeParse({ ...base, durationDays: 0 }).success).toBe(false);
    expect(createPromotionPlanSchema.safeParse({ ...base, maxSlots: 0 }).success).toBe(false);
    expect(createPromotionPlanSchema.safeParse({ ...base, placement: "UNKNOWN" }).success).toBe(
      false,
    );
  });

  it("allows partial updates but requires a plan ID", () => {
    expect(updatePromotionPlanSchema.safeParse({ id: "plan-1", isActive: false }).success).toBe(
      true,
    );
    expect(updatePromotionPlanSchema.safeParse({ isActive: false }).success).toBe(false);
    expect(updatePromotionPlanSchema.safeParse({ id: "plan-1", price: -1 }).success).toBe(false);
  });
});
