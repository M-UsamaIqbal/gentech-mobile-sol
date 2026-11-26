import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { requireInspector } from "@/features/inspections/lib/require-inspector";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileProfileCard } from "@/components/layout/mobile-profile-card";
import { MobileWorkspaceHeader } from "@/components/layout/mobile-workspace-header";

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
      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <MobileWorkspaceHeader />
        <div className="mb-4 md:hidden">
          <MobileProfileCard
            name={inspector.name}
            email={inspector.email}
            image={inspector.image}
            role={inspector.role ?? "INSPECTOR"}
            badgeLabel="Inspector workspace"
            title={inspector.name}
            description={inspector.email}
          />
        </div>
        <div className="mb-6 hidden items-center gap-2 md:flex">
          <ShieldCheck className="text-primary size-6" />
          <Link href={ROUTES.inspector} className="heading-5">
            Inspector Workspace
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
