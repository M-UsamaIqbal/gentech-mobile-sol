"use client";

import * as React from "react";
import { ArrowUp, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useScrollState } from "@/hooks/use-scroll-state";
import {
  FILTER_GROUP_IDS,
  PRIMARY_FILTER_GROUPS,
  type FilterGroupId,
} from "@/features/listings/lib/filter-groups";
import type {
  BrandItem,
  CategoryItem,
  ListingFilters,
  ListingFilterOptions,
} from "@/types/marketplace";
import type { LocationTree } from "@/features/locations/services/location.service";
import { MarketplaceFilters } from "./marketplace-filters";

interface Props {
  categories: CategoryItem[];
  brands: BrandItem[];
  filters: ListingFilters;
  locations: LocationTree;
  filterOptions: ListingFilterOptions;
  activeGroups: ReadonlySet<FilterGroupId>;
  activeCount: number;
}

const NO_OVERRIDES: ReadonlyMap<FilterGroupId, boolean> = new Map();

/**
 * Desktop filter rail. While the buyer scrolls down through results it compacts and
 * folds away irrelevant groups; scrolling up restores the full sidebar. Groups with
 * active values and explicit manual toggles always win over the automatic behaviour.
 */
export function AdaptiveFilterSidebar(props: Props) {
  const { activeGroups, activeCount, ...filterProps } = props;
  const t = useTranslations("filters");
  const { direction, hasScrolledPast } = useScrollState(320);
  const category = filterProps.filters.category;
  const [overrideState, setOverrideState] = React.useState<{
    category?: string;
    overrides: ReadonlyMap<FilterGroupId, boolean>;
  }>({ category, overrides: NO_OVERRIDES });

  // Overrides belong to the category being browsed when they were set.
  const overrides = overrideState.category === category ? overrideState.overrides : NO_OVERRIDES;
  const compact = hasScrolledPast && direction === "down";

  const collapsedGroups = React.useMemo(() => {
    const collapsed = new Set<FilterGroupId>();
    if (!compact) return collapsed;

    for (const id of FILTER_GROUP_IDS) {
      const override = overrides.get(id);
      if (override !== undefined) {
        if (override) collapsed.add(id);
      } else if (!PRIMARY_FILTER_GROUPS.has(id) && !activeGroups.has(id)) {
        collapsed.add(id);
      }
    }

    return collapsed;
  }, [compact, overrides, activeGroups]);

  const toggleGroup = React.useCallback(
    (id: FilterGroupId) => {
      const nextCollapsed = !collapsedGroups.has(id);
      setOverrideState((previous) => {
        const current = previous.category === category ? previous.overrides : NO_OVERRIDES;
        const next = new Map(current);
        next.set(id, nextCollapsed);
        return { category, overrides: next };
      });
    },
    [collapsedGroups, category],
  );

  const backToTop = React.useCallback(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, []);

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <div
        className={cn(
          "bg-card sticky top-28 rounded-xl border p-4 transition-[padding,box-shadow] duration-300 motion-reduce:transition-none",
          compact && "p-3 shadow-sm",
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" className="text-brand size-4" />
            <span className="text-sm font-semibold">{t("filters")}</span>
            {activeCount > 0 ? (
              <span className="bg-brand/10 text-brand rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
                {activeCount}
              </span>
            ) : null}
          </div>
          {compact ? (
            <button
              type="button"
              onClick={backToTop}
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] transition-colors motion-reduce:transition-none"
            >
              <ArrowUp aria-hidden="true" className="size-3" />
              {t("scrollTop")}
            </button>
          ) : null}
        </div>

        {compact ? (
          <p className="text-muted-foreground mb-2 text-[11px]">{t("compactHint")}</p>
        ) : null}

        <div
          className={cn(compact && "max-h-[calc(100vh-13rem)] overflow-y-auto overscroll-contain")}
        >
          <MarketplaceFilters
            {...filterProps}
            collapsedGroups={collapsedGroups}
            onToggleGroup={toggleGroup}
          />
        </div>
      </div>
    </aside>
  );
}
