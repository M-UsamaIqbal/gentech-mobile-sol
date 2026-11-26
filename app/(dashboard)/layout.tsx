import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { getCurrentSession } from "@/lib/session";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileWorkspaceHeader } from "@/components/layout/mobile-workspace-header";

/**
 * Authoritative auth boundary for all dashboard routes. The edge middleware does an
 * optimistic cookie check; this layout verifies the real session before rendering.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.signIn);

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <MobileWorkspaceHeader />
        {children}
      </main>
    </div>
  );
}
