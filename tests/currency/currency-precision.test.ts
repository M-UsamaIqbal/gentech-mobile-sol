import { describe, it, expect, vi } from "vitest";

const mockedEnv = vi.hoisted(() => ({
  env: { NODE_ENV: "test" } as Record<string, unknown>,
}));

vi.mock("@/lib/env", () => ({ env: mockedEnv.env }));

import {
  roundCurrency,
  formatCurrency,
  addAmounts,
  subtractAmounts,
  multiplyAmount,
  calculatePercentage,
  validateCurrencyPrecision,
  getCurrencyDecimals,
} from "@/lib/currency";

describe("Currency Precision", () => {
  describe("BHD (3 decimal places)", () => {
    it("rounds to 3 decimal places", () => {
      expect(roundCurrency(10.1234, "BHD")).toBe(10.123);
      expect(roundCurrency(10.1235, "BHD")).toBe(10.124);
      expect(roundCurrency(10.1236, "BHD")).toBe(10.124);
    });

    it("handles BHD values like 10.125", () => {
      expect(roundCurrency(10.125, "BHD")).toBe(10.125);
      expect(validateCurrencyPrecision(10.125, "BHD")).toBe(true);
    });

    it("handles BHD values like 99.999", () => {
      expect(roundCurrency(99.999, "BHD")).toBe(99.999);
      expect(validateCurrencyPrecision(99.999, "BHD")).toBe(true);
    });

    it("formats BHD correctly", () => {
      const formatted = formatCurrency(10.125, "BHD");
      expect(formatted).toContain("10.125");
    });

    it("adds BHD amounts safely", () => {
      expect(addAmounts(10.125, 20.375, "BHD")).toBe(30.5);
    });

    it("subtracts BHD amounts safely", () => {
      expect(subtractAmounts(30.5, 10.125, "BHD")).toBe(20.375);
    });

    it("multiplies BHD amounts safely", () => {
      expect(multiplyAmount(10.125, 3, "BHD")).toBe(30.375);
    });

    it("calculates percentage for BHD", () => {
      const tax = calculatePercentage(100, 0.05, "BHD");
      expect(tax).toBe(5);
    });

    it("has 3 decimal places", () => {
      expect(getCurrencyDecimals("BHD")).toBe(3);
    });
  });

  describe("PKR (0 decimal places)", () => {
    it("rounds to 0 decimal places", () => {
      expect(roundCurrency(1000.4, "PKR")).toBe(1000);
      expect(roundCurrency(1000.6, "PKR")).toBe(1001);
    });

    it("handles PKR values like 1000", () => {
      expect(roundCurrency(1000, "PKR")).toBe(1000);
      expect(validateCurrencyPrecision(1000, "PKR")).toBe(true);
    });

    it("handles PKR values like 250000", () => {
      expect(roundCurrency(250000, "PKR")).toBe(250000);
      expect(validateCurrencyPrecision(250000, "PKR")).toBe(true);
    });

    it("formats PKR correctly", () => {
      const formatted = formatCurrency(1000, "PKR");
      expect(formatted).toContain("1,000");
    });

    it("adds PKR amounts safely", () => {
      expect(addAmounts(1000, 2500, "PKR")).toBe(3500);
    });

    it("subtracts PKR amounts safely", () => {
      expect(subtractAmounts(3500, 1000, "PKR")).toBe(2500);
    });

    it("multiplies PKR amounts safely", () => {
      expect(multiplyAmount(1000, 3, "PKR")).toBe(3000);
    });

    it("calculates percentage for PKR", () => {
      const tax = calculatePercentage(1000, 0.1, "PKR");
      expect(tax).toBe(100);
    });

    it("has 0 decimal places", () => {
      expect(getCurrencyDecimals("PKR")).toBe(0);
    });
  });

  describe("Tax calculations", () => {
    it("calculates Bahrain VAT (5%) correctly", () => {
      const tax = calculatePercentage(100, 0.05, "BHD");
      expect(tax).toBe(5);
    });

    it("calculates Pakistan tax (0%) correctly", () => {
      const tax = calculatePercentage(1000, 0, "PKR");
      expect(tax).toBe(0);
    });
  });

  describe("Shipping calculations", () => {
    it("adds shipping to subtotal for BHD", () => {
      const total = addAmounts(10.125, 2.5, "BHD");
      expect(total).toBe(12.625);
    });

    it("adds shipping to subtotal for PKR", () => {
      const total = addAmounts(1000, 200, "PKR");
      expect(total).toBe(1200);
    });
  });

  describe("Refund calculations", () => {
    it("calculates partial refund for BHD", () => {
      const refund = subtractAmounts(10.125, 3.5, "BHD");
      expect(refund).toBe(6.625);
    });

    it("calculates partial refund for PKR", () => {
      const refund = subtractAmounts(1000, 300, "PKR");
      expect(refund).toBe(700);
    });
  });

  describe("Order totals", () => {
    it("calculates BHD order total (subtotal + shipping + tax)", () => {
      const subtotal = 10.125;
      const shipping = 2.5;
      const tax = calculatePercentage(subtotal + shipping, 0.05, "BHD");
      const total = addAmounts(addAmounts(subtotal, shipping, "BHD"), tax, "BHD");
      expect(total).toBe(13.256); // 10.125 + 2.5 + 0.631 (5% of 12.625)
    });

    it("calculates PKR order total (subtotal + shipping + tax)", () => {
      const subtotal = 1000;
      const shipping = 200;
      const tax = calculatePercentage(subtotal + shipping, 0, "PKR");
      const total = addAmounts(addAmounts(subtotal, shipping, "PKR"), tax, "PKR");
      expect(total).toBe(1200);
    });
  });

  describe("Validation", () => {
    it("validates BHD precision", () => {
      expect(validateCurrencyPrecision(10.125, "BHD")).toBe(true);
      expect(validateCurrencyPrecision(10.1234, "BHD")).toBe(false);
    });

    it("validates PKR precision", () => {
      expect(validateCurrencyPrecision(1000, "PKR")).toBe(true);
      expect(validateCurrencyPrecision(1000.5, "PKR")).toBe(false);
    });
  });
});