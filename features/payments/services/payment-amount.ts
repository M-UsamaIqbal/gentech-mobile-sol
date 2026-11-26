import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";

/** BHD uses 3 fils; PKR uses 2 rupees. Unknown currencies keep 3 places. */
const CURRENCY_SCALE: Record<string, number> = { BHD: 3, PKR: 2 };

function normalize(amount: number, currency: string): string {
  const scale = CURRENCY_SCALE[currency] ?? 3;
  return new Prisma.Decimal(amount).toDecimalPlaces(scale).toFixed(scale);
}

/** Providers must report an amount; a missing or mismatched value is a failure. */
export function paymentAmountMatches(
  expectedAmount: number,
  reportedAmount: number | undefined,
  currency: string,
): boolean {
  if (reportedAmount === undefined || !Number.isFinite(reportedAmount)) return false;
  return normalize(expectedAmount, currency) === normalize(reportedAmount, currency);
}

export function paymentCurrencyMatches(expectedCurrency: string, reportedCurrency: string | undefined): boolean {
  if (reportedCurrency === undefined) return false;
  return expectedCurrency.toUpperCase() === reportedCurrency.toUpperCase();
}
