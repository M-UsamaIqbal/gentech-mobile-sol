import type { PaymentMethod } from "@/lib/constants";

/** What the caller hands the gateway to start a checkout. */
export interface CheckoutRequest {
  /** Our inspection request id — used as the merchant order reference. */
  requestId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  /** Absolute URL the gateway returns the buyer to after payment. */
  returnUrl: string;
}

/** Where to send the buyer to complete payment. */
export interface CheckoutSession {
  provider: string;
  /** Gateway/order reference we persist on the request. */
  reference: string;
  /** URL the buyer is redirected to (hosted gateway page, or our sandbox). */
  checkoutUrl: string;
}

export type PaymentOutcome = "PAID" | "FAILED";

/** Result of verifying a gateway callback/return. */
export interface VerifiedPayment {
  reference: string;
  status: PaymentOutcome;
}

/**
 * A payment gateway behind a stable interface. Swap the sandbox for a real
 * aggregator (PayFast/Safepay) without touching the service/UI. Every provider
 * covers JazzCash, Easypaisa and cards through the aggregator's hosted checkout.
 */
export interface PaymentProvider {
  readonly id: string;
  /** True when real credentials are present; false → sandbox/no-op. */
  isConfigured(): boolean;
  createCheckout(input: CheckoutRequest): Promise<CheckoutSession>;
  /** Verify a return/webhook payload and resolve the final status. */
  verify(params: Record<string, string>): Promise<VerifiedPayment>;
}
