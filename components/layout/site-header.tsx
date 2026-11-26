import { LayoutGrid, Plus, ShieldCheck, Smartphone, User } from "lucide-react";

import { ActiveLocalizedLink } from "@/components/layout/active-localized-link";

import { APP, ROUTES, USER_ROLES, type UserRole } from "@/lib/constants";
import { getRegionForCountry, getRequestCountryLocale } from "@/lib/countries/server";
import { getServerTranslations } from "@/lib/i18n/get-server-translations";
import { cn } from "@/lib/utils";
import { LocalizedLink } from "@/components/localized-link";
import { getCurrentSession } from "@/lib/session";
import {
  getNotifications,
  getUnreadNotificationCount,
} from "@/features/notifications/services/notification.service";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CountryLocaleSelector } from "@/components/country-locale-selector";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileAppNav } from "@/components/layout/mobile-app-nav";
import { MobileProfileChip } from "@/components/layout/mobile-profile-chip";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { SearchBar } from "@/features/marketplace/components/search-bar";
import { getDemoCategories } from "@/features/marketplace/data/fixtures";
import { getActiveLocationTree } from "@/features/locations/services/location.service";

/** Global marketplace header with a compact search rail and country scoped categories. */
export async function SiteHeader() {
  const session = await getCurrentSession();
  const user = session?.user;
  const t = await getServerTranslations("navigation");
  const tCategories = await getServerTranslations("categories");
  const { country } = await getRequestCountryLocale();
  const categories = getDemoCategories(getRegionForCountry(country));

  const [unreadNotifications, recentNotifications, locations] = await Promise.all([
    user ? getUnreadNotificationCount(user.id) : Promise.resolve(0),
    user ? getNotifications(user.id, 6) : Promise.resolve([]),
    getActiveLocationTree(country),
  ]);

  return (
    <header className="sticky top-0 z-40 md:top-2 md:mx-auto md:mt-2 md:w-[calc(100%-1.5rem)] md:max-w-7xl">
      {/* Phone app bar. The desktop header below is byte-for-byte unchanged at md+. */}
      <div
        className="border-border/70 bg-background/95 border-b shadow-sm backdrop-blur-xl md:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-14 items-center gap-2 px-3">
          <MobileNav categories={categories} isAuthenticated={Boolean(user)} />

          <LocalizedLink
            href={ROUTES.home}
            aria-label={APP.name}
            className="bg-brand text-brand-foreground grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold"
          >
            {APP.name.charAt(0)}
          </LocalizedLink>

          <div className="min-w-0 flex-1">
            <SearchBar variant="compact" locations={locations} />
          </div>

          {user ? (
            <>
              <NotificationBell
                initialCount={unreadNotifications}
                initialItems={recentNotifications}
              />
              <MobileProfileChip
                name={user.name}
                image={user.image}
                label={t("account")}
              />
            </>
          ) : (
            <LocalizedLink
              href={ROUTES.signIn}
              aria-label={t("signIn")}
              className="text-muted-foreground grid size-9 shrink-0 place-items-center"
            >
              <User aria-hidden="true" className="size-5" />
            </LocalizedLink>
          )}
        </div>
      </div>

      <div className="hidden md:block">
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/90 shadow-lg shadow-foreground/5 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-4">
            <MobileNav categories={categories} isAuthenticated={Boolean(user)} />

            <LocalizedLink
              href={ROUTES.home}
              className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
            >
              <span className="bg-brand text-brand-foreground grid size-9 place-items-center rounded-lg text-base font-semibold shadow-sm">
                {APP.name.charAt(0)}
              </span>
              <span className="hidden text-lg sm:inline">{APP.name}</span>
            </LocalizedLink>

            <span aria-hidden="true" className="mx-1 hidden h-8 w-px bg-border lg:block" />

            <nav aria-label={t("navigation")} className="hidden items-center gap-1 lg:flex">
              <ActiveLocalizedLink
                href={ROUTES.marketplace}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-2 px-3 font-medium hover:text-brand",
                )}
              >
                <LayoutGrid className="size-4" />
                {t("marketplace")}
              </ActiveLocalizedLink>
              <ActiveLocalizedLink
                href={ROUTES.sellPhone}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-2 px-3 font-medium hover:text-brand",
                )}
              >
                <Smartphone className="size-4" />
                Sell Phone
              </ActiveLocalizedLink>
              <ActiveLocalizedLink
                href={ROUTES.inspectionService}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-2 px-3 font-medium hover:text-brand",
                )}
              >
                <ShieldCheck className="size-4" />
                {t("inspection")}
              </ActiveLocalizedLink>
            </nav>

            <div className="mx-1 hidden min-w-0 flex-1 md:block lg:max-w-xl">
              <SearchBar variant="compact" locations={locations} />
            </div>

            <nav aria-label={t("account")} className="ms-auto flex items-center gap-1.5">
              <LocalizedLink
                href={ROUTES.sell}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "hidden gap-2 rounded-lg bg-brand px-3 text-brand-foreground hover:bg-brand/90 sm:inline-flex",
                )}
              >
                <Plus className="size-4" />
                {t("sell")}
              </LocalizedLink>

              <CountryLocaleSelector />
              <ThemeToggle />

              {user ? (
                <NotificationBell
                  initialCount={unreadNotifications}
                  initialItems={recentNotifications}
                />
              ) : null}

              {user ? (
                <UserMenu
                  userId={user.id}
                  name={user.name}
                  email={user.email}
                  image={user.image}
                  role={(user.role as UserRole | "DEALER" | undefined) ?? USER_ROLES.USER}
                />
              ) : (
                <LocalizedLink
                  href={ROUTES.signIn}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "hidden rounded-lg font-medium hover:text-brand sm:inline-flex",
                  )}
                >
                  {t("signIn")}
                </LocalizedLink>
              )}
            </nav>
          </div>

          <div className="hidden items-center gap-4 border-t border-border/60 px-4 py-2 lg:flex">
            <LocalizedLink
              href={ROUTES.categories}
              className="caption-3 text-brand flex shrink-0 items-center gap-1.5 font-semibold hover:underline"
            >
              <LayoutGrid className="size-4" />
              {t("categories")}
            </LocalizedLink>
            <span aria-hidden="true" className="h-4 w-px bg-border" />
            <nav aria-label={t("categories")} className="flex min-w-0 flex-1 items-center gap-5">
              {categories.slice(0, 8).map((category) => (
                <LocalizedLink
                  key={category.id}
                  href={`/marketplace?category=${category.slug}`}
                  className="caption-4 text-muted-foreground hover:text-brand truncate transition-colors"
                >
                  {tCategories.has(category.slug) ? tCategories(category.slug) : category.name}
                </LocalizedLink>
              ))}
            </nav>
            <LocalizedLink
              href={ROUTES.inspectionService}
              className="caption-4 text-muted-foreground hover:text-brand shrink-0 transition-colors"
            >
              {t("inspection")}
            </LocalizedLink>
          </div>

          <div className="border-t border-border/60 px-3 py-2 md:hidden">
            <SearchBar variant="compact" locations={locations} />
          </div>
        </div>
      </div>

      <MobileAppNav isAuthenticated={Boolean(user)} />
    </header>
  );
}
