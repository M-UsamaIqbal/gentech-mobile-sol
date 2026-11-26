import Link from "next/link";
import { redirect } from "next/navigation";

import { APP, ROUTES } from "@/lib/constants";
import { getCurrentSession } from "@/lib/session";

/**
 * Shared shell for all auth screens. Signed-in users are bounced to the dashboard.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (session) redirect(ROUTES.dashboard);

  return (
    <main id="main-content" className="bg-muted/30 flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          href={ROUTES.home}
          className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md text-sm font-bold">
            {APP.name.charAt(0)}
          </span>
          {APP.name}
        </Link>
        {children}
      </div>
    </main>
  );
}
