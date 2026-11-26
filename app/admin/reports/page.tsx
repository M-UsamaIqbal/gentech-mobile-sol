import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { REPORT_STATUSES, REPORT_STATUS_LABELS, ROUTES, type ReportStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { getReports } from "@/features/admin/services/admin.service";
import { AdminReportRow } from "@/features/admin/components/admin-report-row";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { Flag } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin — Reports",
  robots: { index: false, follow: false },
};

const FILTERS: Array<{ label: string; status?: ReportStatus }> = [
  { label: "All" },
  { label: REPORT_STATUS_LABELS.OPEN, status: REPORT_STATUSES.OPEN },
  { label: REPORT_STATUS_LABELS.REVIEWING, status: REPORT_STATUSES.REVIEWING },
  { label: REPORT_STATUS_LABELS.RESOLVED, status: REPORT_STATUSES.RESOLVED },
  { label: REPORT_STATUS_LABELS.DISMISSED, status: REPORT_STATUSES.DISMISSED },
];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | string[] | undefined): number {
  const n = Number(firstParam(value));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function parseStatus(value: string | string[] | undefined): ReportStatus | undefined {
  const raw = firstParam(value);
  return raw && raw in REPORT_STATUSES ? (raw as ReportStatus) : undefined;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const sp = await searchParams;
  const status = parseStatus(sp.status);
  const page = parsePage(sp.page);
  const result = await getReports({ status, page });

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
          Trust &amp; safety
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-slate-400">
          Review reported listings and accounts, and track each case to resolution.
        </p>
      </header>

      <section
        aria-label="Report filters"
        className="rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-3 sm:p-4"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-300">
            {result.total.toLocaleString()} {result.total === 1 ? "report" : "reports"}
          </p>
          <p className="text-xs text-slate-500">Filter by case status</p>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => {
            const href = f.status
              ? `${ROUTES.adminReports}?status=${f.status}`
              : ROUTES.adminReports;
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

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#1F1F1F]/60 px-5 py-12 text-center">
          <Flag className="mx-auto size-6 text-slate-500" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-200">No reports in this view</p>
          <p className="mt-1 text-xs text-slate-500">
            Try another status filter. New reports will appear here.
          </p>
        </div>
      ) : (
        <section
          aria-label="Reports"
          className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-[#1F1F1F]"
        >
          {result.items.map((report) => (
            <AdminReportRow key={report.id} report={report} />
          ))}
        </section>
      )}

      <AdminPagination page={result.page} totalPages={result.totalPages} />
    </div>
  );
}
