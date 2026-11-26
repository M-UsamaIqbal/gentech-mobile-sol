"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, Globe2 } from "lucide-react";

import {
  DEFAULT_COUNTRY,
  getAllCountries,
  getAllSupportedLocales,
  getCountryConfig,
  getCountryName,
  getDefaultLocale,
} from "@/lib/countries";
import {
  LOCALE_NATIVE_NAMES,
  type CountryCode,
  type LocaleCode,
} from "@/lib/countries/types";
import { useLocalizedRouteInfo } from "@/lib/localized-routing";
import {
  setCountryCookieClient,
  setLocaleCookieClient,
} from "@/lib/country-cookie-client";
import { saveLocalizationPreferencesAction } from "@/features/localization/actions/preferences";
import { cn } from "@/lib/utils";

type OpenMenu = "country" | "language" | null;

function useDismiss(menu: OpenMenu, close: () => void, ref: React.RefObject<HTMLDivElement | null>) {
  React.useEffect(() => {
    if (!menu) return;

    function onPointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menu, close, ref]);
}

/** Independent country and language controls; changing one never changes the other. */
export function CountryLocaleSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("country");
  const { country: routeCountry, locale: routeLocale } = useLocalizedRouteInfo();
  const [openMenu, setOpenMenu] = React.useState<OpenMenu>(null);
  const [isPending, startTransition] = React.useTransition();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const closeMenu = React.useCallback(() => setOpenMenu(null), []);
  useDismiss(openMenu, closeMenu, containerRef);

  const currentCountry = routeCountry ?? DEFAULT_COUNTRY;
  const currentLocale = routeLocale ?? getDefaultLocale(currentCountry);
  const config = getCountryConfig(currentCountry);

  function localizedPath(country: CountryCode, locale: LocaleCode): string {
    const search = typeof window === "undefined" ? "" : window.location.search;
    const segments = pathname.split("/").filter(Boolean);
    const hasCountry = ["bh", "pk"].includes(segments[0]?.toLowerCase() ?? "");
    const hasLocale =
      hasCountry && ["en", "ar", "ur"].includes(segments[1]?.toLowerCase() ?? "");
    const rest = hasLocale ? segments.slice(2) : hasCountry ? segments.slice(1) : segments;
    const prefix = `/${country.toLowerCase()}/${locale}`;
    return `${prefix}${rest.length > 0 ? `/${rest.join("/")}` : ""}${search}`;
  }

  function applyPreferences(country: CountryCode, locale: LocaleCode) {
    setOpenMenu(null);

    // Mirror immediately so the next request already sees the new preference.
    setCountryCookieClient(country);
    setLocaleCookieClient(locale);

    startTransition(async () => {
      try {
        await saveLocalizationPreferencesAction({ country, locale });
      } catch {
        // Cookies still hold the selection; DB persistence can be retried later.
      }
      router.push(localizedPath(country, locale));
      router.refresh();
    });
  }

  return (
    <div className="relative flex items-center gap-1.5" ref={containerRef}>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={openMenu === "country"}
          aria-label={t("selectCountry")}
          disabled={isPending}
          onClick={() => setOpenMenu(openMenu === "country" ? null : "country")}
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-60"
        >
          <span aria-hidden>{config.flag}</span>
          <span className="hidden sm:inline">{getCountryName(currentCountry, currentLocale)}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </button>

        {openMenu === "country" ? (
          <div role="menu" className="absolute top-full right-0 z-50 mt-2 w-60 rounded-lg border bg-popover p-2 shadow-lg">
            <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">{t("country")}</p>
            {getAllCountries().map((item) => (
              <button
                key={item.code}
                type="button"
                role="menuitemradio"
                aria-checked={item.code === currentCountry}
                disabled={isPending}
                onClick={() => applyPreferences(item.code, currentLocale)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent disabled:opacity-60",
                  item.code === currentCountry && "bg-accent",
                )}
              >
                <span aria-hidden>{item.flag}</span>
                <span>{getCountryName(item.code, currentLocale)}</span>
                <span className="text-muted-foreground ms-auto text-xs">
                  {item.defaultCurrency}
                </span>
                {item.code === currentCountry ? <Check className="size-3.5" aria-hidden /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={openMenu === "language"}
          aria-label={t("language")}
          disabled={isPending}
          onClick={() => setOpenMenu(openMenu === "language" ? null : "language")}
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors hover:bg-accent disabled:opacity-60"
        >
          <Globe2 className="size-4" aria-hidden />
          <span>{LOCALE_NATIVE_NAMES[currentLocale]}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </button>

        {openMenu === "language" ? (
          <div role="menu" className="absolute top-full right-0 z-50 mt-2 w-48 rounded-lg border bg-popover p-2 shadow-lg">
            <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium">{t("language")}</p>
            {getAllSupportedLocales().map((item) => (
              <button
                key={item}
                type="button"
                role="menuitemradio"
                aria-checked={item === currentLocale}
                disabled={isPending}
                onClick={() => applyPreferences(currentCountry, item)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent disabled:opacity-60",
                  item === currentLocale && "bg-accent",
                )}
              >
                <span>{LOCALE_NATIVE_NAMES[item]}</span>
                {item === currentLocale ? <Check className="ms-auto size-3.5" aria-hidden /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
