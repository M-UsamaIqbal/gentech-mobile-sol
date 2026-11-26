import { DEFAULT_COUNTRY } from "@/lib/countries";
import type { CountryCode, LocaleCode } from "@/lib/countries/types";

/**
 * Single source of truth for country and language resolution.
 *
 * Country and language are independent preferences. Country is never inferred
 * from browser language, and a manually selected language is never overwritten
 * by geo or browser suggestions.
 */

export const SUPPORTED_COUNTRIES: readonly CountryCode[] = ["BH", "PK"];
export const SUPPORTED_LOCALES: readonly LocaleCode[] = ["en", "ar", "ur"];

export const GLOBAL_FALLBACK_LOCALE: LocaleCode = "en";

export const COUNTRY_COOKIE = "gentech_country";
export const LOCALE_COOKIE = "gentech_locale";
/** Mirrors the authenticated user's DB preference into an Edge-readable cookie. */
export const USER_COUNTRY_COOKIE = "gentech_user_country";
export const USER_LOCALE_COOKIE = "gentech_user_locale";
export const PREFERENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type PreferenceSource =
  | "explicit"
  | "user"
  | "cookie"
  | "browser"
  | "geo"
  | "country-default"
  | "global-default"
  | "default";

export interface CountryCandidates {
  /** Explicit route segment (`/{country}/{locale}`) — always wins. */
  explicit?: string | null;
  /** Authenticated user's saved preference (mirrored cookie). */
  user?: string | null;
  /** Existing saved cookie. */
  cookie?: string | null;
  /** GeoIP / platform header. Never derived from Accept-Language. */
  geo?: string | null;
}

export interface LocaleCandidates {
  /** Explicit route segment (`/{country}/{locale}`) — always wins. */
  explicit?: string | null;
  /** Authenticated user's saved preference (mirrored cookie). */
  user?: string | null;
  /** Existing saved cookie. */
  cookie?: string | null;
  /** Browser Accept-Language header — a suggestion only. */
  acceptLanguage?: string | null;
}

export interface LocalizationCandidates {
  country: CountryCandidates;
  locale: LocaleCandidates;
}

export interface ResolvedLocalization {
  country: CountryCode;
  locale: LocaleCode;
  countrySource: PreferenceSource;
  localeSource: PreferenceSource;
}

export function normalizeCountry(value: string | null | undefined): CountryCode | null {
  const code = value?.trim().toUpperCase();
  return SUPPORTED_COUNTRIES.find((candidate) => candidate === code) ?? null;
}

export function normalizeLocale(value: string | null | undefined): LocaleCode | null {
  const locale = value?.trim().toLowerCase();
  return SUPPORTED_LOCALES.find((candidate) => candidate === locale) ?? null;
}

/**
 * Reads Accept-Language into supported locale codes, honouring quality weights.
 * Regional variants such as `en-US` or `ur-PK` resolve to their base language.
 */
export function parseAcceptLanguage(header: string | null | undefined): LocaleCode[] {
  if (!header?.trim()) return [];

  const ranked = header
    .split(",")
    .map((entry) => {
      const [rawTag, ...parameters] = entry.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
      return {
        locale: normalizeLocale(rawTag?.split("-")[0]),
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((entry): entry is { locale: LocaleCode; quality: number } =>
      Boolean(entry.locale && entry.quality > 0),
    )
    .sort((left, right) => right.quality - left.quality);

  const seen = new Set<LocaleCode>();
  const result: LocaleCode[] = [];
  for (const entry of ranked) {
    if (seen.has(entry.locale)) continue;
    seen.add(entry.locale);
    result.push(entry.locale);
  }
  return result;
}

/** Country priority: explicit → user → cookie → GeoIP → default. */
export function resolveCountry(candidates: CountryCandidates): {
  country: CountryCode;
  source: PreferenceSource;
} {
  const ordered: Array<[PreferenceSource, string | null | undefined]> = [
    ["explicit", candidates.explicit],
    ["user", candidates.user],
    ["cookie", candidates.cookie],
    ["geo", candidates.geo],
  ];

  for (const [source, value] of ordered) {
    const country = normalizeCountry(value);
    if (country) return { country, source };
  }

  return { country: DEFAULT_COUNTRY, source: "default" };
}

/** Locale priority: explicit → user → cookie → Accept-Language → country default → en. */
export function resolveLocale(
  candidates: LocaleCandidates,
  country: CountryCode,
  countryDefaultLocale: LocaleCode,
): { locale: LocaleCode; source: PreferenceSource } {
  const ordered: Array<[PreferenceSource, string | null | undefined]> = [
    ["explicit", candidates.explicit],
    ["user", candidates.user],
    ["cookie", candidates.cookie],
  ];

  for (const [source, value] of ordered) {
    const locale = normalizeLocale(value);
    if (locale) return { locale, source };
  }

  const browserLocale = parseAcceptLanguage(candidates.acceptLanguage)[0];
  if (browserLocale) return { locale: browserLocale, source: "browser" };

  if (countryDefaultLocale) return { locale: countryDefaultLocale, source: "country-default" };
  return { locale: GLOBAL_FALLBACK_LOCALE, source: "global-default" };
}

/** Resolves both preferences independently from one candidate bundle. */
export function resolveLocalization(
  candidates: LocalizationCandidates,
  countryDefaultLocale: (country: CountryCode) => LocaleCode,
): ResolvedLocalization {
  const { country, source: countrySource } = resolveCountry(candidates.country);
  const { locale, source: localeSource } = resolveLocale(
    candidates.locale,
    country,
    countryDefaultLocale(country),
  );

  return { country, locale, countrySource, localeSource };
}
