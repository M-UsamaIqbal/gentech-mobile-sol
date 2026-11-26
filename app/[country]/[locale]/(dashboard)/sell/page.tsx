import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  getCountryFromParam,
  getLocaleFromParam,
  getRegionForCountry,
} from "@/lib/countries/server";
import { ROUTES } from "@/lib/constants";
import { withCountryLocalePrefix } from "@/lib/localized-path";
import { CreateListingForm } from "@/features/listings/components/create-listing-form";
import { buttonVariants } from "@/components/ui/button";
import {
  getMarketplaceBrands,
  getMarketplaceCategories,
} from "@/features/marketplace/services/catalog.service";
import { getActiveLocationTree } from "@/features/locations/services/location.service";

type PageProps = { params: Promise<{ country: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "navigation" });
  return { title: t("sell"), robots: { index: false, follow: false } };
}

export default async function SellPage({ params }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const region = getRegionForCountry(countryCode);
  const showPakistanSignals = countryCode === "PK";

  const [tNav, tCta, tSell, tUi] = await Promise.all([
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "cta" }),
    getTranslations({ locale, namespace: "sell" }),
    getTranslations({ locale, namespace: "uiActions" }),
  ]);

  const valuationHref = withCountryLocalePrefix(ROUTES.valuation, countryCode, locale);
  const imeiHref = withCountryLocalePrefix(ROUTES.imeiCheck, countryCode, locale);

  const [categories, brands, locations] = await Promise.all([
    getMarketplaceCategories(region),
    getMarketplaceBrands(),
    getActiveLocationTree(countryCode),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{tNav("sell")}</h1>
        <p className="text-muted-foreground text-sm">{tCta("body")}</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <Link
          href={valuationHref}
          className={buttonVariants({
            variant: "outline",
            className: "flex h-auto flex-col items-center justify-center gap-2 py-4",
          })}
        >
          <span className="text-lg">💰</span>
          <span className="text-sm font-medium">{tSell("checkValue")}</span>
          <span className="text-muted-foreground text-xs">{tSell("checkValueHint")}</span>
        </Link>
        <Link
          href={imeiHref}
          className={buttonVariants({
            variant: "outline",
            className: "flex h-auto flex-col items-center justify-center gap-2 py-4",
          })}
        >
          <span className="text-lg">🔍</span>
          <span className="text-sm font-medium">{tSell("verifyImei")}</span>
          <span className="text-muted-foreground text-xs">
            {showPakistanSignals ? tSell("verifyImeiHint") : tUi("browseMarketplace")}
          </span>
        </Link>
      </div>

      <CreateListingForm
        categories={categories}
        brands={brands}
        locations={locations}
        showPakistanSignals={showPakistanSignals}
      />
    </div>
  );
}
