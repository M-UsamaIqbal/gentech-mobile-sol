import { NextResponse, type NextRequest } from "next/server";

import { getDefaultLocale, isSupportedLocale } from "@/lib/countries";
import {
  COUNTRY_HEADER,
  LOCALE_HEADER,
  type CountryCode,
  type LocaleCode,
} from "@/lib/countries/types";
import {
  COUNTRY_COOKIE,
  LOCALE_COOKIE,
  USER_COUNTRY_COOKIE,
  USER_LOCALE_COOKIE,
  resolveLocalization,
} from "@/lib/localization/detect";
import { isNonCanonicalQueryVariant } from "@/lib/seo/metadata";
import { isPrivateSeoPath, normalizeLocalizedPath } from "@/lib/seo/robots";

const COUNTRY_SEGMENTS: Record<string, CountryCode> = { bh: "BH", pk: "PK" };

/** Only these public routes have localized equivalents; admin tools stay global. */
const LOCALIZED_ROUTES = new Set([
  "marketplace",
  "categories",
  "listings",
  "sell",
  "checkout",
  "payment",
  "imei-check",
  "compare",
  "valuation",
  "inspection",
  "sign-in",
  "sign-up",
  "forgot-password",
  "reset-password",
  "dashboard",
  "account",
]);

function isStaticOrApi(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/) !== null
  );
}

/**
 * Resolves preferences with the shared priority chain. Explicit URL segments win;
 * a browser language is only consulted when no saved preference exists and is
 * never written back as a permanent setting.
 */
function resolveCountryLocale(
  request: NextRequest,
  explicitCountry?: CountryCode,
  explicitLocale?: LocaleCode,
): { country: CountryCode; locale: LocaleCode } {
  const geoCountry =
    request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "";

  const resolved = resolveLocalization(
    {
      country: {
        explicit: explicitCountry,
        user: request.cookies.get(USER_COUNTRY_COOKIE)?.value,
        cookie: request.cookies.get(COUNTRY_COOKIE)?.value,
        geo: geoCountry,
      },
      locale: {
        explicit: explicitLocale,
        user: request.cookies.get(USER_LOCALE_COOKIE)?.value,
        cookie: request.cookies.get(LOCALE_COOKIE)?.value,
        acceptLanguage: request.headers.get("accept-language"),
      },
    },
    (country) => getDefaultLocale(country),
  );

  return { country: resolved.country, locale: resolved.locale };
}

function withContextHeaders(request: NextRequest, country: CountryCode, locale: LocaleCode) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(COUNTRY_HEADER, country);
  requestHeaders.set(LOCALE_HEADER, locale);
  return requestHeaders;
}

function robotsDirective(pathname: string, searchParams: URLSearchParams): string | null {
  if (isPrivateSeoPath(pathname)) return "noindex, nofollow";

  const normalized = normalizeLocalizedPath(pathname);
  if (
    normalized === "/marketplace" &&
    isNonCanonicalQueryVariant(Object.fromEntries(searchParams.entries()))
  ) {
    return "noindex, follow";
  }

  return null;
}

function addSecurityHeaders(
  response: NextResponse,
  pathname = "",
  searchParams?: URLSearchParams,
) {
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    // Listing images may be embedded from any validated https URL.
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Preferences are per visitor; caches must vary on language and cookies.
  response.headers.set("Vary", "Accept-Language, Cookie");
  const directive = robotsDirective(pathname, searchParams ?? new URLSearchParams());
  if (directive) response.headers.set("X-Robots-Tag", directive);
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
}

/** Adds country/locale context and security headers to a pass-through response. */
function passThrough(request: NextRequest, country: CountryCode, locale: LocaleCode) {
  const response = NextResponse.next({
    request: { headers: withContextHeaders(request, country, locale) },
  });
  addSecurityHeaders(response, request.nextUrl.pathname, request.nextUrl.searchParams);
  return response;
}

/** Keeps the query string while moving a public route under its country prefix. */
function localizedRedirect(
  request: NextRequest,
  country: CountryCode,
  locale: LocaleCode,
  pathname = request.nextUrl.pathname,
) {
  const newUrl = request.nextUrl.clone();
  newUrl.pathname = `/${country.toLowerCase()}/${locale}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(newUrl);
  addSecurityHeaders(response, pathname, request.nextUrl.searchParams);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticOrApi(pathname)) {
    const response = NextResponse.next();
    addSecurityHeaders(response, pathname, request.nextUrl.searchParams);
    return response;
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase() ?? "";
  const secondSegment = segments[1]?.toLowerCase() ?? "";
  const routeCountry = COUNTRY_SEGMENTS[firstSegment];

  if (routeCountry) {
    const routeLocale = isSupportedLocale(secondSegment) ? secondSegment : null;

    // Explicit URL preferences always win and every language is valid in both
    // countries — no forced locale normalisation.
    if (routeLocale) return passThrough(request, routeCountry, routeLocale);

    // /bh, /bh/marketplace, /bh/unknown → keep the explicit country and resolve
    // the best language from user/cookie/browser/country default.
    const { locale } = resolveCountryLocale(request, routeCountry);
    const remaining = segments.slice(1);
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/${routeCountry.toLowerCase()}/${locale}${
      remaining.length > 0 ? `/${remaining.join("/")}` : ""
    }`;
    const response = NextResponse.redirect(newUrl);
    addSecurityHeaders(response, pathname, request.nextUrl.searchParams);
    return response;
  }

  const { country, locale } = resolveCountryLocale(request);

  if (pathname === "/") return localizedRedirect(request, country, locale);

  // Payment return URLs from the legacy inspection flow are intentionally global.
  const isLegacyPaymentReturn = firstSegment === "inspection" && secondSegment === "pay";
  if (!isLegacyPaymentReturn && LOCALIZED_ROUTES.has(firstSegment)) {
    return localizedRedirect(request, country, locale);
  }

  return passThrough(request, country, locale);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
