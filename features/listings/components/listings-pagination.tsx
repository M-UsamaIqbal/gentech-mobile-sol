"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useListingHref } from "@/features/listings/hooks/use-listing-href";

function pageWindow(current: number, total: number): number[] {
  const span = 1;
  const pages = new Set<number>([1, total, current]);
  for (let i = current - span; i <= current + span; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  return [...pages].sort((a, b) => a - b);
}

export function ListingsPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const buildHref = useListingHref();
  const t = useTranslations("pagination");
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);
  const linkCls = (active = false) =>
    cn(
      buttonVariants({ variant: active ? "default" : "outline", size: "icon-sm" }),
      "min-w-9",
      active && "pointer-events-none",
    );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label={t("aria")}>
      <Link
        href={buildHref({ page: String(page - 1) }, { resetPage: false })}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          page <= 1 && "pointer-events-none opacity-50",
        )}
        aria-disabled={page <= 1}
        aria-label={t("previous")}
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </Link>

      {pages.map((currentPage, index) => {
        const previous = pages[index - 1];
        const gap = previous !== undefined && currentPage - previous > 1;
        return (
          <span key={currentPage} className="flex items-center gap-1.5">
            {gap ? <span className="text-muted-foreground px-1">…</span> : null}
            <Link
              href={buildHref({ page: String(currentPage) }, { resetPage: false })}
              className={linkCls(currentPage === page)}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {currentPage}
            </Link>
          </span>
        );
      })}

      <Link
        href={buildHref({ page: String(page + 1) }, { resetPage: false })}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          page >= totalPages && "pointer-events-none opacity-50",
        )}
        aria-disabled={page >= totalPages}
        aria-label={t("next")}
      >
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Link>
    </nav>
  );
}
