"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { ListingSort } from "@/types/marketplace";
import { LISTING_SORTS } from "@/features/listings/schemas/filters";
import { useListingHref } from "@/features/listings/hooks/use-listing-href";

export function SortSelect({ value }: { value: ListingSort }) {
  const router = useRouter();
  const buildHref = useListingHref();
  const t = useTranslations("sort");

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground hidden sm:inline">{t("label")}</span>
      <select
        value={value}
        onChange={(event) => router.push(buildHref({ sort: event.target.value }))}
        aria-label={t("label")}
        className="border-input bg-background h-9 rounded-md border px-2 text-sm"
      >
        {LISTING_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {t(sort)}
          </option>
        ))}
      </select>
    </label>
  );
}
