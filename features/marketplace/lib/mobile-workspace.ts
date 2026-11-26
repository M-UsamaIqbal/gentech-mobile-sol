const COUNTRY_LOCALE_PREFIX = /^\/[a-z]{2}\/[a-z]{2}(?=\/|$)/;

/** Internal route path without the optional `/{country}/{locale}` prefix. */
export function mobileWorkspaceRoute(pathname: string): string {
  return pathname.replace(COUNTRY_LOCALE_PREFIX, "") || "/";
}

/**
 * Navigation translation key for an authenticated page. Detail routes inherit the
 * title of their section so the mobile app bar never shows a raw path segment.
 */
export function mobileWorkspaceTitleKey(pathname: string): string {
  const route = mobileWorkspaceRoute(pathname);

  const rules: readonly [RegExp, string][] = [
    [/^\/dashboard\/orders/, "orders"],
    [/^\/dashboard\/messages/, "messages"],
    [/^\/dashboard\/listings/, "myListings"],
    [/^\/dashboard\/favorites/, "favorites"],
    [/^\/dashboard\/saved-searches/, "savedSearches"],
    [/^\/dashboard\/inspections/, "inspections"],
    [/^\/dashboard\/promotions/, "promotions"],
    [/^\/dashboard\/notifications/, "notifications"],
    [/^\/dashboard\/dealer/, "dealerPanel"],
    [/^\/dashboard\/profile/, "profile"],
    [/^\/dashboard/, "dashboard"],
    [/^\/inspector/, "inspector"],
    [/^\/admin/, "admin"],
    [/^\/sell/, "sell"],
    [/^\/checkout/, "orders"],
    [/^\/messages/, "messages"],
    [/^\/inspection/, "inspection"],
  ];

  for (const [pattern, key] of rules) {
    if (pattern.test(route)) return key;
  }

  return "dashboard";
}
