/**
 * Country configuration types for multi-country localization.
 *
 * Country and language are independent preferences. Any supported language may
 * be used in any supported country without affecting currency or payments.
 * - Bahrain: defaults to Arabic when no explicit/browser preference exists
 * - Pakistan: defaults to Urdu when no explicit/browser preference exists
 *
 * RTL languages: Arabic (ar), Urdu (ur)
 * LTR languages: English (en)
 */

/** Supported country codes. */
export type CountryCode = "BH" | "PK"

/** Supported locale codes (country-agnostic). */
export type LocaleCode = "en" | "ar" | "ur"

/** Request headers populated by middleware for server-rendered locale metadata. */
export const COUNTRY_HEADER = "x-gentech-country"
export const LOCALE_HEADER = "x-gentech-locale"

/** Whether a locale uses RTL text direction. */
export function isRtlLocale(locale: LocaleCode): boolean {
  return locale === "ar" || locale === "ur"
}

/** Country configuration — drives all country-specific behavior. */
export interface CountryConfig {
  /** ISO 3166-1 alpha-2 country code. */
  code: CountryCode
  /** English country name. */
  name: string
  /** Native country name. */
  nativeName: string
  /** Country flag emoji. */
  flag: string
  /** Default language for this country. */
  defaultLocale: LocaleCode
  /** All languages available for this country. */
  availableLocales: LocaleCode[]
  /** Default currency code. */
  defaultCurrency: "BHD" | "PKR"
  /** Whether the default locale is RTL. */
  rtl: boolean
  /** Available payment method IDs (configurable). */
  paymentMethods: string[]
  /** Available shipping method IDs (configurable). */
  shippingMethods: string[]
  /** Tax configuration. */
  taxConfig: {
    vatRate: number
    vatName: string
    vatNumber?: string
  }
  /** Contact information. */
  contactInfo: {
    email: string
    phone: string
    address: string
    whatsapp?: string
  }
  /** Business policies. */
  businessPolicies: {
    returnPolicy: string
    shippingPolicy: string
    privacyPolicy: string
  }
}

/** Country code to English display name mapping. */
export const COUNTRY_NAMES: Record<CountryCode, string> = {
  BH: "Bahrain",
  PK: "Pakistan",
}

/**
 * Country name in the language of the surrounding UI. Never use `nativeName`
 * inside a translated sentence: it would mix Arabic/Urdu script into English
 * copy (or the wrong script into the other RTL locale).
 */
export const LOCALIZED_COUNTRY_NAMES: Record<CountryCode, Record<LocaleCode, string>> = {
  BH: { en: "Bahrain", ar: "البحرين", ur: "بحرین" },
  PK: { en: "Pakistan", ar: "باكستان", ur: "پاکستان" },
}

/** Locale code to display name mapping. */
export const LOCALE_NAMES: Record<LocaleCode, string> = {
  ar: "Arabic",
  ur: "Urdu",
  en: "English",
}

/** Locale code to native name mapping. */
export const LOCALE_NATIVE_NAMES: Record<LocaleCode, string> = {
  ar: "العربية",
  ur: "اردو",
  en: "English",
}