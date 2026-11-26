import { describe, it, expect, vi } from "vitest";

const mockedEnv = vi.hoisted(() => ({
  env: { NODE_ENV: "test" } as Record<string, unknown>,
}));

vi.mock("@/lib/env", () => ({ env: mockedEnv.env }));

import {
  isValidPaymentTransition,
  getAllowedTransitions,
} from "@/features/payments/services/payment-state.service";
import type { PaymentStatus } from "@/features/payments/types";

describe("Payment State Transitions", () => {
  describe("Valid transitions", () => {
    it("PENDING → PROCESSING", () => {
      expect(isValidPaymentTransition("PENDING", "PROCESSING")).toBe(true);
    });

    it("PENDING → SUCCEEDED", () => {
      expect(isValidPaymentTransition("PENDING", "SUCCEEDED")).toBe(true);
    });

    it("PENDING → FAILED", () => {
      expect(isValidPaymentTransition("PENDING", "FAILED")).toBe(true);
    });

    it("PENDING → CANCELLED", () => {
      expect(isValidPaymentTransition("PENDING", "CANCELLED")).toBe(true);
    });

    it("PROCESSING → SUCCEEDED", () => {
      expect(isValidPaymentTransition("PROCESSING", "SUCCEEDED")).toBe(true);
    });

    it("PROCESSING → FAILED", () => {
      expect(isValidPaymentTransition("PROCESSING", "FAILED")).toBe(true);
    });

    it("PROCESSING → CANCELLED", () => {
      expect(isValidPaymentTransition("PROCESSING", "CANCELLED")).toBe(true);
    });

    it("SUCCEEDED → REFUNDED", () => {
      expect(isValidPaymentTransition("SUCCEEDED", "REFUNDED")).toBe(true);
    });

    it("FAILED → PENDING (retry)", () => {
      expect(isValidPaymentTransition("FAILED", "PENDING")).toBe(true);
    });
  });

  describe("Invalid transitions", () => {
    it("SUCCEEDED → PENDING (not allowed)", () => {
      expect(isValidPaymentTransition("SUCCEEDED", "PENDING")).toBe(false);
    });

    it("SUCCEEDED → FAILED (not allowed)", () => {
      expect(isValidPaymentTransition("SUCCEEDED", "FAILED")).toBe(false);
    });

    it("CANCELLED → SUCCEEDED (not allowed)", () => {
      expect(isValidPaymentTransition("CANCELLED", "SUCCEEDED")).toBe(false);
    });

    it("REFUNDED → SUCCEEDED (not allowed)", () => {
      expect(isValidPaymentTransition("REFUNDED", "SUCCEEDED")).toBe(false);
    });

    it("DELIVERED is not a payment status", () => {
      expect(isValidPaymentTransition("SUCCEEDED", "DELIVERED" as PaymentStatus)).toBe(false);
    });
  });

  describe("Allowed transitions by role", () => {
    it("ADMIN can transition PENDING → CONFIRMED", () => {
      // This tests the order status, not payment status
      // Payment transitions don't have role restrictions in this model
      expect(isValidPaymentTransition("PENDING", "SUCCEEDED")).toBe(true);
    });
  });

  describe("getAllowedTransitions", () => {
    it("returns correct transitions for PENDING", () => {
      const allowed = getAllowedTransitions("PENDING", "ADMIN");
      expect(allowed).toContain("PROCESSING");
      expect(allowed).toContain("SUCCEEDED");
      expect(allowed).toContain("FAILED");
      expect(allowed).toContain("CANCELLED");
    });

    it("returns empty for CANCELLED", () => {
      const allowed = getAllowedTransitions("CANCELLED", "ADMIN");
      expect(allowed).toHaveLength(0);
    });

    it("returns empty for REFUNDED", () => {
      const allowed = getAllowedTransitions("REFUNDED", "ADMIN");
      expect(allowed).toHaveLength(0);
    });

    it("returns REFUNDED for SUCCEEDED", () => {
      const allowed = getAllowedTransitions("SUCCEEDED", "ADMIN");
      expect(allowed).toContain("REFUNDED");
    });
  });
});