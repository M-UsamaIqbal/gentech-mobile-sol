"use client";

import { useSearchParams } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { useLocalizedRouteInfo, withLocalizedPrefix } from "@/lib/localized-routing";

type Patch = Record<string, string | null | undefined>;

/**
 * Builds a marketplace URL from current params plus a patch, preserving the active
 * `/{country}/{locale}` prefix. Empty/null values remove a key; changing any filter
 * resets pagination unless `resetPage: false` is passed by the pager itself.
 */
export function useListingHref() {
  const searchParams = useSearchParams();
  const { prefix } = useLocalizedRouteInfo();

  return (patch: Patch, opts?: { resetPage?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === undefined || value === "") params.delete(key);
      else params.set(key, value);
    }

    if (opts?.resetPage !== false) params.delete("page");

    const qs = params.toString();
    return withLocalizedPrefix(
      `${ROUTES.marketplace}${qs ? `?${qs}` : ""}`,
      prefix,
    );
  };
}
