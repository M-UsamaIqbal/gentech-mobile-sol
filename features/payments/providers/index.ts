import "server-only";

import type { PaymentProvider, PaymentProviderId } from "../types";
import { sandboxProvider } from "./sandbox.provider";

/**
 * Payment provider registry.
 * Maps provider IDs to their implementations.
 *
 * Country-specific providers:
 * - Bahrain (BH): BenefitPay, card providers
 * - Pakistan (PK): JazzCash, Easypaisa, card providers
 *
 * Sandbox provider is always available for development/testing.
 */

const providers: Map<PaymentProviderId, PaymentProvider> = new Map();

// Register sandbox provider (always available)
providers.set("sandbox", sandboxProvider);

/**
 * Get a payment provider by ID.
 */
export function getPaymentProvider(id: PaymentProviderId): PaymentProvider | null {
  return providers.get(id) ?? null;
}

/**
 * Get available payment providers for a country.
 */
export function getProvidersForCountry(country: "BH" | "PK"): PaymentProviderId[] {
  const result: PaymentProviderId[] = ["sandbox"]; // Sandbox always available

  // Country-specific providers will be added here when implemented
  // Bahrain: benefitpay, card providers
  // Pakistan: jazzcash, easypaisa, card providers

  return result;
}

/**
 * Get the default payment provider for a country.
 */
export function getDefaultProvider(country: "BH" | "PK"): PaymentProviderId {
  return "sandbox";
}

/**
 * Register a payment provider.
 * Used to add new providers without modifying core code.
 */
export function registerProvider(provider: PaymentProvider): void {
  providers.set(provider.id, provider);
}