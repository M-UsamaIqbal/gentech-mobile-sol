"use client";

import { Home, LayoutGrid, MessageSquare, Plus, User, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { LocalizedLink } from "@/components/localized-link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  mobileNavKeyForPath,
  type MobileAppNavKey,
} from "@/features/marketplace/lib/mobile-app-navigation";

type Tab = {
  key: MobileAppNavKey;
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
};

/** Alibaba-style five-tab bar shown only below the desktop header breakpoint. */
export function MobileAppNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const active = mobileNavKeyForPath(pathname);

  const tabs: Tab[] = [
    { key: "home", href: ROUTES.home, label: t("home"), icon: Home },
    { key: "categories", href: ROUTES.categories, label: t("categories"), icon: LayoutGrid },
    { key: "sell", href: ROUTES.sell, label: t("sell"), icon: Plus, primary: true },
    {
      key: "messages",
      href: ROUTES.messages,
      label: t("messages"),
      icon: MessageSquare,
    },
    {
      key: "account",
      href: isAuthenticated ? ROUTES.dashboard : ROUTES.signIn,
      label: isAuthenticated ? t("account") : t("signIn"),
      icon: User,
    },
  ];

  return (
    <nav
      aria-label={t("navigation")}
      className="mobile-app-nav border-border/70 bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t shadow-[0_-4px_18px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;

          return (
            <li key={tab.key} className="min-w-0">
              <LocalizedLink
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 px-1 text-[11px] leading-none font-medium transition-colors motion-reduce:transition-none",
                  isActive ? "text-brand" : "text-muted-foreground",
                )}
              >
                {tab.primary ? (
                  <span className="bg-brand text-brand-foreground shadow-brand/25 -mt-5 grid size-12 shrink-0 place-items-center rounded-2xl shadow-lg">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                ) : (
                  <Icon aria-hidden="true" className="size-5 shrink-0" />
                )}
                <span className="max-w-full truncate">{tab.label}</span>
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
