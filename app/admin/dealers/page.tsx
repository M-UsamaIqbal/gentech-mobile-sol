import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, Store, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminDealerReviewRow } from "@/features/admin/components/admin-dealer-review-row";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { getDealerReviewQueueData } from "@/features/dealer/services/dealer.service";
import type { DealerDto } from "@/features/dealer/types";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dealers — Admin",
  robots: { index: false, follow: false },
};

const filters: Array<{
  label: string;
  value: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "ALL";
}> = [
  { label: "Pending", value: "PENDING" },
  { label: "Active", value: "ACTIVE" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "All", value: "ALL" },
];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value: string | undefined): DealerDto["status"] | undefined {
  if (value === "ACTIVE" || value === "PENDING" || value === "REJECTED" || value === "SUSPENDED") {
    return value;
  }
  return value === "ALL" ? undefined : "PENDING";
}

export default async function AdminDealersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const params = await searchParams;
  const q = firstParam(params.q)?.trim().slice(0, 100);
  const status = parseStatus(firstParam(params.status));
  const selectedFilter = status ?? "ALL";
  const { items, counts } = await getDealerReviewQueueData({ status, q });

  const metrics = [
    { label: "Pending review", value: counts.PENDING, icon: Clock3, style: "text-amber-300" },
    {
      label: "Active & verified",
      value: counts.ACTIVE,
      icon: CheckCircle2,
      style: "text-emerald-300",
    },
    { label: "Rejected", value: counts.REJECTED, icon: XCircle, style: "text-rose-300" },
    {
      label: "All dealer profiles",
      value: Object.values(counts).reduce((a, b) => a + b, 0),
      icon: Store,
      style: "text-slate-300",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
            Marketplace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Dealer verification
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Review business details, approve eligible stores, or send an actionable reason when an
            application needs changes.
          </p>
        </div>
        <form action={ROUTES.adminDealers} className="flex w-full gap-2 sm:w-auto">
          <input type="hidden" name="status" value={selectedFilter} />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search stores, email, city…"
            className="min-h-10 border-white/10 bg-[#1F1F1F] text-white placeholder:text-slate-500 sm:w-64"
          />
          <Button type="submit" variant="outline" className="min-h-10 border-white/10">
            Search
          </Button>
        </form>
      </header>

      <section aria-label="Dealer metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, style }) => (
          <div key={label} className="rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-400">{label}</p>
              <Icon className={cn("size-4", style)} aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-100">{value.toLocaleString()}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#1F1F1F]">
        <div className="border-b border-white/[0.07] p-3 sm:p-4">
          <nav
            aria-label="Dealer status filters"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {filters.map((filter) => {
              const href = new URLSearchParams();
              href.set("status", filter.value);
              if (q) href.set("q", q);
              const query = href.toString();
              const active = selectedFilter === filter.value;
              return (
                <Link
                  key={filter.value}
                  href={`${ROUTES.adminDealers}${query ? `?${query}` : ""}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-9 shrink-0 items-center rounded-lg border px-3 text-xs font-medium transition-colors",
                    active
                      ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                      : "border-white/[0.07] text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                  )}
                >
                  {filter.label}
                  {filter.value !== "ALL" ? (
                    <span className="ml-2 text-xs opacity-70">{counts[filter.value]}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-slate-400">
          <span>
            {items.length.toLocaleString()} {items.length === 1 ? "dealer" : "dealers"}
            {items.length === 100 ? " · showing latest 100" : ""}
          </span>
          <span>Review status: {selectedFilter.toLowerCase()}</span>
        </div>
        <div>
          {items.length > 0 ? (
            items.map((dealer) => <AdminDealerReviewRow key={dealer.id} dealer={dealer} />)
          ) : (
            <div className="px-5 py-14 text-center">
              <Store className="mx-auto size-8 text-slate-600" aria-hidden="true" />
              <h2 className="mt-3 text-sm font-semibold text-slate-200">
                No dealer applications found
              </h2>
              <p className="mt-1 text-xs text-slate-500">Try another status or search term.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
