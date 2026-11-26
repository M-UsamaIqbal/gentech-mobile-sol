import type { MetadataRoute } from "next";

const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/inspector",
  "/api/",
  "/dashboard",
  "/account",
  "/sell",
  "/checkout",
  "/payment",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/inspection/pay",
] as const;

const LOCALIZED_PREFIX = /^\/(?:bh|pk)\/(?:en|ar|ur)(?=\/|$)/i;

/** Removes `/{country}/{locale}` so shared and localized routes can be compared. */
export function normalizeLocalizedPath(pathname: string): string {
  return pathname.replace(LOCALIZED_PREFIX, "") || "/";
}

/** Whether a route is private and must never be crawled or indexed. */
export function isPrivateSeoPath(pathname: string): boolean {
  const normalized = normalizeLocalizedPath(pathname);

  return PRIVATE_ROUTE_PREFIXES.some((prefix) =>
    prefix.endsWith("/")
      ? normalized.startsWith(prefix)
      : normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

/** Robots policy shared by `app/robots.ts` and middleware response headers. */
export function buildRobotsConfig(baseUrl: string): MetadataRoute.Robots {
  const origin = baseUrl.replace(/\/+$/, "");
  const privatePaths = [
    "/api/",
    "/admin",
    "/inspector",
    "/dashboard",
    "/*/dashboard",
    "/account",
    "/*/account",
    "/sell",
    "/*/sell",
    "/checkout",
    "/*/checkout",
    "/payment",
    "/*/payment",
    "/sign-in",
    "/*/sign-in",
    "/sign-up",
    "/*/sign-up",
    "/forgot-password",
    "/*/forgot-password",
    "/reset-password",
    "/*/reset-password",
    "/inspection/pay",
  ];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: privatePaths,
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
