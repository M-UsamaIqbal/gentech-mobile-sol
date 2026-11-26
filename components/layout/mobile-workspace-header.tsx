"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, House } from "lucide-react";

import { LocalizedLink } from "@/components/localized-link";
import { ROUTES } from "@/lib/constants";
import { useLocalizedRouteInfo, withLocalizedPrefix } from "@/lib/localized-routing";
import {
  mobileWorkspaceRoute,
  mobileWorkspaceTitleKey,
} from "@/features/marketplace/lib/mobile-workspace";

/** Compact section bar that gives authenticated pages an app-like navigation header. */
export function MobileWorkspaceHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const { prefix } = useLocalizedRouteInfo();
  const route = mobileWorkspaceRoute(pathname);
  const titleKey = mobileWorkspaceTitleKey(pathname);
  const title = tNav.has(titleKey) ? tNav(titleKey) : tNav("dashboard");
  const isRoot =
    route === "/dashboard" ||
    route === "/dashboard/" ||
    route === "/admin" ||
    route === "/inspector";

  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(withLocalizedPrefix(ROUTES.dashboard, prefix));
  }

  return (
    <div className="bg-background/95 -mx-4 sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 mb-4 flex h-12 items-center gap-2 border-b px-4 backdrop-blur md:hidden">
      {isRoot ? (
        <span aria-hidden="true" className="size-8 shrink-0" />
      ) : (
        <button
          type="button"
          onClick={goBack}
          aria-label={tCommon("back")}
          className="text-muted-foreground hover:text-foreground grid size-8 shrink-0 place-items-center rounded-lg"
        >
          <ArrowLeft aria-hidden="true" className="size-5 rtl:rotate-180" />
        </button>
      )}
      <p className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</p>
      <LocalizedLink
        href={ROUTES.home}
        aria-label={tNav("home")}
        className="text-muted-foreground hover:text-foreground grid size-8 shrink-0 place-items-center rounded-lg"
      >
        <House aria-hidden="true" className="size-5" />
      </LocalizedLink>
    </div>
  );
}
