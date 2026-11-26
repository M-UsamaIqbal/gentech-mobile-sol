import "server-only";

import { getTranslations } from "next-intl/server";

import { getRequestCountryLocale } from "@/lib/countries/server";

/**
 * Server-side translator bound to the locale resolved for the current request.
 *
 * Shared server components (header, footer, homepage sections) sit outside the
 * `[locale]` route segment and cannot receive the locale as a prop. Resolving
 * it from the middleware-injected header and passing it explicitly to
 * `getTranslations` avoids next-intl's request-scoped locale cache, which can
 * otherwise be primed with the default locale before a component renders.
 */
export async function getServerTranslations(namespace: string) {
  const { locale } = await getRequestCountryLocale();
  return getTranslations({ locale, namespace });
}
