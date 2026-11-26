import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowRight, ClipboardCheck } from "lucide-react";

import { ROUTES, USER_ROLES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getInspectorQueue } from "@/features/inspections/services/inspection.service";
import { InspectorQueue } from "@/features/inspections/components/inspector-queue";

export const metadata: Metadata = {
  title: "Inspector Workspace",
  robots: { index: false, follow: false },
};

export default async function InspectorPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  // Admins see every request; inspectors see open + their assigned work.
  const isAdmin = (user.role as string | undefined) === USER_ROLES.ADMIN;
  const requests = await getInspectorQueue(user.id, { all: isAdmin });

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="inspector-welcome"
        className="workspace-hero rounded-2xl border border-white/10 bg-[#181818] p-5 text-white sm:p-8"
      >
        <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="caption-3 inline-flex items-center gap-2 rounded-md border border-sky-300/20 bg-sky-300/10 px-2 py-1 uppercase tracking-wide text-sky-300">
              <ClipboardCheck className="size-3.5" />
              Inspector workspace
            </span>
            <h1
              id="inspector-welcome"
              className="heading-4 mt-4 text-white"
            >
              Make trust part of every deal.
            </h1>
            <p className="body-3 mt-2 max-w-[680px] text-slate-300">
              Welcome, {user.name.split(" ")[0]}. Claim requests, coordinate a visit, and give
              buyers a clear, dependable inspection report.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="#inspection-queue"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-sky-300 px-4 text-sm font-semibold text-slate-950 transition-colors duration-300 hover:bg-sky-200"
            >
              Open queue <ArrowDown className="size-4" />
            </Link>
            <Link
              href={isAdmin ? "/admin/inspections" : ROUTES.dashboard}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white transition-colors duration-300 hover:bg-white/[0.12]"
            >
              {isAdmin ? "Admin panel" : "My dashboard"} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <div className="relative mt-7 flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
          <span className="flex size-10 items-center justify-center rounded-xl border border-sky-300/15 bg-sky-300/10 text-sky-200">
            <ClipboardCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              {requests.length} {requests.length === 1 ? "request" : "requests"} in your view
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {requests.length > 0
                ? "Review the latest device inspections below."
                : "You are all caught up. New requests will appear here."}
            </p>
          </div>
        </div>
      </section>

      <section id="inspection-queue" aria-labelledby="inspection-queue-title" className="space-y-4">
        <div>
          <h2 id="inspection-queue-title" className="heading-6">
            Inspection queue
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Claim open requests, schedule a visit, then submit the graded report.
          </p>
        </div>
        <InspectorQueue requests={requests} inspectorId={user.id} />
      </section>
    </div>
  );
}
