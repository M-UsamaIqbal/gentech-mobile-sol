import { DEFAULT_COUNTRY, isValidCountryCode } from "./index"
import type { CountryCode } from "./types"

/**
 * Country detection utilities.
 *
 * Priority:
 * 1. Saved manual preference (cookie)
 * 2. IP geolocation (Cloudflare header or free API)
 * 3. Configured default country
 *
 * Never overwrites a manually selected country.
 */

const COUNTRY_COOKIE_NAME = "gentech_country"

/**
 * Detect country from Cloudflare's CF-IPCountry header.
 * Available when deployed on Cloudflare (free, reliable).
 */
export function detectFromCloudflareHeader(headers: Headers): CountryCode | null {
  const cfCountry = headers.get("cf-ipcountry")
  if (cfCountry && isValidCountryCode(cfCountry)) {
    return cfCountry as CountryCode
  }
  return null
}

/**
 * Detect country from IP using a free geolocation API.
 * Fallback when Cloudflare header is not available.
 *
 * Uses ip-api.com free tier (no API key needed, 45 req/min).
 * Only called server-side.
 */
export async function detectFromIp(ip: string): Promise<CountryCode | null> {
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return null // Local development
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.countryCode && isValidCountryCode(data.countryCode)) {
      return data.countryCode as CountryCode
    }
  } catch {
    // Silently fail — fall through to default
  }
  return null
}

/**
 * Read saved country preference from cookie.
 */
export function getSavedCountry(cookieValue: string | undefined): CountryCode | null {
  if (!cookieValue) return null
  if (isValidCountryCode(cookieValue)) {
    return cookieValue as CountryCode
  }
  return null
}

/**
 * Main country detection function.
 * Priority: saved preference > IP detection > default.
 *
 * @param headers - Request headers (for Cloudflare detection)
 * @param cookieValue - Saved country cookie value
 * @param ip - Client IP address (for API fallback)
 * @returns The detected country code.
 */
export async function detectCountry(
  headers: Headers,
  cookieValue?: string,
  ip?: string,
): Promise<CountryCode> {
  // 1. Saved manual preference (highest priority — never override)
  const saved = getSavedCountry(cookieValue)
  if (saved) return saved

  // 2. Cloudflare header
  const cf = detectFromCloudflareHeader(headers)
  if (cf) return cf

  // 3. IP geolocation API
  if (ip) {
    const ipCountry = await detectFromIp(ip)
    if (ipCountry) return ipCountry
  }

  // 4. Default
  return DEFAULT_COUNTRY
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(headers: Headers): string | undefined {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    undefined
  )
}