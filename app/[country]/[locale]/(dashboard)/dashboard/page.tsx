import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  Bookmark,
  Heart,
  LayoutGrid,
  MessageSquare,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

import {
  getCountryFromParam,
  getLocaleFromParam,
} from "@/lib/countries/server";
import { ROUTES, USER_ROLES, type UserRole } from "@/lib/constants";
import { withCountryLocalePrefix } from "@/lib/localized-path";
import { getCurrentSession } from "@/lib/session";
import { getUnreadCount } from "@/features/messaging/services/conversation.service";
import { getStats } from "@/features/seller/services/seller.service";
import { getMyInspectionCount } from "@/features/inspections/services/inspection.service";
import { SellerStatsCards } from "@/features/seller/components/seller-stats";
import { MobileProfileCard } from "@/components/layout/mobile-profile-card";
import { MobileQuickActions } from "@/components/layout/mobile-quick-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ country: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, locale } = await params;
  const countryCode = getCountryFromParam(country);
  const resolvedLocale = getLocaleFromParam(locale, countryCode);
  const t = await getTranslations({ locale: resolvedLocale, namespace: "navigation" });
  return { title: t("dashboard"), robots: { index: false, follow: false } };
}

function DashboardHero({
  name,
  email,
  role,
  emailVerified,
  copy,
  links,
}: {
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  copy: Record<string, string | undefined>;
  links: { sell: string; marketplace: string };
}) {
  return (
    <section
      aria-labelledby="dashboard-welcome"
      className="workspace-hero rounded-2xl border border-white/10 bg-[#181818] p-5 text-white sm:p-8"
    >
      <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="caption-3 rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 uppercase tracking-wide text-emerald-300">
              {copy.yourMarketplace}
            </span>
            <Badge className="border-white/10 bg-white/10 text-slate-200">{role}</Badge>
            <Badge
              variant="outline"
              className={
                emailVerified
                  ? "border-emerald-300/25 text-emerald-200"
                  : "border-amber-300/25 text-amber-200"
              }
            >
              {emailVerified ? copy.verified : copy.unverified}
            </Badge>
          </div>
          <h1
            id="dashboard-welcome"
            className="heading-4 mt-4 text-white"
          >
            {copy.greeting?.replace("{name}", name.split(" ")[0] ?? name) ?? ""}
          </h1>
          <p className="body-3 mt-2 max-w-[680px] text-slate-300">{copy.liveBody}</p>
          <p className="caption-2 mt-3 text-slate-400" dir="ltr">{email}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={links.sell}
            className={cn(
              buttonVariants({ size: "sm" }),
              "min-h-10 rounded-lg bg-emerald-300 px-4 font-semibold text-slate-950 hover:bg-emerald-200",
            )}
          >
            <Plus className="size-4" />
            {copy.postListing}
          </Link>
          <Link
            href={links.marketplace}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white transition-colors duration-300 hover:bg-white/[0.12]"
          >
            {copy.explorePhones} <ArrowRight className="size-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPage({ params }: PageProps) {
  const { country, locale: localeParam } = await params;
  const countryCode = getCountryFromParam(country);
  const locale = getLocaleFromParam(localeParam, countryCode);
  const t = await getTranslations({ locale, namespace: "dashboardPage" });
  const tNav = await getTranslations({ locale, namespace: "navigation" });
  const copy = Object.fromEntries(
    [
      "previewMode",
      "yourMarketplace",
      "verified",
      "unverified",
      "greeting",
      "demoBody",
      "liveBody",
      "postListing",
      "explorePhones",
      "previewNote",
      "manageAds",
      "viewConversations",
      "yourSavedFilters",
      "trackRequests",
      "getInspected",
      "sellingOverview",
      "manageListings",
    ].map((key) => [key, t(key)]),
  );

  const signInHref = withCountryLocalePrefix(ROUTES.signIn, countryCode, locale);
  const links = {
    sell: withCountryLocalePrefix(ROUTES.sell, countryCode, locale),
    marketplace: withCountryLocalePrefix(ROUTES.marketplace, countryCode, locale),
    listings: withCountryLocalePrefix(ROUTES.myListings, countryCode, locale),
    orders: withCountryLocalePrefix(ROUTES.orders, countryCode, locale),
    favorites: withCountryLocalePrefix(ROUTES.favorites, countryCode, locale),
    messages: withCountryLocalePrefix(ROUTES.messages, countryCode, locale),
    savedSearches: withCountryLocalePrefix(ROUTES.savedSearches, countryCode, locale),
    inspections: withCountryLocalePrefix(ROUTES.inspections, countryCode, locale),
    account: withCountryLocalePrefix(ROUTES.account, countryCode, locale),
  };

  const session = await getCurrentSession();
  if (!session) redirect(signInHref);

  const { user } = session;
  const role = (user.role as UserRole | undefined) ?? USER_ROLES.USER;

  const [unread, sellerStats, inspectionCount] = await Promise.all([
    getUnreadCount(user.id),
    getStats(user.id),
    getMyInspectionCount(user.id),
  ]);

  const stats = [
    {
      icon: Package,
      label: tNav("myListings"),
      value: sellerStats.totalListings > 0 ? String(sellerStats.totalListings) : "—",
      hint: copy.manageAds,
      href: links.listings,
    },
    {
      icon: MessageSquare,
      label: tNav("messages"),
      value: unread > 0 ? String(unread) : "—",
      hint: unread > 0 ? copy.unread?.replace("{count}", String(unread)) ?? "" : copy.viewConversations,
      href: links.messages,
    },
    {
      icon: Bookmark,
      label: tNav("savedSearches"),
      value: "—",
      hint: copy.yourSavedFilters,
      href: links.savedSearches,
    },
    {
      icon: ShieldCheck,
      label: tNav("inspections"),
      value: inspectionCount > 0 ? String(inspectionCount) : "—",
      hint: inspectionCount > 0 ? copy.trackRequests : copy.getInspected,
      href: links.inspections,
    },
  ];

  const mobileActions = [
    {
      href: links.listings,
      label: tNav("myListings"),
      icon: Package,
      badge: sellerStats.totalListings > 0 ? sellerStats.totalListings : undefined,
      tone: "brand" as const,
    },
    {
      href: links.orders,
      label: tNav("orders"),
      icon: ShoppingBag,
      tone: "sky" as const,
    },
    {
      href: links.favorites,
      label: tNav("favorites"),
      icon: Heart,
      tone: "rose" as const,
    },
    {
      href: links.messages,
      label: tNav("messages"),
      icon: MessageSquare,
      badge: unread > 0 ? unread : undefined,
      tone: "violet" as const,
    },
    {
      href: links.savedSearches,
      label: tNav("savedSearches"),
      icon: Bookmark,
      tone: "amber" as const,
    },
    {
      href: links.inspections,
      label: tNav("inspections"),
      icon: ShieldCheck,
      badge: inspectionCount > 0 ? inspectionCount : undefined,
      tone: "emerald" as const,
    },
    { href: links.sell, label: tNav("sell"), icon: Plus, tone: "brand" as const },
    {
      href: links.marketplace,
      label: tNav("marketplace"),
      icon: LayoutGrid,
      tone: "sky" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-4 md:hidden">
        <MobileProfileCard
          name={user.name}
          email={user.email}
          image={user.image}
          role={role}
          verified={user.emailVerified}
          verifiedLabel={copy.verified}
          unverifiedLabel={copy.unverified}
          profileHref={links.account}
          title={copy.greeting?.replace("{name}", user.name.split(" ")[0] ?? user.name)}
        />
        <MobileQuickActions actions={mobileActions} label={tNav("dashboard")} />
      </div>

      <div className="hidden md:block">
        <DashboardHero
          name={user.name}
          email={user.email}
          role={role}
          emailVerified={user.emailVerified}
          copy={copy}
          links={links}
        />
      </div>

      <div className="workspace-stagger hidden gap-4 sm:grid-cols-2 lg:grid-cols-4 md:grid">
        {stats.map(({ icon: Icon, label, value, hint, href }) => (
          <Link
            key={label}
            href={href}
            className="focus-visible:ring-primary rounded-xl outline-none focus-visible:ring-2"
          >
            <Card className="hover:border-primary/40 h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <CardDescription>{hint}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="heading-6">{copy.sellingOverview}</h2>
          <Link href={links.listings} className="text-primary text-sm hover:underline">
            {copy.manageListings}
          </Link>
        </div>
        <SellerStatsCards stats={sellerStats} />
      </section>
    </div>
  );
}
