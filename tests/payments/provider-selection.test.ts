import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedEnv = vi.hoisted(() => ({
  env: {} as Record<string, unknown>,
}));

vi.mock("@/lib/env", () => ({ env: mockedEnv.env }));

const unconfiguredPayFast = {
  NODE_ENV: "test",
  BETTER_AUTH_SECRET: "test-continuation-secret",
  PAYMENTS_TEST_MODE: "false",
  PAYFAST_MODE: "disabled",
  PAYFAST_LIVE_ENABLED: "false",
  PAYFAST_MERCHANT_ID: undefined,
  PAYFAST_SECURED_KEY: undefined,
  PAYFAST_API_BASE: undefined,
  PAYFAST_MERCHANT_CATEGORY_CODE: undefined,
  PAYFAST_CARD_ACCOUNT_TYPE: undefined,
  PAYFAST_JAZZCASH_BANK_CODE: undefined,
  PAYFAST_JAZZCASH_ACCOUNT_TYPE: undefined,
  PAYFAST_EASYPAISA_BANK_CODE: undefined,
  PAYFAST_EASYPAISA_ACCOUNT_TYPE: undefined,
};

const configuredPayFast = {
  ...unconfiguredPayFast,
  PAYFAST_MODE: "sandbox",
  PAYFAST_MERCHANT_ID: "test-merchant",
  PAYFAST_SECURED_KEY: "test-secured-key",
  PAYFAST_API_BASE: "https://sandbox.payfast.test",
  PAYFAST_MERCHANT_CATEGORY_CODE: "test-category",
  PAYFAST_CARD_ACCOUNT_TYPE: "test-card-account",
  PAYFAST_JAZZCASH_BANK_CODE: "test-jazzcash-bank",
  PAYFAST_JAZZCASH_ACCOUNT_TYPE: "test-jazzcash-account",
  PAYFAST_EASYPAISA_BANK_CODE: "test-easypaisa-bank",
  PAYFAST_EASYPAISA_ACCOUNT_TYPE: "test-easypaisa-account",
};

async function getPaymentProvider() {
  const payments = await import("@/features/inspections/payments");
  return payments.getPaymentProvider();
}

describe("payment provider selection", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    for (const key of Object.keys(mockedEnv.env)) delete mockedEnv.env[key];
    Object.assign(mockedEnv.env, unconfiguredPayFast);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("uses the built-in sandbox outside production when PayFast is not configured", async () => {
    expect((await getPaymentProvider())?.id).toBe("sandbox");
  });

  it("fails closed in production when PayFast is not configured and test mode is off", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(await getPaymentProvider()).toBeNull();
  });

  it("allows the simulated gateway in production only when PAYMENTS_TEST_MODE=true", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mockedEnv.env.PAYMENTS_TEST_MODE = "true";
    expect((await getPaymentProvider())?.id).toBe("sandbox");
  });

  it("prefers real PayFast credentials over the simulated gateway", async () => {
    vi.stubEnv("NODE_ENV", "production");
    Object.assign(mockedEnv.env, configuredPayFast);
    mockedEnv.env.PAYMENTS_TEST_MODE = "true";
    expect((await getPaymentProvider())?.id).toBe("payfast");
  });

  it("keeps JazzCash, Easypaisa, and card checkout available in sandbox mode", async () => {
    const provider = await getPaymentProvider();
    expect(provider?.id).toBe("sandbox");
    if (!provider) throw new Error("Sandbox provider missing");

    for (const method of ["jazzcash", "easypaisa", "card"] as const) {
      const session = await provider.createCheckout({
        requestId: "request-1",
        amount: 2500,
        currency: "PKR",
        method,
        returnUrl: "https://gentech.example/return",
      });
      expect(session.provider).toBe("sandbox");
      expect(session.checkoutUrl).toContain(`method=${method}`);
    }
  });
});
