import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  transaction: vi.fn(),
  orderUpdate: vi.fn().mockResolvedValue({}),
  auditCreate: vi.fn().mockResolvedValue({}),
  notifyOrderStatusChange: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: { findUnique: mocks.findUnique },
    auditLog: { create: mocks.auditCreate },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/features/notifications/services/notification-delivery.service", () => ({
  notifyOrderStatusChange: mocks.notifyOrderStatusChange,
}));

import { transitionOrderStatus } from "@/features/orders/services/order-status.service";

function orderFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    status: "CONFIRMED",
    customerId: "customer-1",
    region: "BAHRAIN",
    items: [{ listing: { sellerId: "seller-1" } }],
    ...overrides,
  };
}

describe("Order status transition authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) =>
      cb({
        order: { update: mocks.orderUpdate },
        auditLog: { create: mocks.auditCreate },
      }),
    );
  });

  it("rejects a seller who has no item in the order", async () => {
    mocks.findUnique.mockResolvedValue(orderFixture({ items: [{ listing: { sellerId: "other-seller" } }] }));

    const result = await transitionOrderStatus("order-1", "PROCESSING", "seller-1", "SELLER");

    expect(result.success).toBe(false);
    expect(result.error).toBe("You do not have an item in this order");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("allows a seller to process an order containing their item", async () => {
    mocks.findUnique.mockResolvedValue(orderFixture());

    const result = await transitionOrderStatus("order-1", "PROCESSING", "seller-1", "SELLER");

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("PROCESSING");
    expect(mocks.orderUpdate).toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalled();
  });

  it("rejects a customer acting on another customer's order", async () => {
    mocks.findUnique.mockResolvedValue(orderFixture({ status: "PENDING" }));

    const result = await transitionOrderStatus("order-1", "CANCELLED", "customer-2", "CUSTOMER");

    expect(result.success).toBe(false);
    expect(result.error).toBe("You do not own this order");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("allows a customer to cancel their own order", async () => {
    mocks.findUnique.mockResolvedValue(orderFixture({ status: "PENDING" }));

    const result = await transitionOrderStatus("order-1", "CANCELLED", "customer-1", "CUSTOMER");

    expect(result.success).toBe(true);
    expect(result.newStatus).toBe("CANCELLED");
  });

  it("rejects an admin-only transition attempted by a seller who owns the order", async () => {
    mocks.findUnique.mockResolvedValue(orderFixture({ status: "PENDING" }));

    const result = await transitionOrderStatus("order-1", "CONFIRMED", "seller-1", "SELLER");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Insufficient permissions for this transition");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("rejects an invalid status transition", async () => {
    mocks.findUnique.mockResolvedValue(orderFixture({ status: "DELIVERED" }));

    const result = await transitionOrderStatus("order-1", "PENDING", "admin-1", "ADMIN");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Cannot transition");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("requires a tracking number when shipping", async () => {
    mocks.findUnique.mockResolvedValue(orderFixture({ status: "PROCESSING" }));

    const result = await transitionOrderStatus("order-1", "SHIPPED", "seller-1", "SELLER");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Tracking number is required for this transition");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("records tracking number in the audit history when shipping", async () => {
    mocks.findUnique.mockResolvedValue(orderFixture({ status: "PROCESSING" }));

    const result = await transitionOrderStatus("order-1", "SHIPPED", "seller-1", "SELLER", "TRACK-123");

    expect(result.success).toBe(true);
    const auditCall = mocks.auditCreate.mock.calls[0]![0];
    expect(auditCall.data.action).toBe("ORDER_STATUS_CHANGE");
    expect(auditCall.data.after.trackingNumber).toBe("TRACK-123");
  });
});
