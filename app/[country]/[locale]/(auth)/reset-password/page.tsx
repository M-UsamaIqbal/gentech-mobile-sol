import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getCountryFromParam, getLocaleFromParam } from "@/lib/countries/server";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

type PageProps = {
  params: Promise<{ country: string; locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "authentication" });
  return { title: t("resetPassword"), robots: { index: false, follow: false } };
}

export default async function ResetPasswordPage({ params, searchParams }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const t = await getTranslations({ locale, namespace: "authPage" });
  const { token } = await searchParams;

  return (
    <AuthCard title={t("resetTitle")} description={t("resetDescription")}>
      <ResetPasswordForm token={token ?? null} />
    </AuthCard>
  );
}
