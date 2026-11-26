/**
 * Country-specific tax calculation.
 *
 * Tax rates are configurable per country — never hardcoded.
 * Bahrain: 5% VAT (NBR)
 * Pakistan: Configurable (no standard VAT; provincial taxes vary)
 *
 * All tax calculations happen server-side.
 * Historical orders retain original tax calculations.
 */

import { getCountryConfig } from "@/lib/countries"
import type { CountryCode } from "@/lib/countries/types"

export interface TaxCalculation {
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  taxName: string
  currency: string
}

/**
 * Calculate tax for a given amount based on country.
 *
 * @param amount - The subtotal amount
 * @param country - The country code (BH or PK)
 * @returns Tax calculation breakdown
 */
export function calculateTax(amount: number, country: CountryCode): TaxCalculation {
  const config = getCountryConfig(country)
  const taxRate = config.taxConfig.vatRate
  const taxName = config.taxConfig.vatName
  const currency = config.defaultCurrency

  const taxAmount = Math.round(amount * taxRate * 1000) / 1000 // Round to 3 decimals for BHD
  const total = amount + taxAmount

  return {
    subtotal: amount,
    taxRate,
    taxAmount,
    total,
    taxName,
    currency,
  }
}

/**
 * Calculate tax for Bahrain (5% VAT).
 */
export function calculateBahrainVat(amount: number): TaxCalculation {
  return calculateTax(amount, "BH")
}

/**
 * Calculate tax for Pakistan (configurable, default 0%).
 */
export function calculatePakistanTax(amount: number): TaxCalculation {
  return calculateTax(amount, "PK")
}

/**
 * Format tax rate as percentage string.
 */
export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}