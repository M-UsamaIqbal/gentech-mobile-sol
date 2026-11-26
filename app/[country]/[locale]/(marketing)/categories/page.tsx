import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  getCountryFromParam,
  getLocaleFromParam,
  getRegionForCountry,
} from "@/lib/countries/server";
import { ROUTES } from "@/lib/constants";
import { localizedSeoMetadata } from "@/lib/seo/metadata";
import { getCategoriesWithCounts } from "@/features/marketplace/services/category.service";
import { CategoryGrid } from "@/features/marketplace/components/category-grid";
import { MobileCategoryGrid } from "@/features/marketplace/components/mobile-category-grid";

type PageProps = {
  params: Promise<{ country: string; locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "categoriesPage" });

  return {
    ...localizedSeoMetadata({
      path: ROUTES.categories,
      country: countryCode,
      locale: resolvedLocale,
    }),
    title: t("title"),
    description: t("description"),
  };
}

export default async function CategoriesPage({ params }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const t = await getTranslations({ locale, namespace: "categoriesPage" });
  const categories = await getCategoriesWithCounts(undefined, getRegionForCountry(countryCode));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8 border-b border-border/70 pb-4">
        <h1 className="heading-4 flex items-center gap-2">
          <span aria-hidden="true" className="bg-brand h-5 w-1 shrink-0 rounded-full" />
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </header>
      <div className="md:hidden">
        <MobileCategoryGrid categories={categories} />
      </div>
      <div className="hidden md:block">
        <CategoryGrid categories={categories} />
      </div>
    </div>
  );
}
