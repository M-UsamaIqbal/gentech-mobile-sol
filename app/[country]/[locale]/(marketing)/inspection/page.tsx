import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, ClipboardCheck, ScanLine, ShieldCheck } from "lucide-react";

import {
  getCountryFromParam,
  getLocaleFromParam,
} from "@/lib/countries/server";
import { ROUTES } from "@/lib/constants";
import { withCountryLocalePrefix } from "@/lib/localized-path";
import { localizedSeoMetadata } from "@/lib/seo/metadata";
import { formatPrice } from "@/utils/format";
import { getCurrentUser } from "@/lib/session";
import { getInspectionPlans } from "@/features/inspections/services/inspection.service";
import { BookInspectionForm } from "@/features/inspections/components/book-inspection-form";
import { Button } from "@/components/ui/button";
import { getActiveLocationTree } from "@/features/locations/services/location.service";

type PageProps = { params: Promise<{ country: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "navigation" });
  return {
    ...localizedSeoMetadata({
      path: ROUTES.inspectionService,
      country: countryCode,
      locale: resolvedLocale,
    }),
    title: t("inspection"),
    description: t("inspection"),
  };
}

export default async function InspectionServicePage({ params }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const showPakistanSignals = countryCode === "PK";

  const [tNav, tHome, tImei, tUi, tHow] = await Promise.all([
    getTranslations({ locale, namespace: "navigation" }),
    getTranslations({ locale, namespace: "homepage" }),
    getTranslations({ locale, namespace: "imei" }),
    getTranslations({ locale, namespace: "uiActions" }),
    getTranslations({ locale, namespace: "howItWorks" }),
  ]);

  const steps = [
    { icon: ClipboardCheck, title: tUi("book"), body: tHow("step1Body") },
    { icon: ScanLine, title: tHow("step1Title"), body: tHow("step2Body") },
    { icon: ShieldCheck, title: tHow("step3Title"), body: tHow("step3Body") },
  ];

  const [plans, user, locations] = await Promise.all([
    getInspectionPlans(),
    getCurrentUser(),
    getActiveLocationTree(countryCode),
  ]);

  const myInspectionsHref = withCountryLocalePrefix(ROUTES.inspections, countryCode, locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="text-center">
        <span className="bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
          <ShieldCheck className="size-4" />
          {tNav("inspection")}
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {tNav("inspection")}
        </h1>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
          {showPakistanSignals ? tImei("description") : tImei("traBody")}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="#book" />}>{tUi("book")}</Button>
          <Button variant="outline" render={<Link href={myInspectionsHref} />}>
            {tUi("myInspections")}
          </Button>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold tracking-tight">{tHow("title")}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="bg-card rounded-xl border p-5 text-center">
              <div className="bg-primary/10 text-primary mx-auto grid size-11 place-items-center rounded-xl">
                <step.icon className="size-6" />
              </div>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold tracking-tight">{tUi("packages")}</h2>
        <p className="text-muted-foreground mt-2 text-center text-sm">{tHome("featuredDescription")}</p>

        {plans.length === 0 ? (
          <p className="text-muted-foreground mt-8 text-center text-sm">{tHome("noListings")}</p>
        ) : (
          <div className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-2">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={
                  "bg-card relative rounded-2xl border p-6" +
                  (index === plans.length - 1 ? " border-primary ring-primary/20 ring-2" : "")
                }
              >
                {index === plans.length - 1 ? (
                  <span className="bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-medium">
                    {tHome("popular")}
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.description ? (
                  <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
                ) : null}
                <p className="mt-4 text-3xl font-bold">
                  {formatPrice(plan.price, { currency: plan.currency, locale })}
                </p>
                <p className="text-muted-foreground text-xs">
                  {tUi("checkpoints", { count: plan.checkpoints })}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" render={<Link href="#book" />}>
                  {tUi("book")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="book" className="mt-16 scroll-mt-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold tracking-tight">{tNav("inspection")}</h2>
          <p className="text-muted-foreground mt-2 mb-6 text-center text-sm">
            {tHow("step1Body")}
          </p>
          <BookInspectionForm plans={plans} isAuthenticated={Boolean(user)} locations={locations} />
        </div>
      </section>
    </div>
  );
}
