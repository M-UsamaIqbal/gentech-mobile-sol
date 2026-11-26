import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getCountryFromParam, getLocaleFromParam } from "@/lib/countries/server";
import { getEnabledSocialProviders } from "@/features/auth/server/enabled-providers";
import { AuthCard } from "@/features/auth/components/auth-card";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

type PageProps = { params: Promise<{ country: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "authentication" });
  return { title: t("signUp"), robots: { index: false, follow: false } };
}

export default async function SignUpPage({ params }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const t = await getTranslations({ locale, namespace: "authPage" });
  const providers = getEnabledSocialProviders();

  return (
    <AuthCard title={t("signUpTitle")} description={t("signUpDescription")}>
      <SignUpForm providers={providers} />
    </AuthCard>
  );
}
