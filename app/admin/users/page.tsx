import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { getUsers } from "@/features/admin/services/admin.service";
import { AdminSearch } from "@/features/admin/components/admin-search";
import { AdminUserRow } from "@/features/admin/components/admin-user-row";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin — Users",
  robots: { index: false, follow: false },
};

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const sp = await searchParams;
  const q = firstParam(sp.q);
  const page = parsePage(sp.page);
  const result = await getUsers({ q, page });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
            Marketplace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Customers
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Review customer accounts, activity, and access status.
          </p>
        </div>
        <AdminSearch placeholder="Search name or email…" />
      </header>

      {result.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#1F1F1F]/60 px-5 py-12 text-center">
          <Users className="mx-auto size-6 text-slate-500" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-200">No customers found</p>
          <p className="mt-1 text-xs text-slate-500">Try a different name or email address.</p>
        </div>
      ) : (
        <section
          aria-label={`${result.total.toLocaleString()} customer accounts`}
          className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-[#1F1F1F]"
        >
          <div className="border-b border-white/[0.07] px-4 py-3 text-xs font-medium text-slate-400">
            {result.total.toLocaleString()} {result.total === 1 ? "customer" : "customers"}
          </div>
          {result.items.map((user) => (
            <AdminUserRow key={user.id} user={user} selfId={admin.id} />
          ))}
        </section>
      )}

      <AdminPagination page={result.page} totalPages={result.totalPages} />
    </div>
  );
}
