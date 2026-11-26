"use client";

import { usePathname } from "next/navigation";

import type { CountryCode, LocaleCode } from "@/lib/countries/types";
import { withCountryLocalePrefix } from "@/lib/localized-path";

const COUNTRY_SEGMENTS: Record<string, CountryCode> = { bh: "BH", pk: "PK" };
const LOCALE_SEGMENTS: readonly LocaleCode[] = ["ar", "ur", "en"];

export interface LocalizedRouteInfo {
  country: CountryCode | null
  locale: LocaleCode | null
  prefix: string | null
}

/** Reads the active `/{country}/{locale}` prefix from the current pathname. */
export function useLocalizedRouteInfo(): LocalizedRouteInfo {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const country = COUNTRY_SEGMENTS[segments[0]?.toLowerCase() ?? ""] ?? null
  const localeSegment = segments[1]?.toLowerCase() ?? ""
  const locale = LOCALE_SEGMENTS.find((value) => value === localeSegment) ?? null

  return {
    country,
    locale,
    prefix: country && locale ? `/${country.toLowerCase()}/${locale}` : null,
  }
}

/** Prefixes internal app links so navigation never drops the country/locale context. */
export function withLocalizedPrefix(href: string, prefix: string | null): string {
  if (!prefix) return href
  const [, countrySegment, localeSegment] = prefix.split("/")
  const country = COUNTRY_SEGMENTS[countrySegment?.toLowerCase() ?? ""]
  const locale = LOCALE_SEGMENTS.find((value) => value === localeSegment?.toLowerCase())
  if (!country || !locale) return href
  return withCountryLocalePrefix(href, country, locale)
}

export function useLocalizedHref(href: string): string {
  const { prefix } = useLocalizedRouteInfo()
  return withLocalizedPrefix(href, prefix)
}
