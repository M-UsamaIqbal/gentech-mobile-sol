import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { LOCALE_HEADER } from "./lib/countries/types";
import { GLOBAL_FALLBACK_LOCALE, normalizeLocale } from "./lib/localization/detect";

/**
 * Single next-intl request configuration.
 *
 * The middleware resolves country and language independently; for localized
 * routes the URL is the source of truth and is injected in `LOCALE_HEADER`.
 * Reading that header here keeps every server translation path (implicit or
 * explicit) and the client provider on the same resolved locale.
 */
export default getRequestConfig(async ({ locale, requestLocale }) => {
  let headerLocale: string | null = null;
  try {
    headerLocale = (await headers()).get(LOCALE_HEADER);
  } catch {
    // Outside a request (build-time analysis) the header store is unavailable.
  }

  const resolvedLocale =
    normalizeLocale(headerLocale) ??
    normalizeLocale(await requestLocale) ??
    normalizeLocale(locale) ??
    GLOBAL_FALLBACK_LOCALE;

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  };
});
