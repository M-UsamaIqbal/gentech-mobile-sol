import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockedEnv = vi.hoisted(() => ({
  env: {
    BETTER_AUTH_SECRET: "test-continuation-secret",
    PAYFAST_API_BASE: "https://sandbox.payfast.test",
    PAYFAST_CARD_ACCOUNT_TYPE: "test-card-account",
    PAYFAST_EASYPAISA_ACCOUNT_TYPE: "test-easypaisa-account",
    PAYFAST_EASYPAISA_BANK_CODE: "test-easypaisa-bank",
    PAYFAST_JAZZCASH_ACCOUNT_TYPE: "test-jazzcash-account",
    PAYFAST_JAZZCASH_BANK_CODE: "test-jazzcash-bank",
    PAYFAST_LIVE_ENABLED: "false",
    PAYFAST_MERCHANT_CATEGORY_CODE: "test-category",
    PAYFAST_MERCHANT_ID: "test-merchant",
    PAYFAST_MODE: "sandbox",
    PAYFAST_SECURED_KEY: "test-secured-key",
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: mockedEnv.env }));

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function mockFetch(...responses: Record<string, unknown>[]) {
  const queue = [...responses];
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
    void _input;
    void _init;
    const next = queue.shift();
    if (!next) throw new Error("Unexpected provider request");
    return jsonResponse(next);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const cardDetails = {
  method: "card" as const,
  mobileNumber: "03001234567",
  cardNumber: "1234567890123456",
  expiryMonth: "12",
  expiryYear: "2030",
  cvv: "123",
};

const beginInput = {
  userId: "user-1",
  requestId: "request-1",
  basketId: "request-1",
  amount: "2500.00",
  currency: "PKR",
  customerIp: "203.0.113.10",
  details: cardDetails,
  callbackUrl: "https://gentech.example/api/payments/payfast/3ds/callback?nonce=test-nonce",
};

describe("PayFast direct API provider", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("encrypts continuation state and binds it to the request, user, amount, and currency", async () => {
    const fetchMock = mockFetch(
      { token: "access-token" },
      {
        transaction_id: "transaction-1",
        instrument_token: "temporary-instrument-token",
        otp_required: true,
      },
    );
    const provider = await import("@/features/inspections/payments/payfast.provider");
    const challenge = await provider.beginPayFastPayment(beginInput);

    expect(challenge.otpRequired).toBe(true);
    expect(challenge.continuation).not.toContain("temporary-instrument-token");
    expect(challenge.continuation).not.toContain(cardDetails.cardNumber);
    expect(challenge.continuation).not.toContain(cardDetails.cvv);
    const tokenRequestHeaders = fetchMock.mock.calls[1]?.[1]?.headers;
    expect(tokenRequestHeaders instanceof Headers ? tokenRequestHeaders.get("authorization") : null)
      .toBe("Bearer access-token");

    const binding = {
      continuation: challenge.continuation,
      userId: "user-1",
      requestId: "request-1",
      expectedTransactionId: "transaction-1",
      expectedAmount: "2500.00",
      expectedCurrency: "PKR",
    };
    expect(() => provider.assertPayFastContinuation(binding)).not.toThrow();
    expect(() =>
      provider.assertPayFastContinuation({ ...binding, userId: "another-user" }),
    ).toThrowError(provider.PayFastError);
    expect(() =>
      provider.assertPayFastContinuation({ ...binding, expectedAmount: "2500.01" }),
    ).toThrowError(provider.PayFastError);

    const parts = challenge.continuation.split(".");
    const ciphertext = parts[2];
    expect(ciphertext).toBeDefined();
    if (!ciphertext) throw new Error("Missing encrypted continuation payload");
    parts[2] = `${ciphertext[0] === "A" ? "B" : "A"}${ciphertext.slice(1)}`;
    expect(() =>
      provider.assertPayFastContinuation({ ...binding, continuation: parts.join(".") }),
    ).toThrowError(provider.PayFastError);
  });

  it("submits only the temporary instrument token and verifies the provider references", async () => {
    const fetchMock = mockFetch(
      { token: "access-token-1" },
      {
        transaction_id: "transaction-1",
        instrument_token: "temporary-instrument-token",
        otp_required: true,
      },
      { token: "access-token-2" },
      { transaction_id: "transaction-1", basket_id: "request-1", status_code: "00" },
      { token: "access-token-3" },
      { transaction_id: "transaction-1", basket_id: "request-1", status_code: "00" },
    );
    const provider = await import("@/features/inspections/payments/payfast.provider");
    const challenge = await provider.beginPayFastPayment(beginInput);
    const result = await provider.completePayFastPayment({
      continuation: challenge.continuation,
      userId: "user-1",
      requestId: "request-1",
      expectedTransactionId: "transaction-1",
      expectedAmount: "2500.00",
      expectedCurrency: "PKR",
      customerIp: "203.0.113.10",
      otp: "1234",
    });

    expect(result.status).toBe("PAID");
    const tokenizedRequest = fetchMock.mock.calls[3]?.[1];
    expect(tokenizedRequest?.body).toBeInstanceOf(URLSearchParams);
    const tokenizedBody =
      tokenizedRequest?.body instanceof URLSearchParams ? tokenizedRequest.body : null;
    expect(tokenizedBody).not.toBeNull();
    expect(tokenizedBody?.get("instrument_token")).toBe("temporary-instrument-token");
    expect(tokenizedBody?.get("otp")).toBe("1234");
    expect(tokenizedBody?.get("card_number")).toBeNull();
    expect(tokenizedBody?.get("cvv")).toBeNull();
  });

  it.each([
    ["00", "PAID"],
    ["79", "PAID"],
    ["001", "PENDING"],
    ["002", "PENDING"],
    ["05", "FAILED"],
  ] as const)("maps PayFast status %s to %s", async (code, expectedStatus) => {
    mockFetch({ token: "access-token" }, {
      transaction_id: "transaction-1",
      basket_id: "request-1",
      status_code: code,
    });
    const provider = await import("@/features/inspections/payments/payfast.provider");

    const result = await provider.getPayFastPaymentStatus({
      transactionId: "transaction-1",
      basketId: "request-1",
      customerIp: "203.0.113.10",
    });

    expect(result.status).toBe(expectedStatus);
  });

  it("rejects provider status responses for a different transaction or basket", async () => {
    mockFetch(
      { token: "access-token" },
      {
        transaction_id: "another-transaction",
        basket_id: "request-1",
        status_code: "00",
      },
    );
    const provider = await import("@/features/inspections/payments/payfast.provider");

    await expect(
      provider.getPayFastPaymentStatus({
        transactionId: "transaction-1",
        basketId: "request-1",
        customerIp: "203.0.113.10",
      }),
    ).rejects.toThrowError(provider.PayFastError);
  });

  it("rejects non-positive decimal amounts before making provider requests", async () => {
    const fetchMock = mockFetch();
    const provider = await import("@/features/inspections/payments/payfast.provider");

    await expect(
      provider.beginPayFastPayment({ ...beginInput, amount: "0.00" }),
    ).rejects.toThrowError(provider.PayFastError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
