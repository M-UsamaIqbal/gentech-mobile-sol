import type { Metadata } from "next";

import { DEFAULT_COUNTRY, getAllSupportedLocales, getCountryCodes } from "@/lib/countries";
import type { CountryCode, LocaleCode } from "@/lib/countries/types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Builds a concrete marketplace URL from a route path and a country/locale pair. */
export function localizedPath(path: string, country: CountryCode, locale: LocaleCode): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefix = `/${country.toLowerCase()}/${locale.toLowerCase()}`;
  return normalized === "/" ? prefix : `${prefix}${normalized}`;
}

/** Resolves a route path against the canonical application origin. */
export function absoluteUrl(path: string, baseUrl: string): string {
  return new URL(path, `${baseUrl.replace(/\/+$/, "")}/`).toString();
}

/** Every supported locale/country combination, plus a stable English fallback. */
export function buildAlternateLanguages(path: string): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const country of getCountryCodes()) {
    for (const locale of getAllSupportedLocales()) {
      languages[`${locale}-${country}`] = localizedPath(path, country, locale);
    }
  }

  languages["x-default"] = localizedPath(path, DEFAULT_COUNTRY, "en");
  return languages;
}

interface LocalizedSeoOptions {
  path: string;
  country: CountryCode;
  locale: LocaleCode;
  robots?: Metadata["robots"];
  openGraph?: Metadata["openGraph"];
}

/**
 * Applies the actual page path to canonical/hreflang tags. Child pages must use
 * this instead of relying on the localized layout, which cannot know their path.
 */
export function localizedSeoMetadata({
  path,
  country,
  locale,
  robots = { index: true, follow: true },
  openGraph,
}: LocalizedSeoOptions): Metadata {
  const canonical = localizedPath(path, country, locale);

  return {
    alternates: {
      canonical,
      languages: buildAlternateLanguages(path),
    },
    robots,
    openGraph: {
      type: "website",
      url: canonical,
      locale: `${locale}_${country}`,
      ...openGraph,
    },
  };
}

/**
 * True when a URL carries filter/sort/page state that must not be indexed as a
 * separate page. Default sort and page values are treated as the clean URL.
 */
export function isNonCanonicalQueryVariant(raw: RawSearchParams): boolean {
  return Object.entries(raw).some(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    const first = values[0];

    if (typeof first !== "string" || first.trim().length === 0) return false;

    const normalizedKey = key.toLowerCase();
    const normalizedValue = first.trim();

    if (normalizedKey === "page") return normalizedValue !== "1";
    if (normalizedKey === "sort") return normalizedValue !== "recent";
    return true;
  });
}

/** Produces a description that ends on a word boundary. */
export function truncateDescription(value: string, maxLength = 160): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const clipped = normalized.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(" ");
  const safe = lastSpace > maxLength / 2 ? clipped.slice(0, lastSpace) : clipped;
  return `${safe}…`;
}
