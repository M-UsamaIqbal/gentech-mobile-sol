import "server-only";

import { sandboxProvider } from "@/features/inspections/payments/sandbox.provider";
import { payfastProvider } from "@/features/inspections/payments/payfast.provider";
import type { PaymentProvider } from "@/features/inspections/payments/types";

/**
 * Resolves the active payment gateway: the real aggregator when it's configured,
 * otherwise the built-in sandbox so the flow stays testable in development.
 */
export function getPaymentProvider(): PaymentProvider {
  return payfastProvider.isConfigured() ? payfastProvider : sandboxProvider;
}

export type { CheckoutRequest, CheckoutSession, VerifiedPayment } from "./types";
