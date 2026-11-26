import { bhConfig } from "./bh"
import { pkConfig } from "./pk"
import {
  COUNTRY_NAMES,
  LOCALIZED_COUNTRY_NAMES,
  type CountryCode,
  type CountryConfig,
  type LocaleCode,
} from "./types"

/**
 * Centralized country registry.
 * All country-specific behavior is driven by these configurations.
 * To add a new country, create a config file and register it here.
 */

/** All supported countries. */
export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  BH: bhConfig,
  PK: pkConfig,
}

/** Default country when no preference is set. */
export const DEFAULT_COUNTRY: CountryCode = "PK"

/** All supported UI languages (country-agnostic). */
export const SUPPORTED_LOCALES: readonly LocaleCode[] = ["en", "ar", "ur"]

/** Get country configuration by code. */
export function getCountryConfig(code: CountryCode): CountryConfig {
  return COUNTRIES[code] ?? COUNTRIES[DEFAULT_COUNTRY]
}

/** Get all country codes. */
export function getCountryCodes(): CountryCode[] {
  return Object.keys(COUNTRIES) as CountryCode[]
}

/** Get all country configs as an array. */
export function getAllCountries(): CountryConfig[] {
  return Object.values(COUNTRIES)
}

/** Check if a country code is valid. */
export function isValidCountryCode(code: string): code is CountryCode {
  return code in COUNTRIES
}

/** Get the default locale for a country. */
export function getDefaultLocale(code: CountryCode): LocaleCode {
  return getCountryConfig(code).defaultLocale
}

/** Get available locales for a country. */
export function getAvailableLocales(code: CountryCode): LocaleCode[] {
  return getCountryConfig(code).availableLocales
}

/** Check if a locale is available for a country. */
export function isLocaleAvailable(country: CountryCode, locale: string): boolean {
  return getCountryConfig(country).availableLocales.some((available) => available === locale)
}

/** Check if a locale is supported by the marketplace UI. */
export function isSupportedLocale(locale: string): locale is LocaleCode {
  return SUPPORTED_LOCALES.some((available) => available === locale)
}

/** All UI languages offered in both countries, in the header switcher order. */
export function getAllSupportedLocales(): readonly LocaleCode[] {
  return SUPPORTED_LOCALES
}

/** Country name rendered in the language of the current UI. */
export function getCountryName(code: CountryCode, locale: LocaleCode): string {
  return LOCALIZED_COUNTRY_NAMES[code][locale] ?? COUNTRY_NAMES[code] ?? getCountryConfig(code).name
}

/** Get the default currency for a country. */
export function getDefaultCurrency(code: CountryCode): string {
  return getCountryConfig(code).defaultCurrency
}

/** Check if a country uses RTL layout. */
export function isRtlCountry(code: CountryCode): boolean {
  return getCountryConfig(code).rtl
}

/** Get payment methods for a country. */
export function getPaymentMethods(code: CountryCode): string[] {
  return getCountryConfig(code).paymentMethods
}

/** Get shipping methods for a country. */
export function getShippingMethods(code: CountryCode): string[] {
  return getCountryConfig(code).shippingMethods
}