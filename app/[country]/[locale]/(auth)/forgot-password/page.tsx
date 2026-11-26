import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getCountryFromParam, getLocaleFromParam } from "@/lib/countries/server";
import { AuthCard } from "@/features/auth/components/auth-card";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

type PageProps = { params: Promise<{ country: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "authentication" });
  return { title: t("forgotPassword"), robots: { index: false, follow: false } };
}

export default async function ForgotPasswordPage({ params }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const t = await getTranslations({ locale, namespace: "authPage" });

  return (
    <AuthCard title={t("forgotTitle")} description={t("forgotDescription")}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
