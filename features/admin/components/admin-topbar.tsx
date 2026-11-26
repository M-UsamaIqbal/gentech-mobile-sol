"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { ADMIN_NAV_GROUPS } from "@/features/admin/components/admin-nav";

function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AdminTopbar({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const tCommon = useTranslations("common");
  const navItems = ADMIN_NAV_GROUPS.flatMap((group) =>
    group.links.map((item) => ({ ...item, group: group.label })),
  );
  const active = navItems
    .filter((item) =>
      "exact" in item && item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  const isFinanceDetail = pathname.startsWith("/admin/finance/");
  const pageLabel = isFinanceDetail ? titleCase(pathname.split("/").at(-1) ?? "") : active?.label;
  const groupLabel = active?.group ?? "Admin";

  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-[#181818] px-4 sm:px-7 md:min-h-[72px]">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={tCommon("back")}
          className="text-slate-300 grid size-8 shrink-0 place-items-center rounded-lg hover:bg-white/10 md:hidden"
        >
          <ArrowLeft aria-hidden="true" className="size-5 rtl:rotate-180" />
        </button>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
        >
          <Link href="/admin" className="transition-colors hover:text-slate-300">
            GenTech
          </Link>
          <span aria-hidden="true">/</span>
          <span>{groupLabel}</span>
        </nav>
        <p className="mt-1 truncate text-sm font-semibold text-slate-100">
          {pageLabel ?? "Admin workspace"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
        <span className="max-w-24 truncate text-xs font-semibold text-slate-200 sm:hidden">
          {name}
        </span>
        <span className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-200 sm:inline-flex">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Admin workspace
        </span>
        <span className="hidden text-right sm:block">
          <span className="block text-xs font-semibold text-slate-200">{name}</span>
          <span className="block text-xs text-slate-500">Administrator</span>
        </span>
        <span
          role="img"
          aria-label={`Signed in as ${name}`}
          className="flex size-9 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/15 text-xs font-bold text-emerald-200"
        >
          {name.trim().slice(0, 1).toUpperCase() || "A"}
        </span>
      </div>
    </header>
  );
}
