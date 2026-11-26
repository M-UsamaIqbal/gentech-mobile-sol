/**
 * Centralized currency precision and formatting.
 *
 * Bahrain (BHD): 3 decimal places (fils)
 * Pakistan (PKR): 0 decimal places
 *
 * All financial calculations should use these utilities to prevent
 * floating-point precision errors.
 */

import { CURRENCY_BY_REGION } from "@/lib/region";
import type { CountryCode } from "@/lib/countries/types";

export interface CurrencyConfig {
  code: string;
  symbol: string;
  decimals: number;
  locale: string;
}

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  BHD: { code: "BHD", symbol: "BD", decimals: 3, locale: "en-BH" },
  PKR: { code: "PKR", symbol: "Rs.", decimals: 0, locale: "en-PK" },
};

/**
 * Get currency config by currency code.
 */
export function getCurrencyConfig(currency: string): CurrencyConfig {
  return CURRENCY_CONFIGS[currency] ?? { code: currency, symbol: currency, decimals: 2, locale: "en-US" };
}

/**
 * Get currency config by country code.
 */
export function getCurrencyConfigByCountry(country: CountryCode): CurrencyConfig {
  const currency = CURRENCY_BY_REGION[country === "BH" ? "BAHRAIN" : "PAKISTAN"];
  return getCurrencyConfig(currency);
}

/**
 * Get decimal places for a currency.
 */
export function getCurrencyDecimals(currency: string): number {
  return getCurrencyConfig(currency).decimals;
}

/**
 * Round an amount to the correct number of decimal places for a currency.
 * Uses integer-based rounding to avoid floating-point errors.
 */
export function roundCurrency(amount: number, currency: string): number {
  const decimals = getCurrencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor) / factor;
}

/**
 * Format an amount for display with correct currency symbol and decimals.
 */
export function formatCurrency(amount: number, currency: string): string {
  const config = getCurrencyConfig(currency);
  const rounded = roundCurrency(amount, currency);
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(rounded);
}

/**
 * Add two amounts (currency-safe).
 */
export function addAmounts(a: number, b: number, currency: string): number {
  return roundCurrency(a + b, currency);
}

/**
 * Subtract two amounts (currency-safe).
 */
export function subtractAmounts(a: number, b: number, currency: string): number {
  return roundCurrency(a - b, currency);
}

/**
 * Multiply amount by quantity (currency-safe).
 */
export function multiplyAmount(amount: number, quantity: number, currency: string): number {
  return roundCurrency(amount * quantity, currency);
}

/**
 * Calculate percentage (currency-safe).
 */
export function calculatePercentage(amount: number, rate: number, currency: string): number {
  return roundCurrency(amount * rate, currency);
}

/**
 * Convert a Prisma Decimal to a number safely.
 */
export function decimalToNumber(
  value: number | string | { toNumber(): number } | null | undefined,
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  return value.toNumber();
}

/**
 * Validate that an amount has the correct number of decimal places.
 */
export function validateCurrencyPrecision(amount: number, currency: string): boolean {
  const decimals = getCurrencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(amount * factor) / factor;
  return Math.abs(amount - rounded) < 1e-9;
}