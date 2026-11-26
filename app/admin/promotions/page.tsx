import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeDollarSign } from "lucide-react";

import { AdminPromotionPlans } from "@/features/promotions/components/admin-promotion-plans";
import { getAllPlans } from "@/features/promotions/services/promotion.service";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Promotions — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPromotionsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const plans = await getAllPlans();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
            <BadgeDollarSign className="size-4" aria-hidden="true" />
            Monetization
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Promotion packages
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Configure the placement, duration, and PKR price available to sellers. Payment
            processing remains a separate integration.
          </p>
        </div>
        <div className="rounded-lg border border-white/[0.08] bg-[#1F1F1F] px-4 py-3">
          <p className="text-xs text-slate-400">Active packages</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">
            {plans.filter((plan) => plan.isActive).length}
            <span className="ml-1 text-sm font-normal text-slate-500">/ {plans.length}</span>
          </p>
        </div>
      </header>

      <AdminPromotionPlans plans={plans} />
    </div>
  );
}
