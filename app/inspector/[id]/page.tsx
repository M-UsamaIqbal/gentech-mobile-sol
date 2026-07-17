import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ROUTES, USER_ROLES } from "@/lib/constants";
import { formatPrice } from "@/utils/format";
import { getCurrentUser } from "@/lib/session";
import { getInspection } from "@/features/inspections/services/inspection.service";
import { SubmitReportForm } from "@/features/inspections/components/submit-report-form";
import { InspectionReportView } from "@/features/inspections/components/inspection-report-view";
import { InspectionStatusBadge } from "@/features/inspections/components/inspection-status-badge";

export const metadata: Metadata = { title: "Inspection report" };

type PageProps = { params: Promise<{ id: string }> };

export default async function InspectorReportPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const request = await getInspection(id);
  if (!request) notFound();

  const isAdmin = (user.role as string | undefined) === USER_ROLES.ADMIN;
  const isAssigned = request.inspector?.id === user.id;
  // Only the assigned inspector (or an admin) may view/submit this report.
  if (!isAssigned && !isAdmin) redirect(ROUTES.inspector);

  return (
    <div className="space-y-6">
      <Link
        href={ROUTES.inspector}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Back to queue
      </Link>

      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <InspectionStatusBadge status={request.status} />
          {request.planName ? (
            <span className="text-muted-foreground text-xs">{request.planName}</span>
          ) : null}
        </div>
        <h1 className="mt-2 text-xl font-bold tracking-tight">
          {request.listing?.title ?? request.deviceInfo ?? "Inspection request"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {formatPrice(request.feeAmount, { currency: request.currency })}
          {request.city ? ` · ${request.area ? `${request.area}, ` : ""}${request.city}` : ""}
          {request.contactName ? ` · ${request.contactName}` : ""}
          {request.contactPhone ? ` · ${request.contactPhone}` : ""}
        </p>
      </div>

      {request.report ? (
        <div className="bg-card rounded-xl border p-5">
          <h2 className="mb-4 text-lg font-semibold">Submitted report</h2>
          <InspectionReportView report={request.report} />
        </div>
      ) : (
        <div className="bg-card rounded-xl border p-5">
          <h2 className="mb-4 text-lg font-semibold">Complete the inspection</h2>
          <SubmitReportForm requestId={request.id} />
        </div>
      )}
    </div>
  );
}
