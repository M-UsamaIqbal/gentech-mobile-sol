import "server-only";

import { env } from "@/lib/env";
import { sandboxProvider } from "@/features/inspections/payments/sandbox.provider";
import { payfastProvider } from "@/features/inspections/payments/payfast.provider";
import type { PaymentProvider } from "@/features/inspections/payments/types";

let warnedAboutTestMode = false;

/**
 * Payment provider selection.
 *
 * - Real PayFast credentials always win (inspection payments then go to the provider).
 * - Outside production the built-in sandbox gateway is the default, so the whole
 *   JazzCash / Easypaisa / card flow is clickable without credentials.
 * - In production the app fails closed (no online payments) unless the deployment
 *   explicitly sets `PAYMENTS_TEST_MODE=true` for pre-launch testing.
 */
export function getPaymentProvider(): PaymentProvider | null {
  if (payfastProvider.isConfigured()) return payfastProvider;
  if (process.env.NODE_ENV !== "production") return sandboxProvider;

  if (env.PAYMENTS_TEST_MODE === "true") {
    if (!warnedAboutTestMode) {
      warnedAboutTestMode = true;
      console.warn(
        "[payments] PAYMENTS_TEST_MODE=true — inspection payments are simulated by the built-in sandbox gateway. Disable this before launch.",
      );
    }
    return sandboxProvider;
  }

  return null;
}

export type { CheckoutRequest, CheckoutSession, VerifiedPayment } from "./types";
