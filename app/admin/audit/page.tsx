import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAuditLogs } from "@/features/audit/repositories/audit.repository";

export const metadata: Metadata = {
  title: "Audit trail — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedLimit = Number(Array.isArray(params.limit) ? params.limit[0] : params.limit);
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 50;
  const action = Array.isArray(params.action) ? params.action[0] : params.action;
  if (action && action.length > 100) notFound();

  const result = await getAuditLogs({ limit, action });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-400 uppercase">
            Governance
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Audit trail</h1>
          <p className="mt-2 text-sm text-slate-400">
            Recent recorded administrative and security events.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-[#1F1F1F] px-3 py-1.5 text-xs text-slate-300">
          {result.total.toLocaleString()} matching events
        </span>
      </header>

      <form
        className="flex flex-wrap items-end gap-3 rounded-xl border border-white/10 bg-[#1F1F1F] p-4"
        method="get"
      >
        <label className="flex min-w-56 flex-1 flex-col gap-1.5 text-xs text-slate-400">
          Action filter
          <input
            name="action"
            defaultValue={action}
            maxLength={100}
            placeholder="e.g. USER_ROLE_CHANGED"
            className="h-9 rounded-lg border border-white/10 bg-[#181818] px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-400/50 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="h-9 rounded-lg bg-emerald-400 px-4 text-xs font-semibold text-slate-950"
        >
          Filter
        </button>
      </form>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1F1F1F]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-white/[0.07] text-slate-500">
              <tr>
                {["Time", "Actor", "Action", "Resource", "Reference"].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {result.items.map((entry) => (
                <tr key={entry.id} className="text-slate-300">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                    {new Intl.DateTimeFormat("en-PK", {
                      dateStyle: "medium",
                      timeStyle: "medium",
                      timeZone: "UTC",
                    }).format(new Date(entry.timestamp))}
                  </td>
                  <td className="px-4 py-3">{entry.actorName}</td>
                  <td className="px-4 py-3 font-medium text-slate-100">{entry.action}</td>
                  <td className="px-4 py-3">{entry.resource}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {entry.resourceId ? `${entry.resourceId.slice(0, 10)}…` : "—"}
                  </td>
                </tr>
              ))}
              {result.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-slate-300">No audit events found</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Recorded events will appear here when available.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-white/[0.07] px-4 py-3 text-xs text-slate-500">
          Showing up to {limit} newest events. Sensitive before/after payloads, IP addresses, and
          user agents are intentionally not displayed.
        </p>
      </section>
    </div>
  );
}
