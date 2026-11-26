import "server-only";

import type { PaymentProvider, PaymentInitParams, PaymentInitResult, PaymentVerifyParams, PaymentVerifyResult, PaymentRefundParams, PaymentRefundResult, WebhookPayload, WebhookResult } from "../types";

/**
 * Sandbox payment provider.
 * Simulates payment processing for development and testing.
 * Never charges real money.
 *
 * All sandbox transactions are clearly marked as simulated.
 */
export const sandboxProvider: PaymentProvider = {
  id: "sandbox",
  name: "Sandbox (Simulated)",
  supportedCountries: ["BH", "PK"],
  supportedCurrencies: ["BHD", "PKR"],

  async initialize(params: PaymentInitParams): Promise<PaymentInitResult> {
    // Simulate payment initialization
    const paymentId = `sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return {
      success: true,
      paymentId,
      // The service replaces this with a signed return token after persistence.
      redirectUrl: undefined,
      providerReference: paymentId,
    };
  },

  async verify(params: PaymentVerifyParams): Promise<PaymentVerifyResult> {
    // Simulate verification — always succeeds in sandbox, but echoes the
    // stored amount so the service can enforce provider-amount parity.
    return {
      success: true,
      status: "SUCCEEDED",
      providerTransactionId: params.providerReference,
      amount: params.expectedAmount,
      currency: params.expectedCurrency,
    };
  },

  async refund(params: PaymentRefundParams): Promise<PaymentRefundResult> {
    return {
      success: true,
      refundId: `refund_${Date.now()}`,
    };
  },

  async processWebhook(_payload: WebhookPayload): Promise<WebhookResult> {
    return {
      success: false,
      error: "Sandbox webhooks are not accepted; use the signed browser return token",
    };
  },

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    // Sandbox has no external webhook sender; signed browser returns are used.
    return false;
  },
};