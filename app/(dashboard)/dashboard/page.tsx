import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bookmark, MessageSquare, Package, Plus, ShieldCheck } from "lucide-react";

import { ROUTES, USER_ROLES, type UserRole } from "@/lib/constants";
import { getCurrentSession } from "@/lib/session";
import { getUnreadCount } from "@/features/messaging/services/conversation.service";
import { getStats } from "@/features/seller/services/seller.service";
import { getMyInspectionCount } from "@/features/inspections/services/inspection.service";
import { SellerStatsCards } from "@/features/seller/components/seller-stats";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

function DashboardHero({
  name,
  email,
  role,
  emailVerified,
}: {
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}) {
  return (
    <section
      aria-labelledby="dashboard-welcome"
      className="workspace-hero rounded-2xl border border-white/10 bg-[#181818] p-5 text-white sm:p-8"
    >
      <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold tracking-[0.16em] text-emerald-200 uppercase">
              Your marketplace
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
              {emailVerified ? "Verified" : "Unverified"}
            </Badge>
          </div>
          <h1
            id="dashboard-welcome"
            className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            Good to see you, {name.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Your next great find—or your next sale—starts here. Keep your listings, messages, and
            saved searches moving.
          </p>
          <p className="mt-3 text-xs text-slate-400">{email}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={ROUTES.sell}
            className={cn(
              buttonVariants({ size: "sm" }),
              "min-h-10 rounded-full bg-emerald-300 px-4 font-semibold text-slate-950 hover:bg-emerald-200",
            )}
          >
            <Plus className="size-4" />
            Post a listing
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white transition-colors hover:bg-white/[0.12]"
          >
            Explore phones <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.signIn);

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
      label: "My Listings",
      value: sellerStats.totalListings > 0 ? String(sellerStats.totalListings) : "—",
      hint: "Manage your ads",
      href: ROUTES.myListings,
    },
    {
      icon: MessageSquare,
      label: "Messages",
      value: unread > 0 ? String(unread) : "—",
      hint: unread > 0 ? `${unread} unread` : "View conversations",
      href: ROUTES.messages,
    },
    {
      icon: Bookmark,
      label: "Saved Searches",
      value: "—",
      hint: "Your saved filters",
      href: ROUTES.savedSearches,
    },
    {
      icon: ShieldCheck,
      label: "Inspections",
      value: inspectionCount > 0 ? String(inspectionCount) : "—",
      hint: inspectionCount > 0 ? "Track your requests" : "Get a device inspected",
      href: ROUTES.inspections,
    },
  ];

  return (
    <div className="space-y-8">
      <DashboardHero
        name={user.name}
        email={user.email}
        role={role}
        emailVerified={user.emailVerified}
      />

      <div className="workspace-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <h2 className="text-lg font-semibold">Selling overview</h2>
          <Link href={ROUTES.myListings} className="text-primary text-sm hover:underline">
            Manage listings
          </Link>
        </div>
        <SellerStatsCards stats={sellerStats} />
      </section>
    </div>
  );
}
