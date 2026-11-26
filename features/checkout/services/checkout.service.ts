import "server-only";

import { calculateTax } from "@/lib/tax";
import { calculateShipping } from "@/features/shipping/services/shipping.service";
import type { CountryCode } from "@/lib/countries/types";

export interface CheckoutSummary {
  subtotal: number;
  shipping: number;
  tax: number;
  taxRate: number;
  taxName: string;
  discount: number;
  total: number;
  currency: string;
  shippingMethod: string | null;
  shippingEstimatedDays: number | null;
  codAvailable: boolean;
}

/**
 * Calculate the complete checkout total server-side.
 * Never trust client-submitted amounts.
 */
export async function calculateCheckout(
  country: CountryCode,
  subtotal: number,
  shippingMethodId: string | null,
  zoneId?: string,
  discount: number = 0,
): Promise<CheckoutSummary> {
  const currency = country === "BH" ? "BHD" : "PKR";

  // Calculate shipping
  let shipping = 0;
  let shippingMethodName: string | null = null;
  let shippingEstimatedDays: number | null = null;
  let codAvailable = true;

  if (shippingMethodId) {
    const shippingResult = await calculateShipping(country, shippingMethodId, zoneId);
    if (shippingResult) {
      shipping = shippingResult.total;
      shippingMethodName = shippingResult.method.name;
      shippingEstimatedDays = shippingResult.estimatedDays;
      codAvailable = shippingResult.codAvailable;
    }
  }

  // Calculate tax on (subtotal + shipping - discount)
  const taxableAmount = Math.max(0, subtotal + shipping - discount);
  const taxResult = calculateTax(taxableAmount, country);

  const total = taxResult.total - discount;

  return {
    subtotal,
    shipping,
    tax: taxResult.taxAmount,
    taxRate: taxResult.taxRate,
    taxName: taxResult.taxName,
    discount,
    total: Math.max(0, total),
    currency,
    shippingMethod: shippingMethodName,
    shippingEstimatedDays,
    codAvailable,
  };
}