import { describe, expect, it } from "vitest";

import {
  addInventorySchema,
  createBranchSchema,
  createDealerSchema,
  dealerFormSchema,
  removeInventorySchema,
  updateBranchStatusSchema,
  updateDealerSchema,
  updateInventorySchema,
} from "@/features/dealer/schemas/dealer";

describe("dealer profile validation", () => {
  it("accepts a valid application with optional business details", () => {
    expect(
      createDealerSchema.safeParse({
        name: "City Mobile Center",
        businessName: "City Mobile Center",
        phone: "+92 300 1234567",
        email: "hello@citymobile.example",
        website: "https://citymobile.example",
        city: "Karachi",
      }).success,
    ).toBe(true);
  });

  it("rejects missing display names and invalid contact details", () => {
    expect(createDealerSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(
      createDealerSchema.safeParse({ name: "City Mobile", email: "not-an-email" }).success,
    ).toBe(false);
    expect(
      createDealerSchema.safeParse({ name: "City Mobile", website: "not-a-url" }).success,
    ).toBe(false);
  });

  it("accepts clearing optional profile image URLs", () => {
    expect(updateDealerSchema.safeParse({ logo: "", coverImage: "" }).success).toBe(true);
    expect(dealerFormSchema.safeParse({ name: "City Mobile", logo: "" }).success).toBe(true);
  });

  it("rejects malformed profile image URLs", () => {
    expect(updateDealerSchema.safeParse({ logo: "not-a-url" }).success).toBe(false);
  });

  it("validates branch details and activation inputs", () => {
    expect(
      createBranchSchema.safeParse({
        dealerId: "dealer-1",
        name: "Main branch",
        address: "12 Main Road",
        city: "Karachi",
      }).success,
    ).toBe(true);
    expect(
      createBranchSchema.safeParse({
        dealerId: "dealer-1",
        name: "A",
        address: "",
        city: "K",
      }).success,
    ).toBe(false);
    expect(
      updateBranchStatusSchema.safeParse({ branchId: "branch-1", isActive: false }).success,
    ).toBe(true);
    expect(updateBranchStatusSchema.safeParse({ branchId: "", isActive: "false" }).success).toBe(
      false,
    );
  });

  it("validates inventory additions, stock changes, and removal IDs", () => {
    expect(
      addInventorySchema.safeParse({ dealerId: "dealer-1", stockCount: 2, costPrice: 12.5 })
        .success,
    ).toBe(true);
    expect(addInventorySchema.safeParse({ dealerId: "dealer-1", stockCount: 0 }).success).toBe(
      false,
    );
    expect(
      updateInventorySchema.safeParse({
        inventoryId: "inventory-1",
        stockCount: 0,
        location: "",
      }).success,
    ).toBe(true);
    expect(
      updateInventorySchema.safeParse({ inventoryId: "inventory-1", stockCount: -1 }).success,
    ).toBe(false);
    expect(removeInventorySchema.safeParse({ inventoryId: "inventory-1" }).success).toBe(true);
    expect(removeInventorySchema.safeParse({ inventoryId: "" }).success).toBe(false);
  });
});
