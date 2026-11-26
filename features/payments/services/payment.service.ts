import "server-only";

import { prisma } from "@/lib/prisma";
import { getPaymentProvider, getDefaultProvider, getProvidersForCountry } from "../providers";
import { createPayment, findPaymentById, updatePaymentStatus, findPaymentByIdempotencyKey } from "../repositories/payment.repository";
import { atomicTransitionPayment } from "./payment-state.service";
import { createPaymentCallbackToken } from "./payment-callback-token";
import { paymentAmountMatches, paymentCurrencyMatches } from "./payment-amount";
import { buildWebhookSignaturePayload, isFreshWebhookTimestamp } from "./payment-webhook-validation";
import type { PaymentProviderId, PaymentStatus, PaymentVerifyResult, WebhookPayload } from "../types";

export interface InitiatePaymentInput {
  orderId: string;
  providerId?: PaymentProviderId;
  idempotencyKey?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  clientSecret?: string;
  /** Signed short-lived token for the simulated browser return path. */
  callbackToken?: string;
  error?: string;
}

/**
 * Initiate a payment for an order.
 * Creates a payment record and initializes with the provider.
 */
export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
  try {
    // 1. Get order details
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        customerId: true,
        region: true,
        currency: true,
        total: true,
        paymentStatus: true,
        customer: { select: { email: true, name: true } },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // 2. Check if already paid
    if (order.paymentStatus === "PAID") {
      return { success: false, error: "Order already paid" };
    }

    // 3. Determine country code
    const country = order.region === "BAHRAIN" ? "BH" : "PK";

    // 4. Check idempotency
    if (input.idempotencyKey) {
      const existing = await findPaymentByIdempotencyKey(input.idempotencyKey);
      if (existing) {
        return {
          success: true,
          paymentId: existing.id,
          redirectUrl: undefined,
        };
      }
    }

    // 5. Get provider
    const providerId = input.providerId ?? getDefaultProvider(country);
    const provider = getPaymentProvider(providerId);
    if (!provider) {
      return { success: false, error: "Payment provider not available" };
    }

    // 6. Verify provider supports country
    if (!provider.supportedCountries.includes(country)) {
      return { success: false, error: `Provider does not support ${country}` };
    }

    // 7. Verify currency
    if (!provider.supportedCurrencies.includes(order.currency)) {
      return { success: false, error: `Provider does not support ${order.currency}` };
    }

    // 8. Create payment record
    const payment = await createPayment({
      orderId: order.id,
      provider: provider.id,
      country,
      currency: order.currency,
      amount: Number(order.total),
      idempotencyKey: input.idempotencyKey,
    });

    if (!payment) {
      return { success: false, error: "Failed to create payment record" };
    }

    // 9. Initialize with provider
    const result = await provider.initialize({
      orderId: order.id,
      amount: Number(order.total),
      currency: order.currency,
      country,
      customerEmail: order.customer.email,
      customerName: order.customer.name,
      callbackUrl: `${process.env.APP_URL || "http://localhost:3000"}/api/payments/callback`,
    });

    if (!result.success) {
      await updatePaymentStatus(payment.id, "FAILED", {
        failureReason: result.error,
      });
      return { success: false, error: result.error };
    }

    // 10. Persist the provider reference before issuing any return token.
    const providerReference = result.providerReference ?? "";
    if (providerReference) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerReference },
      });
    }

    const callbackToken = providerReference
      ? createPaymentCallbackToken({ paymentId: payment.id, orderId: order.id, providerReference })
      : undefined;
    const redirectUrl =
      provider.id === "sandbox" && callbackToken
        ? `/api/payments/sandbox/callback?token=${encodeURIComponent(callbackToken)}`
        : result.redirectUrl;

    return {
      success: true,
      paymentId: payment.id,
      redirectUrl,
      clientSecret: result.clientSecret,
      callbackToken,
    };
  } catch (error) {
    console.error("[payment] Initiation failed:", error);
    return { success: false, error: "Payment initiation failed" };
  }
}

/**
 * Verify a payment after customer returns from provider.
 */
export async function verifyPayment(paymentId: string, providerReference: string): Promise<PaymentVerifyResult> {
  if (!paymentId || !providerReference) {
    return { success: false, status: "FAILED", error: "Payment and provider reference are required" };
  }

  try {
    const payment = await findPaymentById(paymentId);
    if (!payment) {
      return { success: false, status: "FAILED", error: "Payment not found" };
    }

    // Already verified — safe idempotent replay.
    if (payment.status === "SUCCEEDED") {
      return { success: true, status: "SUCCEEDED", providerTransactionId: payment.providerTransactionId ?? undefined };
    }

    // The reference is issued by this server at initiation; never trust a
    // caller-supplied reference that does not match the stored value.
    if (payment.providerReference && payment.providerReference !== providerReference) {
      return { success: false, status: "FAILED", error: "Provider reference mismatch" };
    }

    if (payment.status !== "PENDING" && payment.status !== "PROCESSING") {
      return { success: false, status: "FAILED", error: `Payment cannot be verified from ${payment.status} state` };
    }

    const provider = getPaymentProvider(payment.provider as PaymentProviderId);
    if (!provider) {
      return { success: false, status: "FAILED", error: "Provider not found" };
    }

    const result = await provider.verify({
      paymentId,
      providerReference,
      expectedAmount: payment.amount,
      expectedCurrency: payment.currency,
    });

    if (!paymentCurrencyMatches(payment.currency, result.currency) || !paymentAmountMatches(payment.amount, result.amount, payment.currency)) {
      const failureReason = "Provider amount or currency did not match the payment record";
      await atomicTransitionPayment(paymentId, payment.status, "FAILED", { failureReason });
      return { ...result, success: false, status: "FAILED", error: failureReason };
    }

    if (result.success && result.status === "SUCCEEDED") {
      const transition = await atomicTransitionPayment(paymentId, payment.status, "SUCCEEDED", {
        providerTransactionId: result.providerTransactionId,
        verifiedAt: new Date(),
      });
      if (!transition.success) {
        return { success: false, status: "FAILED", error: transition.error ?? "Verification failed" };
      }
      return result;
    }

    const target: PaymentStatus = result.status === "CANCELLED" ? "CANCELLED" : "FAILED";
    const transition = await atomicTransitionPayment(paymentId, payment.status, target, {
      failureReason: result.error,
    });
    if (!transition.success) {
      return { success: false, status: "FAILED", error: transition.error ?? "Verification failed" };
    }
    return result;
  } catch (error) {
    console.error("[payment] Verification failed:", error);
    return { success: false, status: "FAILED", error: "Verification failed" };
  }
}

/**
 * Process a webhook from a payment provider.
 */
export async function processWebhook(payload: WebhookPayload): Promise<{ success: boolean; error?: string }> {
  if (!payload.signature) {
    return { success: false, error: "Webhook signature is required" };
  }
  if (payload.provider === "sandbox") {
    return { success: false, error: "Sandbox webhooks are not accepted" };
  }
  if (!isFreshWebhookTimestamp(payload.timestamp)) {
    return { success: false, error: "Webhook timestamp is missing or stale" };
  }

  try {
    const provider = getPaymentProvider(payload.provider);
    if (!provider) {
      return { success: false, error: "Unknown provider" };
    }

    const { signature: _signature, ...unsignedPayload } = payload;
    const signaturePayload = buildWebhookSignaturePayload(unsignedPayload);
    if (!provider.verifyWebhookSignature(signaturePayload, payload.signature)) {
      return { success: false, error: "Invalid signature" };
    }

    const result = await provider.processWebhook(payload);
    if (!result.success || !result.paymentId) {
      return { success: false, error: result.error ?? "Webhook was rejected by the provider" };
    }

    const target = result.newStatus;
    if (!target) {
      return { success: false, error: "Webhook did not include a payment status" };
    }

    const payment = await findPaymentById(result.paymentId);
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    if (result.amount !== undefined && !paymentAmountMatches(payment.amount, result.amount, payment.currency)) {
      return { success: false, error: "Webhook amount did not match the payment record" };
    }
    if (result.currency !== undefined && !paymentCurrencyMatches(payment.currency, result.currency)) {
      return { success: false, error: "Webhook currency did not match the payment record" };
    }

    // Idempotent replay: same target status is a successful no-op.
    if (payment.status === target) {
      return { success: true };
    }

    const transition = await atomicTransitionPayment(result.paymentId, payment.status, target);
    if (!transition.success) {
      if (transition.error?.includes("already in")) {
        return { success: true };
      }
      return { success: false, error: transition.error ?? "Payment transition failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("[payment] Webhook processing failed:", error);
    return { success: false, error: "Webhook processing failed" };
  }
}

/**
 * Get available payment providers for a country.
 */
export function getAvailableProviders(country: "BH" | "PK"): string[] {
  return getProvidersForCountry(country);
}