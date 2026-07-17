import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ROUTES, USER_ROLES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getInspectorQueue } from "@/features/inspections/services/inspection.service";
import { InspectorQueue } from "@/features/inspections/components/inspector-queue";

export const metadata: Metadata = { title: "Inspector Workspace" };

export default async function InspectorPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  // Admins see every request; inspectors see open + their assigned work.
  const isAdmin = (user.role as string | undefined) === USER_ROLES.ADMIN;
  const requests = await getInspectorQueue(user.id, { all: isAdmin });

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Claim open requests, schedule a visit, then submit the graded report.
      </p>
      <InspectorQueue requests={requests} inspectorId={user.id} />
    </div>
  );
}
