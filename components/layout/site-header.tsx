import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";

import { APP, ROUTES, USER_ROLES, type UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getCurrentSession } from "@/lib/session";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "@/features/notifications/services/notification.service";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { SearchBar } from "@/features/marketplace/components/search-bar";
import { DEMO_CATEGORIES } from "@/features/marketplace/data/fixtures";

/**
 * Global marketplace header. Server component — reads the session once and renders
 * either the signed-out actions or the user menu. Search + mobile drawer are client.
 */
export async function SiteHeader() {
  const session = await getCurrentSession();
  const user = session?.user;

  const [unreadNotifications, recentNotifications] = user
    ? await Promise.all([getUnreadNotificationCount(user.id), getNotifications(user.id, 6)])
    : [0, []];

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <MobileNav categories={DEMO_CATEGORIES} isAuthenticated={Boolean(user)} />

        <Link
          href={ROUTES.home}
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <span className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md text-sm font-bold">
            {APP.name.charAt(0)}
          </span>
          <span className="hidden sm:inline">{APP.name}</span>
        </Link>

        {/* Desktop search */}
        <div className="mx-2 hidden flex-1 md:block">
          <SearchBar variant="compact" />
        </div>

        <nav className="ml-auto flex items-center gap-1.5 md:ml-0">
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
