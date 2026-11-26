import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  LISTING_STATUSES,
  LISTING_STATUS_LABELS,
  ROUTES,
  type ListingStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { getListings } from "@/features/admin/services/admin.service";
import { AdminSearch } from "@/features/admin/components/admin-search";
import { AdminListingRow } from "@/features/admin/components/admin-listing-row";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin — Listings",
  robots: { index: false, follow: false },
};

const FILTERS: Array<{ label: string; status?: ListingStatus }> = [
  { label: "All" },
  { label: LISTING_STATUS_LABELS.PENDING_APPROVAL, status: LISTING_STATUSES.PENDING_APPROVAL },
  { label: LISTING_STATUS_LABELS.ACTIVE, status: LISTING_STATUSES.ACTIVE },
  { label: LISTING_STATUS_LABELS.REJECTED, status: LISTING_STATUSES.REJECTED },
  { label: LISTING_STATUS_LABELS.SOLD, status: LISTING_STATUSES.SOLD },
  { label: LISTING_STATUS_LABELS.DRAFT, status: LISTING_STATUSES.DRAFT },
  { label: LISTING_STATUS_LABELS.EXPIRED, status: LISTING_STATUSES.EXPIRED },
];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | string[] | undefined): number {
  const n = Number(firstParam(value));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function parseStatus(value: string | string[] | undefined): ListingStatus | undefined {
  const raw = firstParam(value);
  return raw && raw in LISTING_STATUSES ? (raw as ListingStatus) : undefined;
}

function parseRegion(value: string | string[] | undefined): "BAHRAIN" | "PAKISTAN" | "ALL" | undefined {
  const raw = firstParam(value);
  if (raw === "BAHRAIN" || raw === "PAKISTAN" || raw === "ALL") return raw;
  return undefined;
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const sp = await searchParams;
  const q = firstParam(sp.q);
  const status = parseStatus(sp.status);
  const region = parseRegion(sp.region);
  const page = parsePage(sp.page);
  const result = await getListings({ q, status, region, page });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
            Marketplace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Listings
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Review inventory, moderate submissions, and manage listing status.
          </p>
        </div>
        <AdminSearch placeholder="Search by title…" />
      </header>

      <section
        aria-label="Listing filters"
        className="rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-3 sm:p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-300">
            {result.total.toLocaleString()} {result.total === 1 ? "listing" : "listings"}
          </p>
          <p className="text-xs text-slate-500">Filter by status</p>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => {
            const href = f.status
              ? `${ROUTES.adminListings}?status=${f.status}${q ? `&q=${encodeURIComponent(q)}` : ""}`
              : q
                ? `${ROUTES.adminListings}?q=${encodeURIComponent(q)}`
                : ROUTES.adminListings;
            const active = f.status === status || (!f.status && !status);
            return (
              <Link
                key={f.label}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 shrink-0 items-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none",
                  active
                    ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                    : "border-white/[0.07] text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section
        aria-label="Region filter"
        className="rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-3 sm:p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-300">Filter by region</p>
          <p className="text-xs text-slate-500">All regions shown by default</p>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {["ALL", "BAHRAIN", "PAKISTAN"].map((r) => {
            const href =
              r === "ALL"
                ? `${ROUTES.adminListings}${status ? `?status=${status}` : ""}${q ? `${status ? "&" : "?"}q=${encodeURIComponent(q)}` : ""}`
                : `${ROUTES.adminListings}?region=${r}${status ? `&status=${status}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
            const active = (r === "ALL" && !region) || region === r;
            const label = r === "ALL" ? "All Regions" : r === "BAHRAIN" ? "BH Bahrain" : "PK Pakistan";
            return (
              <Link
                key={r}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-9 shrink-0 items-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none",
                  active
                    ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                    : "border-white/[0.07] text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </section>

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#1F1F1F]/60 px-5 py-12 text-center">
          <Package className="mx-auto size-6 text-slate-500" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-200">No listings found</p>
          <p className="mt-1 text-xs text-slate-500">Try another status or adjust your search.</p>
          {(q || status) && (
            <Link
              href={ROUTES.adminListings}
              className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <section
          aria-label="Listings"
          className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-[#1F1F1F]"
        >
          {result.items.map((listing) => (
            <AdminListingRow key={listing.id} listing={listing} />
          ))}
        </section>
      )}

      <AdminPagination page={result.page} totalPages={result.totalPages} />
    </div>
  );
}
