import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getCountryFromParam, getLocaleFromParam } from "@/lib/countries/server";
import { ROUTES } from "@/lib/constants";
import { localizedSeoMetadata } from "@/lib/seo/metadata";
import { ImeiVerificationResultCard } from "@/features/phone-intelligence/components/imei-verification-result";
import {
  verifyImeiAction,
  getImeiVerificationAction,
} from "@/features/phone-intelligence/actions/imei.actions";

type ImeiCheckSearchParams = {
  imei?: string;
  unavailable?: string;
  rateLimited?: string;
  invalid?: string;
};

type PageProps = {
  params: Promise<{ country: string; locale: string }>;
  searchParams?: Promise<ImeiCheckSearchParams>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "imei" });

  return {
    ...localizedSeoMetadata({
      path: ROUTES.imeiCheck,
      country: countryCode,
      locale: resolvedLocale,
    }),
    title: t("title"),
    description: t("description"),
  };
}

export default async function ImeiCheckPage({ params, searchParams }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const showPakistanSignals = countryCode === "PK";
  const t = await getTranslations({ locale, namespace: "imei" });
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const { imei, unavailable, rateLimited, invalid } = resolvedSearchParams;

  let verification = null;
  if (imei && /^\d{15}$/.test(imei)) {
    verification = await getImeiVerificationAction(imei);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {showPakistanSignals ? t("description") : t("traBody")}
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        {invalid ? (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {t("invalid")}
          </p>
        ) : null}
        {rateLimited ? (
          <p role="alert" className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            {t("rateLimited")}
          </p>
        ) : null}
        {unavailable ? (
          <p role="alert" className="mb-4 rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
            {t("unavailable")}
          </p>
        ) : null}

        <div className="bg-card mb-6 rounded-lg border p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">{t("formTitle")}</h2>
          <form action={verifyImeiAction} className="space-y-4">
            <div>
              <label htmlFor="imei" className="mb-1 block text-sm font-medium">
                {t("imeiLabel")}
              </label>
              <input
                type="text"
                id="imei"
                name="imei"
                required
                pattern="\d{15}"
                maxLength={15}
                placeholder="123456789012345"
                className="border-input bg-background focus:ring-primary w-full rounded-lg border px-3 py-2 font-mono focus:ring-2"
              />
              <p className="text-muted-foreground mt-1 text-xs">{t("imeiHint")}</p>
            </div>
            <button type="submit" className="bg-primary text-primary-foreground w-full rounded-lg px-4 py-2 font-medium">
              {t("submit")}
            </button>
          </form>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <InfoCard title={t("whatIsTitle")} body={t("whatIsBody")} />
          <InfoCard title={t("blacklistTitle")} body={t("blacklistBody")} />
          {showPakistanSignals ? (
            <>
              <InfoCard title={t("ptaTitle")} body={t("ptaBody")} />
              <InfoCard title={t("cpidTitle")} body={t("cpidBody")} />
            </>
          ) : (
            <InfoCard title={t("traTitle")} body={t("traBody")} />
          )}
        </div>

        {verification ? (
          <ImeiVerificationResultCard
            verification={verification}
            showPakistanSignals={showPakistanSignals}
          />
        ) : null}
      </div>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-muted/50 rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{body}</p>
    </div>
  );
}
