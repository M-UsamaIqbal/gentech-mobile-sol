import { describe, expect, it } from "vitest";

import { approveDealerSchema, rejectDealerSchema } from "@/features/dealer/schemas/admin-review";

describe("dealer review validation", () => {
  it("requires a dealer ID to approve", () => {
    expect(approveDealerSchema.safeParse({ dealerId: "dealer-1" }).success).toBe(true);
    expect(approveDealerSchema.safeParse({ dealerId: "" }).success).toBe(false);
  });

  it("requires an actionable bounded rejection reason", () => {
    expect(
      rejectDealerSchema.safeParse({
        dealerId: "dealer-1",
        reason: "Please update your business address.",
      }).success,
    ).toBe(true);
    expect(rejectDealerSchema.safeParse({ dealerId: "dealer-1", reason: "no" }).success).toBe(
      false,
    );
    expect(rejectDealerSchema.safeParse({ dealerId: "dealer-1", reason: "   " }).success).toBe(
      false,
    );
    expect(
      rejectDealerSchema.safeParse({ dealerId: "dealer-1", reason: "x".repeat(501) }).success,
    ).toBe(false);
  });
});
