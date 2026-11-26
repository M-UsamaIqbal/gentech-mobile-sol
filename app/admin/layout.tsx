import { redirect } from "next/navigation";

import { MobileAppNav } from "@/components/layout/mobile-app-nav";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { ROUTES } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Authoritative authorization boundary for all `/admin` routes. The edge proxy does
 * an optimistic auth-cookie check; this layout enforces the ADMIN role before render.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  return (
    <div className="dark flex min-h-svh flex-col bg-[#181818] md:flex-row">
      <AdminNav />
      <div className="min-w-0 flex-1">
        <AdminTopbar name={admin.name} />
        <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-7 sm:py-7">{children}</main>
      </div>
      <MobileAppNav isAuthenticated />
    </div>
  );
}
