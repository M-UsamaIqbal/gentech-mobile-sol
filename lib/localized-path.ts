import type { CountryCode, LocaleCode } from "@/lib/countries/types";

const COUNTRY_SEGMENTS = new Set(["bh", "pk"]);
const LOCALE_SEGMENTS = new Set(["ar", "ur", "en"]);

/** Routes that must remain shared across both countries. */
const GLOBAL_ROUTE_PREFIXES = [
  "/admin",
  "/inspector",
  "/api/",
  "/_next/",
  "/inspection/pay",
] as const;

function isGlobalRoute(href: string): boolean {
  return GLOBAL_ROUTE_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
  );
}

function hasLocalizedPrefix(href: string): boolean {
  const [first, second] = href.split("/").filter(Boolean);
  return (
    COUNTRY_SEGMENTS.has(first?.toLowerCase() ?? "") &&
    LOCALE_SEGMENTS.has(second?.toLowerCase() ?? "")
  );
}

/**
 * Prefixes internal marketplace/app links with `/{country}/{locale}` while
 * leaving already-localized links and shared admin/inspector routes untouched.
 * Safe to call from both Server and Client Components.
 */
export function withCountryLocalePrefix(
  href: string,
  country: CountryCode,
  locale: LocaleCode,
): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (isGlobalRoute(href) || hasLocalizedPrefix(href)) return href;
  return `/${country.toLowerCase()}/${locale}${href}`;
}
