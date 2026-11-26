import "server-only"

import { headers } from "next/headers"

import { Region } from "@/lib/generated/prisma/enums"
import { DEFAULT_COUNTRY, getCountryConfig, isValidCountryCode } from "./index"
import {
  COUNTRY_HEADER,
  LOCALE_HEADER,
  type CountryCode,
  type LocaleCode,
} from "./types"

export function parseCountry(value: string | null | undefined): CountryCode | null {
  if (!value) return null
  const code = value.trim().toUpperCase()
  return isValidCountryCode(code) ? code : null
}

export function parseLocale(value: string | null | undefined): LocaleCode | null {
  const locale = value?.trim().toLowerCase()
  return locale === "ar" || locale === "ur" || locale === "en" ? locale : null
}

export function getCountryFromParam(value: string): CountryCode {
  return parseCountry(value) ?? DEFAULT_COUNTRY
}

/**
 * Resolves a locale URL segment. Any supported language is valid in any country
 * so a manual language choice never forces a country or fallback.
 */
export function getLocaleFromParam(value: string, country: CountryCode): LocaleCode {
  return parseLocale(value) ?? getCountryConfig(country).defaultLocale
}

export function getRegionForCountry(country: CountryCode): Region {
  return country === "BH" ? Region.BAHRAIN : Region.PAKISTAN
}

/** Resolves country/locale from middleware headers for global server components. */
export async function getRequestCountryLocale(): Promise<{ country: CountryCode; locale: LocaleCode }> {
  const requestHeaders = await headers()
  const country = parseCountry(requestHeaders.get(COUNTRY_HEADER)) ?? DEFAULT_COUNTRY
  const requested = parseLocale(requestHeaders.get(LOCALE_HEADER))
  const locale = requested ?? getCountryConfig(country).defaultLocale

  return { country, locale }
}
