import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CircleAlert,
  ClipboardCheck,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  Package,
  ShieldAlert,
  ShoppingCart,
  Smartphone,
  Store,
  Users,
} from "lucide-react";

import { MobileProfileCard } from "@/components/layout/mobile-profile-card";
import { MobileQuickActions } from "@/components/layout/mobile-quick-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRegionAnalyticsData, getStats } from "@/features/admin/services/admin.service";
import { getCurrentUser } from "@/lib/session";
import { ROUTES } from "@/lib/constants";
import { formatPrice } from "@/utils/format";

export const metadata: Metadata = {
  title: "Admin — Overview",
  robots: { index: false, follow: false },
};

const WORKSPACES = [
  {
    title: "Marketing & leads",
    description: "Campaigns, dealer leads, and acquisition performance.",
    href: "/admin/marketing",
    label: "Growth",
  },
  {
    title: "Customer support",
    description: "Support inbox, response targets, and customer resolutions.",
    href: "/admin/support",
    label: "Service",
  },
  {
    title: "Payments",
    description: "Transactions, refunds, payouts, and reconciliation.",
    href: "/admin/payments",
    label: "Finance",
  },
  {
    title: "Editorial",
    description: "Phone guides, news, and search-ready content.",
    href: "/admin/blogs",
    label: "Content",
  },
];

const formatCount = (value: number) => value.toLocaleString();

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  const [stats, regionAnalytics] = await Promise.all([getStats(), getRegionAnalyticsData()]);

  const metrics = [
    {
      icon: Package,
      label: "Active listings",
      value: stats?.activeListings,
      detail: "Published on the marketplace",
      href: `${ROUTES.adminListings}?status=ACTIVE`,
      tone: "emerald",
    },
    {
      icon: ClipboardCheck,
      label: "Awaiting review",
      value: stats?.pendingListings,
      detail: "Listings in the approval queue",
      href: `${ROUTES.adminListings}?status=PENDING_APPROVAL`,
      tone: "amber",
    },
    {
      icon: Users,
      label: "Customers",
      value: stats?.totalUsers,
      detail:
        stats === null
          ? "Marketplace members"
          : `${formatCount(stats.newUsers7d)} joined this week`,
      href: ROUTES.adminUsers,
      tone: "blue",
    },
    {
      icon: ShieldAlert,
      label: "Open reports",
      value: stats?.openReports,
      detail: "Trust & safety cases to review",
      href: ROUTES.adminReports,
      tone: "rose",
    },
  ] as const;

  const listingStatuses = stats
    ? [
        { label: "Active", value: stats.activeListings, color: "bg-emerald-400" },
        { label: "Pending", value: stats.pendingListings, color: "bg-amber-400" },
        { label: "Sold", value: stats.soldListings, color: "bg-sky-400" },
        { label: "Rejected", value: stats.rejectedListings, color: "bg-rose-400" },
        {
          label: "Other",
          value: Math.max(
            0,
            stats.totalListings -
              stats.activeListings -
              stats.pendingListings -
              stats.soldListings -
              stats.rejectedListings,
          ),
          color: "bg-slate-500",
        },
      ]
    : [];

  const mobileActions = [
    { href: ROUTES.admin, label: "Overview", icon: LayoutDashboard, tone: "brand" as const },
    { href: ROUTES.adminListings, label: "Listings", icon: Package, tone: "brand" as const },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart, tone: "sky" as const },
    { href: ROUTES.adminUsers, label: "Customers", icon: Users, tone: "violet" as const },
    { href: ROUTES.adminReports, label: "Reports", icon: BadgeCheck, tone: "rose" as const },
    { href: ROUTES.adminCategories, label: "Catalog", icon: FolderTree, tone: "amber" as const },
    { href: "/admin/finance", label: "Finance", icon: CreditCard, tone: "emerald" as const },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, tone: "sky" as const },
  ];

  return (
    <div className="space-y-7">
      <div className="space-y-4 md:hidden">
        <MobileProfileCard
          dark
          name={user?.name ?? "Admin"}
          email={user?.email ?? "Administrator"}
          image={user?.image}
          role="ADMIN"
          badgeLabel="Administrator"
          title={`Welcome back, ${user?.name?.split(" ")[0] ?? "Admin"}`}
          description={user?.email ?? "Marketplace operations"}
        />
        <MobileQuickActions
          dark
          actions={mobileActions}
          label="Admin shortcuts"
        />
      </div>

      <section className="hidden rounded-2xl border border-white/10 bg-[#1F1F1F] px-5 py-6 sm:px-7 sm:py-7 md:block">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="caption-3 uppercase tracking-wide text-emerald-300">
              Marketplace overview
            </p>
            <h1 className="heading-4 mt-2 text-white">
              Welcome back, {user?.name?.split(" ")[0] ?? "Admin"}
            </h1>
            <p className="body-3 mt-2 max-w-[680px] text-slate-400">
              Keep an eye on marketplace activity, review new listings, and manage your operations
              from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={ROUTES.adminListings}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
            >
              All listings <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/admin/models"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-400 px-3.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
            >
              Manage catalog <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="marketplace-metrics-title">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="marketplace-metrics-title" className="title-4 text-slate-100">
              Marketplace at a glance
            </h2>
            <p className="caption-2 mt-1 text-slate-500">Current operational totals</p>
          </div>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 transition-colors hover:text-emerald-200"
          >
            View analytics <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(({ icon: Icon, label, value, detail, href, tone }) => (
            <Link
              key={label}
              href={href}
              className="group rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <Card className="h-full border-white/[0.08] bg-[#1F1F1F] transition-colors group-hover:border-white/20">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-slate-400">{label}</CardTitle>
                  <span
                    className={`flex size-9 items-center justify-center rounded-lg ${
                      tone === "emerald"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : tone === "amber"
                          ? "bg-amber-400/10 text-amber-300"
                          : tone === "blue"
                            ? "bg-sky-400/10 text-sky-300"
                            : "bg-rose-400/10 text-rose-300"
                    }`}
                  >
                    <Icon className="size-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tracking-tight text-slate-100">
                    {value === undefined ? "—" : formatCount(value)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{detail}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {regionAnalytics.regions.length > 0 && (
        <section aria-labelledby="region-snapshot-title">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="region-snapshot-title" className="text-sm font-semibold text-slate-100">
                Regional snapshot
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Each market in its own currency — no BHD/PKR conversion.
              </p>
            </div>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 transition-colors hover:text-emerald-200"
            >
              Full analytics <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {regionAnalytics.regions.map((region) => (
              <Card key={region.region} className="border-white/[0.08] bg-[#1F1F1F]">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <span aria-hidden>{region.flag}</span> {region.label}
                  </CardTitle>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs font-semibold text-slate-400">
                    {region.currency}
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold tabular-nums text-slate-100">
                    {formatPrice(region.paymentVolume, { currency: region.currency })}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatCount(region.listings)} listings · {formatCount(region.orders)} orders ·{" "}
                    {formatCount(region.paidPayments)} completed payments
                  </p>
                  {region.topCities.length > 0 && (
                    <p className="mt-2 truncate text-xs text-slate-500">
                      Top city: {region.topCities[0]?.name} (
                      {formatCount(region.topCities[0]?.count ?? 0)})
                      {region.topAreas.length > 0 && ` · Top area: ${region.topAreas[0]?.name}`}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-white/[0.08] bg-[#1F1F1F]">
          <CardHeader className="flex-row items-start justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-100">Listing status</CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                A breakdown of current marketplace inventory
              </p>
            </div>
            <Link
              href={ROUTES.adminListings}
              aria-label="View all listings"
              className="rounded-md p-1 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowUpRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent className="pt-5">
            {stats ? (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold tracking-tight text-white">
                    {formatCount(stats.totalListings)}
                  </p>
                  <span className="text-xs text-slate-500">total listings</span>
                </div>
                <div
                  className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]"
                  role="img"
                  aria-label={listingStatuses
                    .map(({ label, value }) => `${formatCount(value)} ${label.toLowerCase()}`)
                    .join(", ")}
                >
                  {listingStatuses.map(({ label, value, color }) =>
                    value > 0 && stats.totalListings > 0 ? (
                      <span
                        key={label}
                        className={`${color} first:rounded-l-full last:rounded-r-full`}
                        style={{ width: `${(value / stats.totalListings) * 100}%` }}
                      />
                    ) : null,
                  )}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
                  {listingStatuses.map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <span className={`size-2 rounded-full ${color}`} />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-100">
                          {formatCount(value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-8 text-sm text-slate-400">
                Listing metrics are unavailable in demo preview.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-[#1F1F1F]">
          <CardHeader className="border-b border-white/[0.07] pb-4">
            <CardTitle className="text-sm font-semibold text-slate-100">Quick access</CardTitle>
            <p className="text-xs text-slate-500">Jump back into your key workflows</p>
          </CardHeader>
          <CardContent className="space-y-1 pt-3">
            <Link
              href="/admin/models"
              className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white/[0.04]"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
                <Smartphone className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-200">Phone catalog</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {stats ? `${formatCount(stats.totalModels)} models` : "Manage models and specs"}
                </span>
              </span>
              <ArrowUpRight className="size-4 text-slate-600" />
            </Link>
            <Link
              href="/admin/dealers"
              className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white/[0.04]"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300">
                <Store className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-200">Dealer network</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {stats
                    ? `${formatCount(stats.totalDealers)} registered dealers`
                    : "Manage dealers"}
                </span>
              </span>
              <ArrowUpRight className="size-4 text-slate-600" />
            </Link>
            <Link
              href={ROUTES.adminReports}
              className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-white/[0.04]"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-rose-400/10 text-rose-300">
                <BadgeCheck className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-200">Trust &amp; safety</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Review reports and protect buyers
                </span>
              </span>
              <ArrowUpRight className="size-4 text-slate-600" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {stats && stats.pendingListings > 0 && (
        <Link
          href={`${ROUTES.adminListings}?status=PENDING_APPROVAL`}
          className="group flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 transition-colors hover:bg-amber-400/[0.09] sm:px-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
              <CircleAlert className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-100">
                {formatCount(stats.pendingListings)} listing
                {stats.pendingListings === 1 ? "" : "s"} need review
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Check submitted details before these listings appear in the marketplace.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-lg bg-amber-300 px-3.5 py-2 text-xs font-bold text-slate-950 transition-colors group-hover:bg-amber-200">
            Open approval queue <ArrowRight className="size-3.5" />
          </span>
        </Link>
      )}

      <section aria-labelledby="workspaces-title">
        <div className="mb-3">
          <h2 id="workspaces-title" className="text-sm font-semibold text-slate-100">
            Business workspaces
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Marketing, customer service, finance, and content operations.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {WORKSPACES.map((workspace) => (
            <Link
              key={workspace.href}
              href={workspace.href}
              className="group rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-4 transition-colors hover:border-emerald-400/30 hover:bg-[#181a1f]"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  {workspace.label}
                </span>
                <ArrowUpRight className="size-4 text-slate-600 transition-colors group-hover:text-emerald-300" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-100">{workspace.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-400">{workspace.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
