import Link from "next/link";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import type { CountryCode } from "@/lib/countries/types";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { getPendingVerifications } from "@/features/seller-verification/services/seller-verification.service";

export default async function AdminSellerVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const sp = await searchParams;
  const country = (sp.country as string) || "PK";
  const countryCode: CountryCode = country === "BH" ? "BH" : "PK";

  const verifications = await getPendingVerifications(countryCode);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Seller Verifications</h1>
        <p className="text-sm text-slate-400">
          Review and approve seller verification applications.
        </p>
      </header>

      {/* Country filter */}
      <div className="flex gap-2">
        <Link
          href="/admin/seller-verifications?country=BH"
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
            country === "BH"
              ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
              : "border-white/[0.07] text-slate-400"
          }`}
        >
          🇧🇭 Bahrain
        </Link>
        <Link
          href="/admin/seller-verifications?country=PK"
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
            country === "PK"
              ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
              : "border-white/[0.07] text-slate-400"
          }`}
        >
          🇵🇰 Pakistan
        </Link>
      </div>

      {verifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#1F1F1F]/60 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-slate-200">No pending verifications</p>
          <p className="mt-1 text-xs text-slate-500">All applications have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <div
              key={v.id}
              className="rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">Seller: {v.sellerId}</p>
                  <p className="text-xs text-slate-400">
                    Submitted: {new Date(v.createdAt).toLocaleDateString()}
                  </p>
                  {v.documents ? (
                    <div className="mt-2">
                      <p className="text-xs text-slate-400">Documents:</p>
                      <pre className="mt-1 text-xs text-slate-300">
                        {JSON.stringify(v.documents, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <form action="/api/seller-verification/review" method="POST">
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Approve
                    </button>
                  </form>
                  <form action="/api/seller-verification/review" method="POST">
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button
                      type="submit"
                      className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}