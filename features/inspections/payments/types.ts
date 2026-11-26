import type { PaymentMethod } from "@/lib/constants";

/** Provider-neutral details for gateways that support a checkout session. */
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

export type PaymentVerificationStatus = "PAID" | "FAILED" | "PENDING";

export type PayFastPaymentDetails =
  | {
      method: "card";
      mobileNumber: string;
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
    }
  | {
      method: "jazzcash" | "easypaisa";
      mobileNumber: string;
      accountNumber: string;
      cnicNumber: string;
      accountTitle?: string;
    };

export interface PayFastChallenge {
  continuation: string;
  transactionId: string;
  otpRequired: boolean;
  threeDsHtml?: string;
  threeDsNonce?: string;
}

/** Common interface for provider flows that support checkout-session verification. */
export interface PaymentProvider {
  readonly id: string;
  /** True when real credentials are present; false → sandbox/no-op. */
  isConfigured(): boolean;
  createCheckout(input: CheckoutRequest): Promise<CheckoutSession>;
  /** Verify a provider return payload and resolve the final status. */
  verify(params: Record<string, string>): Promise<VerifiedPayment>;
}
