import { cookies } from "next/headers"
import { DEFAULT_COUNTRY, isValidCountryCode } from "@/lib/countries"
import type { CountryCode } from "@/lib/countries/types"

const COUNTRY_COOKIE_NAME = "gentech_country"
const COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

/**
 * Read the saved country preference from cookies.
 */
export async function getCountryFromCookie(): Promise<CountryCode> {
  try {
    const cookieStore = await cookies()
    const value = cookieStore.get(COUNTRY_COOKIE_NAME)?.value
    if (value && isValidCountryCode(value)) {
      return value as CountryCode
    }
  } catch {
    // Silently fall through to default
  }
  return DEFAULT_COUNTRY
}

/**
 * Save country preference to cookie.
 * Used when user manually selects a country.
 */
export async function setCountryCookie(country: CountryCode): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set(COUNTRY_COOKIE_NAME, country, {
      maxAge: COUNTRY_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  } catch {
    // Silently fail in non-server contexts
  }
}

/**
 * Check if a country cookie exists (user has manually selected).
 */
export async function hasCountryCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const value = cookieStore.get(COUNTRY_COOKIE_NAME)?.value
    return !!value && isValidCountryCode(value)
  } catch {
    return false
  }
}

export { COUNTRY_COOKIE_NAME }