import { ROUTES } from "@/lib/constants";
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  VerifiedPayment,
} from "@/features/inspections/payments/types";

/**
 * Built-in SANDBOX gateway used when no real aggregator credentials are set.
 * `createCheckout` points the buyer at an internal mock checkout page
 * (`/inspection/pay/[id]`) that lets them pick a method and simulate success or
 * failure — the whole flow is clickable without charging anything real.
 */
export const sandboxProvider: PaymentProvider = {
  id: "sandbox",

  isConfigured() {
    return true; // always available as the fallback
  },

  async createCheckout(input: CheckoutRequest): Promise<CheckoutSession> {
    return {
      provider: "sandbox",
      reference: `SANDBOX-${input.requestId}`,
      checkoutUrl: `${ROUTES.inspectionService}/pay/${input.requestId}?method=${input.method}`,
    };
  },

  async verify(params: Record<string, string>): Promise<VerifiedPayment> {
    // The sandbox checkout posts back the intended outcome directly.
    return {
      reference: params.reference ?? "",
      status: params.outcome === "FAILED" ? "FAILED" : "PAID",
    };
  },
};
