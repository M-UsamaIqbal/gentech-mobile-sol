"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { getCategoryFilterProfile, specOptionKey } from "@/lib/catalog/category-filters";
import { useLocalizedRouteInfo, useLocalizedHref } from "@/lib/localized-routing";
import { formatPrice } from "@/utils/format";
import type { BrandItem, CategoryItem, ListingFilters } from "@/types/marketplace";
import { useListingHref } from "@/features/listings/hooks/use-listing-href";

interface Props {
  filters: ListingFilters;
  categories: CategoryItem[];
  brands: BrandItem[];
}

export function ActiveFilters({ filters, categories, brands }: Props) {
  const buildHref = useListingHref();
  const clearHref = useLocalizedHref(ROUTES.marketplace);
  const { country, locale } = useLocalizedRouteInfo();
  const t = useTranslations("searchPage");
  const tFilters = useTranslations("filters");
  const tCategories = useTranslations("categories");
  const tCondition = useTranslations("condition");
  const tStatus = useTranslations("status");
  const tListings = useTranslations("listings");
  const tValues = useTranslations("filterValues");
  const showPakistanSignals = country === "PK";
  const shows = (key: string) => getCategoryFilterProfile(filters.category).filters.includes(key as never);
  const specLabel = (value: string) =>
    tValues.has(specOptionKey(value)) ? tValues(specOptionKey(value)) : value;
  const language = locale ?? "en";
  const currency = country === "BH" ? "BHD" : "PKR";

  const chips: Array<{ label: string; patch: Record<string, null> }> = [];

  if (filters.q) chips.push({ label: `“${filters.q}”`, patch: { q: null } });
  if (filters.category) {
    const slug = filters.category;
    const name = tCategories.has(slug) ? tCategories(slug) : (categories.find((c) => c.slug === slug)?.name ?? slug);
    chips.push({ label: name, patch: { category: null } });
  }
  if (filters.brand) {
    const name = brands.find((brand) => brand.slug === filters.brand)?.name ?? filters.brand;
    chips.push({ label: name, patch: { brand: null } });
  }
  if (filters.condition) {
    chips.push({ label: tCondition(filters.condition), patch: { condition: null } });
  }
  if (filters.city) chips.push({ label: filters.city, patch: { city: null } });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const min = filters.minPrice !== undefined ? formatPrice(filters.minPrice, { currency, locale: language }) : tFilters("any");
    const max = filters.maxPrice !== undefined ? formatPrice(filters.maxPrice, { currency, locale: language }) : tFilters("any");
    chips.push({ label: `${min} – ${max}`, patch: { minPrice: null, maxPrice: null } });
  }
  if (shows("storage") && filters.storage) {
    const value = /^\d+(?:\.\d+)?$/.test(filters.storage)
      ? `${filters.storage}${tFilters("gb")}`
      : filters.storage;
    chips.push({ label: `${value} ${tFilters("storage")}`, patch: { storage: null } });
  }
  if (shows("ram") && filters.ram) {
    const value = /^\d+(?:\.\d+)?$/.test(filters.ram) ? `${filters.ram}${tFilters("gb")}` : filters.ram;
    chips.push({ label: `${value} ${tFilters("ram")}`, patch: { ram: null } });
  }
  if (shows("color") && filters.color) {
    chips.push({ label: `${tFilters("color")}: ${filters.color}`, patch: { color: null } });
  }
  if (shows("processor") && filters.processor) {
    chips.push({ label: `${tFilters("processor")}: ${specLabel(filters.processor)}`, patch: { processor: null } });
  }
  if (shows("operatingSystem") && filters.operatingSystem) {
    chips.push({ label: `${tFilters("operatingSystem")}: ${specLabel(filters.operatingSystem)}`, patch: { operatingSystem: null } });
  }
  if (shows("screenSize") && filters.screenSize) {
    chips.push({ label: `${tFilters("screenSize")}: ${specLabel(filters.screenSize)}`, patch: { screenSize: null } });
  }
  if (shows("connectivity") && filters.connectivity) {
    chips.push({ label: `${tFilters("connectivity")}: ${specLabel(filters.connectivity)}`, patch: { connectivity: null } });
  }
  if (shows("accessoryType") && filters.accessoryType) {
    chips.push({ label: `${tFilters("accessoryType")}: ${specLabel(filters.accessoryType)}`, patch: { accessoryType: null } });
  }
  if (shows("compatibility") && filters.compatibility) {
    chips.push({ label: `${tFilters("compatibility")}: ${specLabel(filters.compatibility)}`, patch: { compatibility: null } });
  }
  if (shows("batteryHealthMin") && filters.batteryHealthMin !== undefined) {
    chips.push({
      label: `${tFilters("batteryHealth")} ${filters.batteryHealthMin}%+`,
      patch: { batteryHealthMin: null },
    });
  }
  if (showPakistanSignals && shows("ptaStatus") && filters.ptaStatus) {
    chips.push({
      label: `${tFilters("ptaStatus")}: ${tStatus(filters.ptaStatus)}`,
      patch: { ptaStatus: null },
    });
  }
  if (showPakistanSignals && shows("cpidStatus") && filters.cpidStatus) {
    chips.push({
      label: `${tFilters("cpidStatus")}: ${tStatus(filters.cpidStatus)}`,
      patch: { cpidStatus: null },
    });
  }
  if (shows("warranty") && filters.warranty) {
    chips.push({
      label: `${tFilters("warranty")}: ${tStatus(filters.warranty)}`,
      patch: { warranty: null },
    });
  }
  if (filters.isInspected) chips.push({ label: tListings("inspected"), patch: { isInspected: null } });
  if (filters.isVerifiedSeller) {
    chips.push({ label: tListings("verifiedSeller"), patch: { isVerifiedSeller: null } });
  }
  if (filters.isDealer) chips.push({ label: tFilters("dealersOnly"), patch: { isDealer: null } });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={buildHref(chip.patch)}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/70 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
        >
          {chip.label}
          <X className="size-3" />
        </Link>
      ))}
      <Link
        href={clearHref}
        className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
      >
        {t("clearFilters")}
      </Link>
    </div>
  );
}
