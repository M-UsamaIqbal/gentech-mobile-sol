/**
 * Client-side preference cookie helpers.
 * Used by client components (like the country/language switchers) to mirror a
 * selection before navigation. Server actions write the authoritative cookies.
 */

import {
  COUNTRY_COOKIE,
  LOCALE_COOKIE,
  PREFERENCE_COOKIE_MAX_AGE,
  USER_COUNTRY_COOKIE,
  USER_LOCALE_COOKIE,
} from "@/lib/localization/detect";

function writeCookie(name: string, value: string): void {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? ";secure" : "";
  document.cookie = `${name}=${value};path=/;max-age=${PREFERENCE_COOKIE_MAX_AGE};samesite=lax${secure}`;
}

/** Save country preference to cookie (client-side). */
export function setCountryCookieClient(country: string): void {
  writeCookie(COUNTRY_COOKIE, country);
}

/** Save locale preference to cookie (client-side). */
export function setLocaleCookieClient(locale: string): void {
  writeCookie(LOCALE_COOKIE, locale);
}

/** Mirror an authenticated user's saved country preference for Edge detection. */
export function setUserCountryCookieClient(country: string): void {
  writeCookie(USER_COUNTRY_COOKIE, country);
}

/** Mirror an authenticated user's saved language preference for Edge detection. */
export function setUserLocaleCookieClient(locale: string): void {
  writeCookie(USER_LOCALE_COOKIE, locale);
}
