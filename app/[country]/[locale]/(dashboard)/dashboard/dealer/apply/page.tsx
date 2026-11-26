import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, Clock3, Store } from "lucide-react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { DealerProfileForm } from "@/features/dealer/components/dealer-profile-form";
import { getUserDealer } from "@/features/dealer/services/dealer.service";
import { ROUTES } from "@/lib/constants";
import { getCurrentSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Apply for a Dealer Account",
  robots: { index: false, follow: false },
};

export default async function DealerApplyPage() {
  const session = await getCurrentSession();
  if (!session) redirect(ROUTES.signIn);

  const { user } = session;

  const dealer = await getUserDealer(user.id);
  if (dealer) redirect(ROUTES.dealerDashboard);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={ROUTES.dashboard}
        className="text-muted-foreground hover:text-foreground inline-flex min-h-10 items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <section className="rounded-2xl border border-white/10 bg-[#181818] p-6 text-white sm:p-9">
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-200/10 px-3 py-1 text-xs font-medium text-emerald-100">
            <Store className="size-3.5" aria-hidden="true" />
            GenTech for businesses
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Bring your store to more phone buyers.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Create a dealer profile to manage your business on GenTech. We’ll review your
            application before activating dealer features.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-200 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="size-4 text-emerald-300" aria-hidden="true" />
              Business profile
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-emerald-300" aria-hidden="true" />
              Review before activation
            </span>
          </div>
        </div>
      </section>

      <Card className="rounded-2xl">
        <CardContent className="p-5 sm:p-8">
          <div className="mb-7">
            <h2 className="text-xl font-semibold">Dealer application</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Add your store and contact details. You can update these later.
            </p>
          </div>
          <DealerProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
