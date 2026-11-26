import { afterEach, describe, expect, it, vi } from "vitest";

const mockedEnv = vi.hoisted(() => ({
  env: { NODE_ENV: "test", BETTER_AUTH_SECRET: "unit-test-secret" } as Record<string, unknown>,
}));

vi.mock("@/lib/env", () => ({ env: mockedEnv.env }));

import {
  createPaymentCallbackToken,
  verifyPaymentCallbackToken,
} from "@/features/payments/services/payment-callback-token";
import { paymentAmountMatches, paymentCurrencyMatches } from "@/features/payments/services/payment-amount";
import {
  buildWebhookSignaturePayload,
  isFreshWebhookTimestamp,
} from "@/features/payments/services/payment-webhook-validation";
import { sandboxProvider } from "@/features/payments/providers/sandbox.provider";

const SECRET = "unit-test-secret";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("payment callback token", () => {
  const input = {
    paymentId: "pay_123",
    orderId: "ord_456",
    providerReference: "sandbox_ref_789",
  };

  it("round-trips a signed return token", () => {
    const token = createPaymentCallbackToken(input, SECRET);
    expect(verifyPaymentCallbackToken(token, SECRET)).toMatchObject(input);
  });

  it("rejects a tampered token", () => {
    const token = createPaymentCallbackToken(input, SECRET);
    const tampered = `${token.slice(0, -2)}xy`;
    expect(verifyPaymentCallbackToken(tampered, SECRET)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createPaymentCallbackToken(input, SECRET);
    expect(verifyPaymentCallbackToken(token, "other-secret")).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = createPaymentCallbackToken(input, SECRET);
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 16 * 60 * 1000);
    expect(verifyPaymentCallbackToken(token, SECRET)).toBeNull();
  });
});

describe("payment amount and currency parity", () => {
  it("uses three decimals for BHD", () => {
    expect(paymentAmountMatches(1.234, 1.234, "BHD")).toBe(true);
    expect(paymentAmountMatches(1.234, 1.235, "BHD")).toBe(false);
  });

  it("uses two decimals for PKR", () => {
    expect(paymentAmountMatches(100, 100.0, "PKR")).toBe(true);
    expect(paymentAmountMatches(100, 100.01, "PKR")).toBe(false);
  });

  it("rejects a missing provider amount", () => {
    expect(paymentAmountMatches(10, undefined, "BHD")).toBe(false);
  });

  it("compares currency case-insensitively", () => {
    expect(paymentCurrencyMatches("BHD", "bhd")).toBe(true);
    expect(paymentCurrencyMatches("BHD", "PKR")).toBe(false);
    expect(paymentCurrencyMatches("BHD", undefined)).toBe(false);
  });
});

describe("webhook validation", () => {
  const payload = {
    provider: "jazzcash" as const,
    event: "payment.completed",
    data: { paymentId: "pay_123" },
    timestamp: "2026-11-25T10:00:00.000Z",
  };

  it("builds a canonical signature payload independent of key order", () => {
    expect(buildWebhookSignaturePayload(payload)).toBe(
      '{"provider":"jazzcash","event":"payment.completed","data":{"paymentId":"pay_123"},"timestamp":"2026-11-25T10:00:00.000Z"}',
    );
  });

  it("accepts fresh timestamps and rejects stale or missing ones", () => {
    const now = Date.parse(payload.timestamp);
    expect(isFreshWebhookTimestamp(payload.timestamp, now)).toBe(true);
    expect(isFreshWebhookTimestamp(payload.timestamp, now + 6 * 60 * 1000)).toBe(false);
    expect(isFreshWebhookTimestamp(undefined, now)).toBe(false);
    expect(isFreshWebhookTimestamp("not-a-date", now)).toBe(false);
  });
});

describe("sandbox provider hardening", () => {
  it("echoes the recorded amount so the service can enforce parity", async () => {
    const result = await sandboxProvider.verify({
      paymentId: "pay_123",
      providerReference: "sandbox_ref_789",
      expectedAmount: 12.345,
      expectedCurrency: "BHD",
    });
    expect(result).toMatchObject({ success: true, amount: 12.345, currency: "BHD" });
  });

  it("does not accept unsigned sandbox webhooks", async () => {
    expect(sandboxProvider.verifyWebhookSignature("{}", "anything")).toBe(false);
    await expect(
      sandboxProvider.processWebhook({
        provider: "sandbox",
        event: "payment.completed",
        data: { paymentId: "pay_123" },
      }),
    ).resolves.toMatchObject({ success: false });
  });
});
