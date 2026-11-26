"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FilterGroupId } from "@/features/listings/lib/filter-groups";
import { LISTING_CONDITIONS, PTA_STATUS, CPID_STATUS, WARRANTY_TYPE } from "@/lib/constants";
import {
  ACCESSORY_TYPE_OPTIONS,
  COMPATIBILITY_OPTIONS,
  CONNECTIVITY_OPTIONS,
  getCategoryFilterProfile,
  OPERATING_SYSTEM_OPTIONS,
  PROCESSOR_OPTIONS,
  SCREEN_SIZE_OPTIONS,
  specOptionKey,
  type CategoryFilterKey,
} from "@/lib/catalog/category-filters";
import { useLocalizedRouteInfo } from "@/lib/localized-routing";
import type {
  BrandItem,
  CategoryItem,
  ListingFilters,
  ListingFilterOptions,
} from "@/types/marketplace";
import type { LocationTree } from "@/features/locations/services/location.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useListingHref } from "@/features/listings/hooks/use-listing-href";

interface Props {
  categories: CategoryItem[];
  brands: BrandItem[];
  filters: ListingFilters;
  locations: LocationTree;
  filterOptions: ListingFilterOptions;
  onApply?: () => void;
  collapsedGroups?: ReadonlySet<FilterGroupId>;
  activeGroups?: ReadonlySet<FilterGroupId>;
  onToggleGroup?: (id: FilterGroupId) => void;
}

const EMPTY_GROUP_SET: ReadonlySet<FilterGroupId> = new Set();

interface FilterGroupContextValue {
  collapsed: ReadonlySet<FilterGroupId>;
  active: ReadonlySet<FilterGroupId>;
  onToggle?: (id: FilterGroupId) => void;
}

const FilterGroupContext = React.createContext<FilterGroupContextValue>({
  collapsed: EMPTY_GROUP_SET,
  active: EMPTY_GROUP_SET,
});

function FilterGroup({
  id,
  title,
  children,
}: {
  id: FilterGroupId;
  title: string;
  children: React.ReactNode;
}) {
  const { collapsed, active, onToggle } = React.useContext(FilterGroupContext);
  const isCollapsed = collapsed.has(id);

  return (
    <div className="border-b py-4 first:pt-0 last:border-b-0">
      {onToggle ? (
        <h3>
          <button
            type="button"
            onClick={() => onToggle(id)}
            aria-expanded={!isCollapsed}
            className={cn(
              "hover:text-foreground flex w-full items-center justify-between gap-2 rounded-md py-1 text-start text-sm font-semibold transition-colors motion-reduce:transition-none",
              active.has(id) && "text-brand",
            )}
          >
            <span>{title}</span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "text-muted-foreground size-4 transition-transform motion-reduce:transition-none",
                isCollapsed && "-rotate-90",
              )}
            />
          </button>
        </h3>
      ) : (
        <h3 className={cn("mb-2 text-sm font-semibold", active.has(id) && "text-brand")}>
          {title}
        </h3>
      )}
      {isCollapsed ? null : <div className={onToggle ? "mt-2" : undefined}>{children}</div>}
    </div>
  );
}

function StatusLinks({
  values,
  active,
  buildHref,
  keyName,
  translate,
}: {
  values: readonly string[];
  active?: string;
  buildHref: (patch: Record<string, string | null>) => string;
  keyName: string;
  translate: (key: string) => string;
}) {
  return (
    <ul className="space-y-0.5">
      {values.map((value) => {
        const isActive = active === value;
        return (
          <li key={value}>
            <Link
              href={buildHref({ [keyName]: isActive ? null : value })}
              className={cn(
                "hover:bg-accent block rounded-md px-2 py-1.5",
                isActive && "bg-accent font-medium",
              )}
            >
              {translate(value)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function PriceRangeFilter({
  min,
  max,
  onApply,
}: {
  min?: number;
  max?: number;
  onApply?: () => void;
}) {
  const router = useRouter();
  const buildHref = useListingHref();
  const t = useTranslations("filters");
  const [minPrice, setMinPrice] = React.useState(min?.toString() ?? "");
  const [maxPrice, setMaxPrice] = React.useState(max?.toString() ?? "");

  function applyPrice(event: React.FormEvent) {
    event.preventDefault();
    router.push(buildHref({ minPrice: minPrice || null, maxPrice: maxPrice || null }));
    onApply?.();
  }

  return (
    <form onSubmit={applyPrice} className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="grid gap-1">
          <Label htmlFor="minPrice" className="text-muted-foreground text-xs">
            {t("minPrice")}
          </Label>
          <Input
            id="minPrice"
            inputMode="numeric"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="h-9"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="maxPrice" className="text-muted-foreground text-xs">
            {t("maxPrice")}
          </Label>
          <Input
            id="maxPrice"
            inputMode="numeric"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value.replace(/\D/g, ""))}
            placeholder={t("any")}
            className="h-9"
          />
        </div>
      </div>
      <Button type="submit" variant="outline" size="sm" className="w-full">
        {t("applyPrice")}
      </Button>
    </form>
  );
}

function BatteryHealthFilter({ value, onApply }: { value?: number; onApply?: () => void }) {
  const router = useRouter();
  const buildHref = useListingHref();
  const t = useTranslations("filters");
  const [batteryHealthMin, setBatteryHealthMin] = React.useState(value?.toString() ?? "");

  return (
    <div className="flex items-center gap-2">
      <Input
        inputMode="numeric"
        value={batteryHealthMin}
        onChange={(event) => setBatteryHealthMin(event.target.value.replace(/\D/g, "").slice(0, 3))}
        placeholder={t("minPercent")}
        aria-label={t("batteryHealth")}
        className="h-9"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          router.push(buildHref({ batteryHealthMin: batteryHealthMin || null }));
          onApply?.();
        }}
      >
        {t("apply")}
      </Button>
    </div>
  );
}

function OptionLinks({
  values,
  active,
  keyName,
  buildHref,
  format,
}: {
  values: readonly string[];
  active?: string;
  keyName: string;
  buildHref: (patch: Record<string, string | null>) => string;
  format?: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => {
        const isActive = active === value;
        return (
          <Link
            key={value}
            href={buildHref({ [keyName]: isActive ? null : value })}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs transition-colors",
              isActive ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {format ? format(value) : value}
          </Link>
        );
      })}
    </div>
  );
}

export function MarketplaceFilters({
  categories,
  brands,
  filters,
  locations,
  filterOptions,
  onApply,
  collapsedGroups,
  activeGroups,
  onToggleGroup,
}: Props) {
  const router = useRouter();
  const buildHref = useListingHref();
  const t = useTranslations("filters");
  const tCondition = useTranslations("condition");
  const tStatus = useTranslations("status");
  const tCategories = useTranslations("categories");
  const tValues = useTranslations("filterValues");
  const { country } = useLocalizedRouteInfo();
  const showPakistanSignals = country === "PK";
  const profile = getCategoryFilterProfile(filters.category);
  const shows = (key: CategoryFilterKey) => profile.filters.includes(key);
  const specLabel = (value: string) =>
    tValues.has(specOptionKey(value)) ? tValues(specOptionKey(value)) : value;

  const groupContext = React.useMemo<FilterGroupContextValue>(
    () => ({
      collapsed: collapsedGroups ?? EMPTY_GROUP_SET,
      active: activeGroups ?? EMPTY_GROUP_SET,
      onToggle: onToggleGroup,
    }),
    [collapsedGroups, activeGroups, onToggleGroup],
  );

  return (
    <FilterGroupContext.Provider value={groupContext}>
      <div className="text-sm">
        <FilterGroup id="category" title={t("category")}>
          <ul className="space-y-0.5">
            {categories.map((category) => {
              const active = filters.category === category.slug;
              return (
                <li key={category.id}>
                  <Link
                    href={buildHref({ category: active ? null : category.slug })}
                    className={cn(
                      "hover:bg-accent flex items-center justify-between rounded-md px-2 py-1.5",
                      active && "bg-accent font-medium",
                    )}
                  >
                    {tCategories.has(category.slug) ? tCategories(category.slug) : category.name}
                    {typeof category.count === "number" ? (
                      <span className="text-muted-foreground text-xs">{category.count}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </FilterGroup>

        {brands.length > 0 ? (
          <FilterGroup id="brand" title={t("brand")}>
            <div className="flex flex-wrap gap-1.5">
              {brands.map((brand) => {
                const active = filters.brand === brand.slug;
                return (
                  <Link
                    key={brand.id}
                    href={buildHref({ brand: active ? null : brand.slug })}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-accent",
                    )}
                  >
                    {brand.name}
                  </Link>
                );
              })}
            </div>
          </FilterGroup>
        ) : null}

        <FilterGroup id="condition" title={t("condition")}>
          <ul className="space-y-0.5">
            {Object.values(LISTING_CONDITIONS).map((condition) => {
              const active = filters.condition === condition;
              return (
                <li key={condition}>
                  <Link
                    href={buildHref({ condition: active ? null : condition })}
                    className={cn(
                      "hover:bg-accent block rounded-md px-2 py-1.5",
                      active && "bg-accent font-medium",
                    )}
                  >
                    {tCondition(condition)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </FilterGroup>

        <FilterGroup id="price" title={t("priceRange")}>
          <PriceRangeFilter
            key={`${filters.minPrice ?? ""}-${filters.maxPrice ?? ""}`}
            min={filters.minPrice}
            max={filters.maxPrice}
            onApply={onApply}
          />
        </FilterGroup>

        <FilterGroup id="city" title={t("city")}>
          <select
            value={filters.city ?? ""}
            onChange={(event) => {
              router.push(buildHref({ city: event.target.value || null }));
              onApply?.();
            }}
            aria-label={t("city")}
            className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
          >
            <option value="">{t("allCities")}</option>
            {locations.flatMap((countryEntry) =>
              countryEntry.cities.map((city) => (
                <option key={city.id} value={city.name}>
                  {city.name}
                </option>
              )),
            )}
          </select>
        </FilterGroup>

        {shows("storage") && filterOptions.storage.length > 0 ? (
          <FilterGroup id="storage" title={t("storage")}>
            <OptionLinks
              values={filterOptions.storage}
              active={filters.storage}
              keyName="storage"
              buildHref={buildHref}
              format={(value) => (/^\d+(?:\.\d+)?$/.test(value) ? `${value}${t("gb")}` : value)}
            />
          </FilterGroup>
        ) : null}

        {shows("ram") && filterOptions.ram.length > 0 ? (
          <FilterGroup id="ram" title={t("ram")}>
            <OptionLinks
              values={filterOptions.ram}
              active={filters.ram}
              keyName="ram"
              buildHref={buildHref}
              format={(value) => (/^\d+(?:\.\d+)?$/.test(value) ? `${value}${t("gb")}` : value)}
            />
          </FilterGroup>
        ) : null}

        {shows("color") && filterOptions.colors.length > 0 ? (
          <FilterGroup id="color" title={t("color")}>
            <OptionLinks
              values={filterOptions.colors}
              active={filters.color}
              keyName="color"
              buildHref={buildHref}
            />
          </FilterGroup>
        ) : null}

        {shows("processor") ? (
          <FilterGroup id="processor" title={t("processor")}>
            <OptionLinks
              values={PROCESSOR_OPTIONS}
              active={filters.processor}
              keyName="processor"
              buildHref={buildHref}
              format={specLabel}
            />
          </FilterGroup>
        ) : null}

        {shows("operatingSystem") ? (
          <FilterGroup id="operatingSystem" title={t("operatingSystem")}>
            <OptionLinks
              values={OPERATING_SYSTEM_OPTIONS}
              active={filters.operatingSystem}
              keyName="operatingSystem"
              buildHref={buildHref}
              format={specLabel}
            />
          </FilterGroup>
        ) : null}

        {shows("screenSize") ? (
          <FilterGroup id="screenSize" title={t("screenSize")}>
            <OptionLinks
              values={SCREEN_SIZE_OPTIONS}
              active={filters.screenSize}
              keyName="screenSize"
              buildHref={buildHref}
              format={specLabel}
            />
          </FilterGroup>
        ) : null}

        {shows("connectivity") ? (
          <FilterGroup id="connectivity" title={t("connectivity")}>
            <OptionLinks
              values={CONNECTIVITY_OPTIONS}
              active={filters.connectivity}
              keyName="connectivity"
              buildHref={buildHref}
              format={specLabel}
            />
          </FilterGroup>
        ) : null}

        {shows("accessoryType") ? (
          <FilterGroup id="accessoryType" title={t("accessoryType")}>
            <OptionLinks
              values={ACCESSORY_TYPE_OPTIONS}
              active={filters.accessoryType}
              keyName="accessoryType"
              buildHref={buildHref}
              format={specLabel}
            />
          </FilterGroup>
        ) : null}

        {shows("compatibility") ? (
          <FilterGroup id="compatibility" title={t("compatibility")}>
            <OptionLinks
              values={COMPATIBILITY_OPTIONS}
              active={filters.compatibility}
              keyName="compatibility"
              buildHref={buildHref}
              format={specLabel}
            />
          </FilterGroup>
        ) : null}

        {shows("batteryHealthMin") ? (
          <FilterGroup id="batteryHealth" title={t("batteryHealth")}>
            <BatteryHealthFilter
              key={filters.batteryHealthMin ?? "any"}
              value={filters.batteryHealthMin}
              onApply={onApply}
            />
          </FilterGroup>
        ) : null}

        {showPakistanSignals && (shows("ptaStatus") || shows("cpidStatus")) ? (
          <>
            {shows("ptaStatus") ? (
              <FilterGroup id="ptaStatus" title={t("ptaStatus")}>
                <StatusLinks
                  values={Object.values(PTA_STATUS)}
                  active={filters.ptaStatus}
                  buildHref={buildHref}
                  keyName="ptaStatus"
                  translate={(value) => tStatus(value)}
                />
              </FilterGroup>
            ) : null}
            {shows("cpidStatus") ? (
              <FilterGroup id="cpidStatus" title={t("cpidStatus")}>
                <StatusLinks
                  values={Object.values(CPID_STATUS)}
                  active={filters.cpidStatus}
                  buildHref={buildHref}
                  keyName="cpidStatus"
                  translate={(value) => tStatus(value)}
                />
              </FilterGroup>
            ) : null}
          </>
        ) : null}

        {shows("warranty") ? (
          <FilterGroup id="warranty" title={t("warranty")}>
            <StatusLinks
              values={Object.values(WARRANTY_TYPE)}
              active={filters.warranty}
              buildHref={buildHref}
              keyName="warranty"
              translate={(value) => tStatus(value)}
            />
          </FilterGroup>
        ) : null}

        <FilterGroup id="trust" title={t("trust")}>
          <ul className="space-y-0.5">
            <TrustLink
              label={t("inspectedOnly")}
              active={filters.isInspected}
              buildHref={buildHref}
              keyName="isInspected"
            />
            <TrustLink
              label={t("verifiedSellersOnly")}
              active={filters.isVerifiedSeller}
              buildHref={buildHref}
              keyName="isVerifiedSeller"
            />
            <TrustLink
              label={t("dealersOnly")}
              active={filters.isDealer}
              buildHref={buildHref}
              keyName="isDealer"
            />
          </ul>
        </FilterGroup>
      </div>
    </FilterGroupContext.Provider>
  );
}

function TrustLink({
  label,
  active,
  buildHref,
  keyName,
}: {
  label: string;
  active?: boolean;
  buildHref: (patch: Record<string, string | null>) => string;
  keyName: string;
}) {
  return (
    <li>
      <Link
        href={buildHref({ [keyName]: active ? null : "true" })}
        className={cn(
          "hover:bg-accent block rounded-md px-2 py-1.5",
          active && "bg-accent font-medium",
        )}
      >
        {label}
      </Link>
    </li>
  );
}
