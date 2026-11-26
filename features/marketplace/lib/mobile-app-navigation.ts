export type MobileAppNavKey = "home" | "categories" | "sell" | "messages" | "account";

const COUNTRY_LOCALE_PREFIX = /^\/[a-z]{2}\/[a-z]{2}(?=\/|$)/;

/**
 * Maps a current pathname (localized or legacy) to one of the five mobile tabs.
 * Keeping this pure makes the bottom-bar active state testable without a router.
 */
export function mobileNavKeyForPath(pathname: string): MobileAppNavKey {
  const route = pathname.replace(COUNTRY_LOCALE_PREFIX, "") || "/";

  if (route === "/") return "home";
  if (route.startsWith("/categories")) return "categories";
  if (route.startsWith("/sell")) return "sell";
  if (route.startsWith("/dashboard/messages") || route.startsWith("/messages")) {
    return "messages";
  }
  if (
    route.startsWith("/dashboard") ||
    route.startsWith("/account") ||
    route.startsWith("/admin") ||
    route.startsWith("/inspector") ||
    route.startsWith("/sign-in")
  ) {
    return "account";
  }

  return "home";
}
