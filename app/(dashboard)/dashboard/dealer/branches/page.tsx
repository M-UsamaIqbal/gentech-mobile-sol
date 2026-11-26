import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchManager } from "@/features/dealer/components/branch-manager";
import { getDealerBranches, getUserDealer } from "@/features/dealer/services/dealer.service";
import { ROUTES } from "@/lib/constants";
import { getCurrentSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dealer Branches",
  robots: { index: false, follow: false },
};

export default async function DealerBranchesPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.signIn);

  const dealer = await getUserDealer(session.user.id);
  if (!dealer) redirect(ROUTES.dealerApply);

  const canManage = dealer.status === "ACTIVE" && dealer.isVerified;
  const branches = canManage ? await getDealerBranches(dealer.id) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href={ROUTES.dealerDashboard}
        className="text-muted-foreground hover:text-foreground inline-flex min-h-10 items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dealer dashboard
      </Link>
      <header>
        <p className="text-muted-foreground text-sm">Store operations</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Branch locations</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          Keep your store locations up to date so customers know where to find you.
        </p>
      </header>

      {canManage ? (
        <BranchManager dealerId={dealer.id} branches={branches} />
      ) : (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="size-4" aria-hidden="true" />
              Branch management is locked
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Branches become available after your dealer profile is approved and verified. Current
            status: <strong className="text-foreground">{dealer.status}</strong>.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
