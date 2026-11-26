/**
 * Payment types and interfaces for multi-country payment architecture.
 *
 * One shared payment system with country-specific providers.
 * Bahrain: BenefitPay + card providers
 * Pakistan: JazzCash, Easypaisa + card providers
 */

export type PaymentProviderId = "benefitpay" | "jazzcash" | "easypaisa" | "sandbox";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMethod = "card" | "bank_transfer" | "wallet" | "cod";

export interface PaymentInitParams {
  orderId: string;
  amount: number;
  currency: string;
  country: "BH" | "PK";
  customerEmail: string;
  customerName: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentInitResult {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  clientSecret?: string;
  providerReference?: string;
  error?: string;
}

export interface PaymentVerifyParams {
  paymentId: string;
  providerReference: string;
  /** Value recorded on the payment before the provider was called. */
  expectedAmount: number;
  /** Currency recorded on the payment before the provider was called. */
  expectedCurrency: string;
  signature?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  status: PaymentStatus;
  providerTransactionId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface PaymentRefundParams {
  paymentId: string;
  amount?: number; // Partial refund if specified
  reason?: string;
}

export interface PaymentRefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface WebhookPayload {
  provider: PaymentProviderId;
  event: string;
  data: Record<string, unknown>;
  signature?: string;
  timestamp?: string;
}

export interface WebhookResult {
  success: boolean;
  paymentId?: string;
  newStatus?: PaymentStatus;
  amount?: number;
  currency?: string;
  error?: string;
}

/**
 * Common payment provider interface.
 * All providers must implement this interface.
 */
export interface PaymentProvider {
  readonly id: PaymentProviderId;
  readonly name: string;
  readonly supportedCountries: ("BH" | "PK")[];
  readonly supportedCurrencies: string[];

  /**
   * Initialize a payment with the provider.
   * Returns redirect URL or client secret for frontend.
   */
  initialize(params: PaymentInitParams): Promise<PaymentInitResult>;

  /**
   * Verify a payment after customer returns from provider.
   */
  verify(params: PaymentVerifyParams): Promise<PaymentVerifyResult>;

  /**
   * Process a refund.
   */
  refund(params: PaymentRefundParams): Promise<PaymentRefundResult>;

  /**
   * Process a webhook/callback from the provider.
   */
  processWebhook(payload: WebhookPayload): Promise<WebhookResult>;

  /**
   * Verify webhook signature.
   */
  verifyWebhookSignature(payload: string, signature: string): boolean;
}