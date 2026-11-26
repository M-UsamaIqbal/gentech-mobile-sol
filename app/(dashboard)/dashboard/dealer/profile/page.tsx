import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DealerProfileForm } from "@/features/dealer/components/dealer-profile-form";
import { getUserDealer } from "@/features/dealer/services/dealer.service";
import { ROUTES } from "@/lib/constants";
import { getCurrentSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dealer Profile",
  robots: { index: false, follow: false },
};

export default async function DealerProfilePage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.signIn);

  const { user } = session;

  const dealer = await getUserDealer(user.id);
  if (!dealer) redirect(ROUTES.dealerApply);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={ROUTES.dealerDashboard}
        className="text-muted-foreground hover:text-foreground inline-flex min-h-10 items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dealer dashboard
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">Business settings</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Dealer profile</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Keep your storefront and business contact information up to date.
          </p>
        </div>
        <Badge variant={dealer.status === "ACTIVE" ? "default" : "secondary"}>
          {dealer.status}
        </Badge>
      </header>

      {dealer.status === "PENDING" ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="flex-row items-start gap-3 space-y-0">
            <Clock3
              className="mt-0.5 size-5 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <CardTitle className="text-base">Application under review</CardTitle>
              <CardDescription>
                You can update your profile while your dealer application is pending review.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      {dealer.status === "REJECTED" ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base">Application not approved</CardTitle>
            <CardDescription>
              Update your business details and save to resubmit your application.
              {dealer.reviewNote ? ` Reviewer note: ${dealer.reviewNote}` : ""}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="rounded-2xl">
        <CardContent className="p-5 sm:p-8">
          <DealerProfileForm dealer={dealer} />
        </CardContent>
      </Card>
    </div>
  );
}
