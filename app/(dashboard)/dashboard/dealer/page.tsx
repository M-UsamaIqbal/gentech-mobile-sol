import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Users, Package, MapPin, TrendingUp } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { getCurrentSession } from "@/lib/session";
import { getUserDealer, getDealerStats } from "@/features/dealer/services/dealer.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dealer Dashboard",
  robots: { index: false, follow: false },
};

export default async function DealerDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.signIn);

  const { user } = session;

  const dealer = await getUserDealer(user.id);

  if (!dealer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dealer Dashboard</h1>
          <p className="text-muted-foreground text-sm">Manage your dealership</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Not a Dealer</CardTitle>
            <CardDescription>
              You don&apos;t have a dealer account yet. Apply to become a dealer to access advanced
              features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.dealerApply}>
              <Badge variant="outline" className="cursor-pointer">
                Apply for Dealer Account
              </Badge>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = await getDealerStats(dealer.id);

  const dashboardStats = [
    {
      icon: Package,
      label: "Total Listings",
      value: String(stats.totalListings),
      hint: "Active and inactive listings",
    },
    {
      icon: Users,
      label: "Staff Members",
      value: String(stats.staffCount),
      hint: "Active team members",
    },
    {
      icon: MapPin,
      label: "Branches",
      value: String(stats.branchCount),
      hint: "Operating locations",
    },
    {
      icon: TrendingUp,
      label: "Items Sold",
      value: String(stats.soldCount),
      hint: "Total sales count",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="surface-flat workspace-hero flex flex-wrap items-end justify-between gap-6 rounded-2xl p-5 sm:p-8">
        <div className="max-w-[680px]">
          <p className="caption-3 text-muted-foreground uppercase tracking-wide">Dealer workspace</p>
          <h1 className="heading-4 mt-2">{dealer.name}</h1>
          <p className="body-3 text-muted-foreground mt-2">{dealer.businessName || dealer.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={dealer.status === "ACTIVE" ? "default" : "secondary"}>
            {dealer.status}
          </Badge>
          {dealer.isVerified && (
            <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400">
              Verified
            </Badge>
          )}
          <Badge variant="outline">{dealer.plan}</Badge>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map(({ icon: Icon, label, value, hint }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="title-4">{label}</CardTitle>
              <Icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="heading-5">{value}</div>
              <CardDescription className="caption-2">{hint}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="heading-6">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Link
              href={ROUTES.dealerProfile}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              <Building2 className="size-4" />
              Edit profile
            </Link>
            <Link
              href={ROUTES.dealerBranches}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              <MapPin className="size-4" />
              Manage branches
            </Link>
            <Link
              href={ROUTES.dealerInventory}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              <Package className="size-4" />
              Manage inventory
            </Link>
            <Link
              href={`${ROUTES.dashboard}/dealer/staff`}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              <Users className="size-4" />
              Manage staff
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="heading-6">Dealer information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between gap-4">
              <span className="caption-2 text-muted-foreground">Business name</span>
              <span className="title-4">{dealer.businessName || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="caption-2 text-muted-foreground">Business type</span>
              <span className="title-4">{dealer.businessType || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="caption-2 text-muted-foreground">Phone</span>
              <span className="title-4" dir="ltr">{dealer.phone || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="caption-2 text-muted-foreground">Email</span>
              <span className="title-4" dir="ltr">{dealer.email || "—"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="caption-2 text-muted-foreground">City</span>
              <span className="title-4">{dealer.city || "—"}</span>
            </div>
            {dealer.planExpiresAt && (
              <div className="flex justify-between gap-4">
                <span className="caption-2 text-muted-foreground">Plan expires</span>
                <span className="font-medium">
                  {new Date(dealer.planExpiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
