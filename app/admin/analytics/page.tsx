import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Globe2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getConversionFunnelData,
  getRegionAnalyticsData,
} from "@/features/admin/services/admin.service";
import { formatPrice } from "@/utils/format";

export const metadata: Metadata = {
  title: "Business analytics — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const formatCount = (value: number) => value.toLocaleString();
const formatRate = (value: number) => (value === 0 ? "0%" : `${value.toFixed(2)}%`);

function LocationList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ name: string; count: number }>;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-xs text-slate-600">No location data recorded</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {rows.map((row) => (
            <li key={row.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-slate-300">{row.name}</span>
              <span className="shrink-0 text-slate-500 tabular-nums">{formatCount(row.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const [{ regions }, { metrics: funnel }] = await Promise.all([
    getRegionAnalyticsData(),
    getConversionFunnelData(),
  ]);
  const activeListings = regions.reduce((sum, region) => sum + region.activeListings, 0);
  const orders = regions.reduce((sum, region) => sum + region.orders, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
            Business intelligence
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Marketplace analytics
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Market performance split by country and the cities and areas where listings are
            concentrated. Values stay in each market&apos;s own currency.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 transition-colors hover:text-emerald-200"
        >
          Return to admin overview <ArrowRight className="size-3.5" />
        </Link>
      </header>

      <section aria-label="Cross-region totals" className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Markets tracked", value: formatCount(regions.length) },
          { label: "Active listings", value: formatCount(activeListings) },
          { label: "Orders", value: formatCount(orders) },
        ].map((metric) => (
          <Card key={metric.label} className="border-white/[0.08] bg-[#1F1F1F]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-400">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight text-slate-100">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section aria-label="Buyer conversion funnel" className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Buyer conversion funnel</h2>
          <p className="mt-1 text-xs text-slate-500">
            Derived from persisted views, favorites, conversations, and paid orders. Browser events
            are diagnostic only and never counted as conversions.
          </p>
        </div>

        {funnel.length === 0 ? (
          <Card className="border-white/[0.08] bg-[#1F1F1F]">
            <CardContent className="py-8 text-center text-xs text-slate-500">
              Conversion data is unavailable without a database connection.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {funnel.map((metric) => (
              <Card key={metric.region} className="border-white/[0.08] bg-[#1F1F1F]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <span aria-hidden>{metric.flag}</span>
                    {metric.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[
                      { label: "Views", value: metric.views },
                      { label: "Favorites", value: metric.favorites },
                      { label: "Chats", value: metric.chats },
                      { label: "Orders", value: metric.orders },
                      { label: "Paid", value: metric.paidOrders },
                    ].map((stage) => (
                      <div key={stage.label} className="rounded-lg bg-white/[0.03] p-2">
                        <p className="text-xs text-slate-500">{stage.label}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100 tabular-nums">
                          {formatCount(stage.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
                    {[
                      { label: "View → chat", value: metric.viewToChatRate },
                      { label: "Chat → order", value: metric.chatToOrderRate },
                      { label: "View → order", value: metric.viewToOrderRate },
                    ].map((rate) => (
                      <div key={rate.label}>
                        <p className="text-xs text-slate-500">{rate.label}</p>
                        <p className="mt-1 text-xs font-semibold text-emerald-300 tabular-nums">
                          {formatRate(rate.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {regions.length === 0 ? (
        <Card className="border-white/[0.08] bg-[#1F1F1F]">
          <CardContent className="py-12 text-center">
            <Globe2 className="mx-auto size-6 text-slate-600" />
            <p className="mt-3 text-sm font-medium text-slate-300">
              Region analytics are unavailable
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Connect the database to load per-country metrics. No placeholder figures are shown.
            </p>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-5" aria-label="Region breakdown">
          {regions.map((region) => (
            <Card key={region.region} className="border-white/[0.08] bg-[#1F1F1F]">
              <CardHeader className="flex-row items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {region.flag}
                  </span>
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-100">
                      {region.label}
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Local currency {region.currency} · 3 decimals for BHD, 0 for PKR
                    </p>
                  </div>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                  {region.currency}
                </span>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                  {[
                    { label: "Users", value: formatCount(region.users) },
                    { label: "Listings", value: formatCount(region.listings) },
                    { label: "Active listings", value: formatCount(region.activeListings) },
                    { label: "Orders", value: formatCount(region.orders) },
                    { label: "Completed payments", value: formatCount(region.paidPayments) },
                    {
                      label: "Payment volume",
                      value: formatPrice(region.paymentVolume, { currency: region.currency }),
                    },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <p className="text-xs text-slate-500">{metric.label}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-100 tabular-nums">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-6 border-t border-white/[0.06] pt-5 sm:grid-cols-2">
                  <LocationList title="Top cities" rows={region.topCities} />
                  <LocationList title="Top areas" rows={region.topAreas} />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <p className="text-xs text-slate-500">
        BHD and PKR totals are reported separately. No cross-currency conversion or rounding is
        applied to historical records.
      </p>
    </div>
  );
}
