import Link from "next/link";
import { Plus, ShieldCheck, Smartphone } from "lucide-react";

import { ROUTES, USER_ROLES, type UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getCurrentSession } from "@/lib/session";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "@/features/notifications/services/notification.service";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { SearchBar } from "@/features/marketplace/components/search-bar";
import { getCategoriesWithCounts } from "@/features/marketplace/services/category.service";

/**
 * Global marketplace header. Server component — reads the session once and renders
 * either the signed-out actions or the user menu. Search + mobile drawer are client.
 */
export async function SiteHeader() {
  const session = await getCurrentSession();
  const user = session?.user;

  const [categories, [unreadNotifications, recentNotifications]] = await Promise.all([
    getCategoriesWithCounts(),
    user
      ? Promise.all([getUnreadNotificationCount(user.id), getNotifications(user.id, 6)])
      : Promise.resolve([0, []] as [number, Awaited<ReturnType<typeof getNotifications>>]),
  ]);

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <MobileNav categories={categories} isAuthenticated={Boolean(user)} />

        <Logo className="shrink-0" />

        {/* Desktop search */}
        <div className="mx-2 hidden flex-1 md:block">
          <SearchBar variant="compact" />
        </div>

        <nav className="ml-auto flex items-center gap-1.5 md:ml-0">
          <Link
            href={ROUTES.sellPhone}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden lg:inline-flex",
            )}
          >
            <Smartphone className="size-4" />
            Sell Phone
          </Link>

          <Link
            href={ROUTES.inspectionService}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden lg:inline-flex",
            )}
          >
            <ShieldCheck className="size-4" />
            Inspection
          </Link>

          <Link
            href={ROUTES.sell}
            className={cn(buttonVariants({ size: "sm" }), "hidden rounded-full sm:inline-flex")}
          >
            <Plus className="size-4" />
            Post Ad
          </Link>

          <ThemeToggle />

          {user ? (
            <NotificationBell
              initialCount={unreadNotifications}
              initialItems={recentNotifications}
            />
          ) : null}

          {user ? (
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              role={(user.role as UserRole | undefined) ?? USER_ROLES.USER}
            />
          ) : (
            <Link
              href={ROUTES.signIn}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "hidden sm:inline-flex",
              )}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile search row */}
      <div className="border-t px-4 py-2 md:hidden">
        <SearchBar variant="compact" />
      </div>
    </header>
  );
}
