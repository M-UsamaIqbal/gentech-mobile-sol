import type { Metadata } from "next";

import { requireAdmin } from "@/features/admin/lib/require-admin";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { listAllPlans } from "@/features/inspections/repositories/inspection.repository";
import { AdminPlansManager } from "@/features/inspections/components/admin-plans-manager";
import type { InspectionPlanDto } from "@/features/inspections/types";

export const metadata: Metadata = {
  title: "Inspection Packages · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminInspectionsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  let plans: InspectionPlanDto[] = [];
  let loadError: string | null = null;
  try {
    plans = await listAllPlans();
  } catch (error) {
    console.warn("[admin] could not load inspection plans:", error);
    loadError = "Inspection packages could not be loaded. Try again or check the server logs.";
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-emerald-300 uppercase">
          Marketplace operations
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Inspection packages
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage the pricing tiers buyers choose when requesting an inspection.
        </p>
      </div>
      <AdminPlansManager plans={plans} loadError={loadError} />
    </div>
  );
}
