import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  getCountryCodes,
  getDefaultLocale,
  getAllSupportedLocales,
  isSupportedLocale,
  isValidCountryCode,
} from "@/lib/countries";
import { isRtlLocale } from "@/lib/countries/types";
import { DirectionSetter } from "@/components/direction-setter";

type LocalizedParams = { country: string; locale: string };

export function generateStaticParams() {
  const params: LocalizedParams[] = [];
  for (const country of getCountryCodes()) {
    for (const locale of getAllSupportedLocales()) {
      params.push({ country: country.toLowerCase(), locale });
    }
  }
  return params;
}

export default async function CountryLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LocalizedParams>;
}) {
  const { country, locale } = await params;
  const countryCode = country.toUpperCase();

  if (!isValidCountryCode(countryCode) || !isSupportedLocale(locale)) {
    notFound();
  }

  // Any supported language is valid in any supported country.
  const resolvedLocale = isSupportedLocale(locale) ? locale : getDefaultLocale(countryCode);
  setRequestLocale(resolvedLocale);
  const messages = await getMessages({ locale: resolvedLocale });
  const isRtl = isRtlLocale(resolvedLocale);

  return (
    <NextIntlClientProvider locale={resolvedLocale} messages={messages}>
      <DirectionSetter locale={resolvedLocale} isRtl={isRtl} />
      {children}
    </NextIntlClientProvider>
  );
}
