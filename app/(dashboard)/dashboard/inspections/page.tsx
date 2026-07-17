import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getMyInspections } from "@/features/inspections/services/inspection.service";
import { MyInspectionsList } from "@/features/inspections/components/my-inspections-list";

export const metadata: Metadata = { title: "My Inspections" };

export default async function MyInspectionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const requests = await getMyInspections(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Inspections</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track your inspection requests and share the reports on their listings.
        </p>
      </div>
      <MyInspectionsList requests={requests} />
    </div>
  );
}
