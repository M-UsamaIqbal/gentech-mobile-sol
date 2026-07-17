import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { requireInspector } from "@/features/inspections/lib/require-inspector";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Authorization boundary for the `/inspector` workspace. Only users with the
 * INSPECTOR (or ADMIN) role may enter; everyone else is bounced to their dashboard.
 */
export default async function InspectorLayout({ children }: { children: React.ReactNode }) {
  const inspector = await requireInspector();
  if (!inspector) redirect(ROUTES.dashboard);

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck className="text-primary size-6" />
          <Link href={ROUTES.inspector} className="text-2xl font-bold tracking-tight">
            Inspector Workspace
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
