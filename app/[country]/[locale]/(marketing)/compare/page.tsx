import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  getCountryFromParam,
  getLocaleFromParam,
  getRegionForCountry,
} from "@/lib/countries/server";
import { getCountryName } from "@/lib/countries";
import { getCurrencyConfigByCountry } from "@/lib/currency";
import { ROUTES } from "@/lib/constants";
import { withCountryLocalePrefix } from "@/lib/localized-path";
import { localizedSeoMetadata } from "@/lib/seo/metadata";
import { ComparisonWithControls } from "@/features/compare/components/comparison-with-controls";
import { comparisonService } from "@/features/phone-intelligence/services/comparison.service";
import type { PhoneSpecComparison } from "@/features/phone-intelligence/schemas/comparison.schema";

type PageProps = {
  params: Promise<{ country: string; locale: string }>;
  searchParams?: Promise<{ phones?: string; listings?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "marketplace" });
  return {
    ...localizedSeoMetadata({
      path: ROUTES.comparison,
      country: countryCode,
      locale: resolvedLocale,
    }),
    title: t("comparePhones"),
    description: t("description", {
      country: getCountryName(countryCode, resolvedLocale),
    }),
  };
}

export default async function ComparePage({ params, searchParams }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const region = getRegionForCountry(countryCode);
  const t = await getTranslations({ locale, namespace: "marketplace" });
  const tUi = await getTranslations({ locale, namespace: "uiActions" });
  const countryName = getCountryName(countryCode, locale);
  const currency = getCurrencyConfigByCountry(countryCode).code;

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const listingIds = resolvedSearchParams.listings?.split(",").filter(Boolean) ?? [];
  const phoneIds = resolvedSearchParams.phones?.split(",").filter(Boolean) ?? [];
  const hasSelection = listingIds.length > 0 || phoneIds.length > 0;

  let phones: PhoneSpecComparison[] = [];
  try {
    if (listingIds.length > 0) {
      // ?listings= contains listing IDs from the new selection UI and is region-scoped.
      phones = await comparisonService.getListingComparisonSpecs(listingIds, region);
    } else if (phoneIds.length > 0) {
      // ?phones= remains supported for catalog-model links.
      phones = await comparisonService.getComparisonSpecs(phoneIds);
    }
  } catch (error) {
    // A database outage should show the empty state, not break the whole page.
    console.warn(
      "[compare] Could not load comparison data.",
      error instanceof Error ? error.message : error,
    );
    phones = [];
  }

  const marketplaceHref = withCountryLocalePrefix(ROUTES.marketplace, countryCode, locale);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t("comparePhones")}</h1>
        <p className="text-muted-foreground">
          {t("description", { country: countryName })}
        </p>
      </div>

      {phones.length > 0 ? (
        <ComparisonWithControls
          phones={phones}
          currency={currency}
          idParam={listingIds.length > 0 ? "listings" : "phones"}
          marketplaceHref={marketplaceHref}
          canCompare={phones.length >= 2}
        />
      ) : (
        <div className="bg-card rounded-lg border p-12 text-center shadow-md">
          <h2 className="mb-2 text-xl font-semibold">
            {hasSelection ? t("selectionUnavailable") : t("noListings")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {hasSelection
              ? t("selectionUnavailableHint")
              : t("description", { country: countryName })}
          </p>
          <Link
            href={marketplaceHref}
            className="bg-primary text-primary-foreground inline-flex items-center rounded-lg px-4 py-2"
          >
            {tUi("browseMarketplace")}
          </Link>
        </div>
      )}
    </div>
  );
}
