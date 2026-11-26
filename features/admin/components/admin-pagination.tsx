"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/** Path-agnostic pager: preserves existing query params and only swaps `page`. */
export function AdminPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (totalPages <= 1) return null;

  function hrefFor(target: number): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <nav
      className="mt-5 flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/[0.07] bg-[#1F1F1F] px-3 py-3"
      aria-label="Pagination"
    >
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        aria-label="Previous page"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "min-h-9",
          page <= 1 && "pointer-events-none opacity-50",
        )}
      >
        <ChevronLeft className="size-4" />
        Prev
      </Link>
      <span className="text-center text-xs text-slate-400" aria-live="polite">
        Page <span className="font-semibold text-slate-100">{page}</span> of{" "}
        <span className="font-semibold text-slate-100">{totalPages}</span>
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        tabIndex={page >= totalPages ? -1 : undefined}
        aria-label="Next page"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "min-h-9",
          page >= totalPages && "pointer-events-none opacity-50",
        )}
      >
        Next
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
