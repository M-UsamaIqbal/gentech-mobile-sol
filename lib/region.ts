/**
 * Region isolation for multi-tenant data separation (Bahrain / Pakistan).
 *
 * Features:
 * - Each user is assigned a Region (BAHRAIN | PAKISTAN)
 * - All list queries auto-filter by the current user's region
 * - Region is stored in user profile and persisted in session
 * - Safe no-ops when region is not set (backward compatible)
 * - Follows same patterns as lib/monitoring.ts, lib/otp.ts
 */

import { cache } from "react"

import { prisma } from "@/lib/prisma"
import type { Region as PrismaRegion } from "@/lib/generated/prisma/enums"

// ---------------------------------------------------------------------------
// Region type
// ---------------------------------------------------------------------------

/** Region enumeration — determines data isolation boundary. */
export type Region = PrismaRegion

/** Default region when none is set (for backward compatibility). */
export const DEFAULT_REGION: Region = "PAKISTAN"

// ---------------------------------------------------------------------------
// Currency handling by region
// ---------------------------------------------------------------------------

/** Currency codes by region. */
export const CURRENCY_BY_REGION: Record<Region, string> = {
  BAHRAIN: "BHD",
  PAKISTAN: "PKR",
}

/** Currency symbols by currency code. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  BHD: "BD",
  PKR: "Rs.",
}

/** Get the currency code for a region. */
export function getCurrencyForRegion(region: Region): string {
  return CURRENCY_BY_REGION[region] ?? "PKR"
}

/** Get the currency symbol for a currency code. */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency
}

/** Format an amount with the correct currency symbol for a region. */
export function formatAmount(amount: number, region: Region): string {
  const currency = getCurrencyForRegion(region)
  const symbol = getCurrencySymbol(currency)
  return `${symbol} ${amount.toLocaleString()}`
}

/** Get the default currency for the current user's region. */
export async function getDefaultCurrency(userId?: string): Promise<string> {
  const region = await getCurrentRegion(userId)
  return getCurrencyForRegion(region)
}

/**
 * Get the current user's region from the session.
 * Returns the default region if not set.
 *
 * @param userId — Optional; if omitted, reads from the active Better Auth session.
 * @returns The user's assigned region.
 */
const getRegionFromUser = cache(async (userId: string): Promise<Region> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { region: true },
    })
    return (user?.region as Region) ?? DEFAULT_REGION
  } catch {
    return DEFAULT_REGION
  }
})

export async function getCurrentRegion(userId?: string): Promise<Region> {
  if (!userId) return DEFAULT_REGION
  return getRegionFromUser(userId)
}

/**
 * Region-aware listing query filter.
 * Returns a Prisma `Where` clause that filters by the current user's region.
 *
 * Usage in repository:
 *   const listings = await prisma.listing.findMany({
 *     where: {
 *       ...regionWhere(),
 *       // other filters...
 *     },
 *   })
 */
export async function regionWhere(userId?: string): Promise<{
  region: Region
}> {
  const region = await getCurrentRegion(userId)
  return { region }
}

/**
 * Region-aware profile query filter.
 */
export async function profileRegionWhere(userId?: string): Promise<{
  region: Region
}> {
  const region = await getCurrentRegion(userId)
  return { region }
}

/**
 * Check if the current user is from Bahrain.
 */
export async function isBahrainRegion(userId?: string): Promise<boolean> {
  return (await getCurrentRegion(userId)) === "BAHRAIN"
}

/**
 * Check if the current user is from Pakistan.
 */
export async function isPakistanRegion(userId?: string): Promise<boolean> {
  return (await getCurrentRegion(userId)) === "PAKISTAN"
}

/** Re-export prisma for convenience */
export { prisma }