"use client";

import { useTranslations } from "next-intl";

import { LocalizedLink } from "@/components/localized-link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CategoryItem } from "@/types/marketplace";

/** Horizontally scrollable category shortcuts above the mobile marketplace results. */
export function MobileCategoryChips({
  categories,
  active,
}: {
  categories: CategoryItem[];
  active?: string;
}) {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("navigation");
  const tCategories = useTranslations("categories");

  return (
    <div
      className="-mx-4 mb-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden"
      role="navigation"
      aria-label={tNav("categories")}
    >
      <LocalizedLink
        href={ROUTES.marketplace}
        aria-current={!active ? "page" : undefined}
        className={cn(
          "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none",
          !active
            ? "bg-brand text-brand-foreground border-brand"
            : "bg-card text-muted-foreground hover:text-brand hover:border-brand/60",
        )}
      >
        {tCommon("all")}
      </LocalizedLink>

      {categories.map((category) => {
        const isActive = active === category.slug;
        return (
          <LocalizedLink
            key={category.id}
            href={`${ROUTES.marketplace}?category=${category.slug}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors motion-reduce:transition-none",
              isActive
                ? "bg-brand text-brand-foreground border-brand"
                : "bg-card text-muted-foreground hover:text-brand hover:border-brand/60",
            )}
          >
            {tCategories.has(category.slug) ? tCategories(category.slug) : category.name}
          </LocalizedLink>
        );
      })}
    </div>
  );
}
