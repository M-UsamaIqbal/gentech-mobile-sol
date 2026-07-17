import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, MessageSquare, Package, ShieldCheck } from "lucide-react";

import { ROUTES, USER_ROLES, type UserRole } from "@/lib/constants";
import { getCurrentSession } from "@/lib/session";
import { getUnreadCount } from "@/features/messaging/services/conversation.service";
import { getStats } from "@/features/seller/services/seller.service";
import { getMyInspectionCount } from "@/features/inspections/services/inspection.service";
import { SellerStatsCards } from "@/features/seller/components/seller-stats";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

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
      hint: inspectionCount > 0 ? "Track your requests" : "Get a phone inspected",
      href: ROUTES.inspections,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={role === USER_ROLES.ADMIN ? "default" : "secondary"}>
            {role === USER_ROLES.ADMIN ? <ShieldCheck className="size-3.5" /> : null}
            {role}
          </Badge>
          {user.emailVerified ? (
            <Badge variant="outline" className="text-green-600 dark:text-green-400">
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 dark:text-amber-400">
              Unverified
            </Badge>
          )}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ icon: Icon, label, value, hint, href }) => (
          <Link key={label} href={href} className="rounded-xl focus-visible:ring-2 outline-none">
            <Card className="hover:border-primary/40 transition-colors">
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
