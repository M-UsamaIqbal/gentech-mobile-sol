"use client";

import { useTranslations } from "next-intl";

import { LocalizedLink } from "@/components/localized-link";
import type { CategoryItem } from "@/types/marketplace";
import { CategoryIcon } from "./category-icon";

/** Four-up circular category rail used by the mobile home and categories screens. */
export function MobileCategoryGrid({ categories }: { categories: CategoryItem[] }) {
  const t = useTranslations("categories");

  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-4">
      {categories.map((category) => (
        <LocalizedLink
          key={category.id}
          href={`/marketplace?category=${category.slug}`}
          className="group flex min-w-0 flex-col items-center gap-2 text-center"
        >
          <span className="bg-card group-hover:bg-brand group-hover:border-brand grid size-14 place-items-center rounded-2xl border shadow-sm transition-colors duration-300">
            <CategoryIcon
              name={category.icon}
              className="text-brand group-hover:text-brand-foreground size-6 transition-colors duration-300"
            />
          </span>
          <span className="text-muted-foreground line-clamp-2 text-[11px] leading-tight font-medium">
            {t.has(category.slug) ? t(category.slug) : category.name}
          </span>
        </LocalizedLink>
      ))}
    </div>
  );
}
