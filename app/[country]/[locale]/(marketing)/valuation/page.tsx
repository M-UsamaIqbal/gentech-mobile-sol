import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  getCountryFromParam,
  getLocaleFromParam,
} from "@/lib/countries/server";
import { getCountryName } from "@/lib/countries";
import { ROUTES } from "@/lib/constants";
import { withCountryLocalePrefix } from "@/lib/localized-path";
import { localizedSeoMetadata } from "@/lib/seo/metadata";
import { PhoneValuationCard } from "@/features/phone-intelligence/components/phone-valuation-card";
import { phoneModelRepository } from "@/features/phone-intelligence/repositories/phone-model.repository";
import { valuationService } from "@/features/phone-intelligence/services/valuation.service";
import { calculateValuationAction } from "@/features/phone-intelligence/actions/valuation.actions";

type PageProps = {
  params: Promise<{ country: string; locale: string }>;
  searchParams?: Promise<{ id?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "marketplace" });
  return {
    ...localizedSeoMetadata({
      path: ROUTES.valuation,
      country: countryCode,
      locale: resolvedLocale,
    }),
    title: `${t("checkValue")} · GenTech`,
    description: t("description", { country: getCountryName(countryCode, resolvedLocale) }),
  };
}

export default async function ValuationPage({ params, searchParams }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const showPakistanData = countryCode === "PK";

  const [tMarket, tUi, tFilters, tCondition, tHow] = await Promise.all([
    getTranslations({ locale, namespace: "marketplace" }),
    getTranslations({ locale, namespace: "uiActions" }),
    getTranslations({ locale, namespace: "filters" }),
    getTranslations({ locale, namespace: "condition" }),
    getTranslations({ locale, namespace: "howItWorks" }),
  ]);

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const createListingHref = withCountryLocalePrefix("/sell", countryCode, locale);

  if (!showPakistanData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 text-3xl font-bold">{tMarket("checkValue")}</h1>
        <p className="text-muted-foreground mb-6">{tUi("unavailableBahrainBody")}</p>
        <Link
          href={withCountryLocalePrefix("/marketplace", countryCode, locale)}
          className="bg-primary text-primary-foreground inline-flex items-center rounded-lg px-4 py-2"
        >
          {tUi("browseMarketplace")}
        </Link>
      </div>
    );
  }

  const [phoneModels, valuation] = await Promise.all([
    phoneModelRepository.findAllActive(),
    resolvedSearchParams.id
      ? valuationService.getValuation(resolvedSearchParams.id)
      : null,
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{tMarket("checkValue")}</h1>
        <p className="text-muted-foreground">{tMarket("description", { country: getCountryName(countryCode, locale) })}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="bg-card rounded-lg border p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">{tUi("calculateValue")}</h2>
          <form action={calculateValuationAction} className="space-y-4">
            <div>
              <label htmlFor="modelId" className="mb-1 block text-sm font-medium">
                {tUi("selectModel")}
              </label>
              <select
                id="modelId"
                name="modelId"
                required
                className="border-input bg-background w-full rounded-lg border px-3 py-2"
              >
                <option value="">{tUi("selectModel")}</option>
                {phoneModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.brand.name} {model.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="storage" className="mb-1 block text-sm font-medium">
                  {tFilters("storage")}
                </label>
                <select
                  id="storage"
                  name="storage"
                  className="border-input bg-background w-full rounded-lg border px-3 py-2"
                >
                  <option value="">{tFilters("any")}</option>
                  {["64GB", "128GB", "256GB", "512GB", "1TB"].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ram" className="mb-1 block text-sm font-medium">
                  {tFilters("ram")}
                </label>
                <select
                  id="ram"
                  name="ram"
                  className="border-input bg-background w-full rounded-lg border px-3 py-2"
                >
                  <option value="">{tFilters("any")}</option>
                  {["4GB", "6GB", "8GB", "12GB", "16GB"].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="condition" className="mb-1 block text-sm font-medium">
                {tFilters("condition")}
              </label>
              <select
                id="condition"
                name="condition"
                className="border-input bg-background w-full rounded-lg border px-3 py-2"
              >
                <option value="">{tFilters("any")}</option>
                {["NEW", "OPEN_BOX", "USED", "REFURBISHED", "FOR_PARTS"].map((value) => (
                  <option key={value} value={value}>{tCondition(value)}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="batteryHealth" className="mb-1 block text-sm font-medium">
                {tFilters("batteryHealth")}
              </label>
              <input
                type="number"
                id="batteryHealth"
                name="batteryHealth"
                min="0"
                max="100"
                placeholder="85"
                className="border-input bg-background w-full rounded-lg border px-3 py-2"
              />
            </div>

            <input type="hidden" name="isPreview" value="true" />

            <button
              type="submit"
              className="bg-primary text-primary-foreground w-full rounded-lg px-4 py-2 font-medium"
            >
              {tUi("calculateValue")}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {valuation ? <PhoneValuationCard valuation={valuation} currency="PKR" /> : null}

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">{tUi("howItWorks")}</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• {tHow("step1Body")}</li>
              <li>• {tHow("step2Body")}</li>
              <li>• {tHow("step3Body")}</li>
            </ul>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h3 className="mb-2 font-semibold text-yellow-900">{tMarket("checkValue")}</h3>
            <p className="mb-3 text-sm text-yellow-800">{tMarket("description", { country: getCountryName(countryCode, locale) })}</p>
            <Link
              href={createListingHref}
              className="inline-flex items-center rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white"
            >
              {tUi("createListing")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
