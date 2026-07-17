import "server-only";

import { env } from "@/lib/env";
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  VerifiedPayment,
} from "@/features/inspections/payments/types";

/**
 * Real aggregator (PayFast Pakistan) provider — covers JazzCash, Easypaisa and
 * cards through one hosted checkout. Left as a documented scaffold: it activates
 * only when PAYFAST_* env vars are set, otherwise the app falls back to sandbox.
 *
 * To finish the integration:
 *  1. Obtain a PayFast merchant account (MERCHANT_ID + SECURED_KEY).
 *  2. In `createCheckout`, call PayFast's "get access token" endpoint, then build
 *     the hosted-checkout redirect URL with the token, amount, order id (=requestId)
 *     and the chosen method, returning it as `checkoutUrl`.
 *  3. In `verify`, validate the returned signature/hash and map PayFast's
 *     `err_code`/status to PAID | FAILED.
 */
export const payfastProvider: PaymentProvider = {
  id: "payfast",

  isConfigured() {
    return Boolean(env.PAYFAST_MERCHANT_ID && env.PAYFAST_SECURED_KEY);
  },

  async createCheckout(input: CheckoutRequest): Promise<CheckoutSession> {
    void input;
    throw new Error(
      "PayFast provider not implemented yet. Set PAYFAST_* env vars and complete " +
        "createCheckout, or unset them to use the sandbox provider.",
    );
  },

  async verify(params: Record<string, string>): Promise<VerifiedPayment> {
    void params;
    throw new Error("PayFast provider not implemented yet.");
  },
};
