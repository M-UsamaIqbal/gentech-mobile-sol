import type { Metadata } from "next";

import { requireAdmin } from "@/features/admin/lib/require-admin";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { listAllPlans } from "@/features/inspections/repositories/inspection.repository";
import { AdminPlansManager } from "@/features/inspections/components/admin-plans-manager";
import type { InspectionPlanDto } from "@/features/inspections/types";

export const metadata: Metadata = { title: "Inspection Packages · Admin" };

export default async function AdminInspectionsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  let plans: InspectionPlanDto[] = [];
  try {
    plans = await listAllPlans();
  } catch (error) {
    console.warn("[admin] could not load inspection plans:", error);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Inspection Packages</h2>
        <p className="text-muted-foreground text-sm">
          Manage the pricing tiers buyers choose when requesting an inspection.
        </p>
      </div>
      <AdminPlansManager plans={plans} />
    </div>
  );
}
