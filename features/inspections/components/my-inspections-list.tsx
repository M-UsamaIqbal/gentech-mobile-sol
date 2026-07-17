"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, CheckCircle2, ChevronDown, CreditCard, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { INSPECTION_PAYMENT_STATUSES, INSPECTION_STATUSES, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { InspectionStatusBadge } from "@/features/inspections/components/inspection-status-badge";
import { InspectionReportView } from "@/features/inspections/components/inspection-report-view";
import {
  cancelInspectionAction,
  toggleReportPublishedAction,
} from "@/features/inspections/actions/inspection.actions";
import type { InspectionRequestDto } from "@/features/inspections/types";

const CANCELLABLE: string[] = [
  INSPECTION_STATUSES.REQUESTED,
  INSPECTION_STATUSES.PAYMENT_PENDING,
  INSPECTION_STATUSES.SCHEDULED,
];

/** Fee is collected once the request exists and before it's paid/closed. */
const PAYABLE: string[] = [
  INSPECTION_STATUSES.REQUESTED,
  INSPECTION_STATUSES.PAYMENT_PENDING,
  INSPECTION_STATUSES.SCHEDULED,
];

export function MyInspectionsList({ requests }: { requests: InspectionRequestDto[] }) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-muted-foreground text-sm">
          You haven&apos;t requested any inspections yet. Open a listing and tap{" "}
          <span className="font-medium">Request an inspection</span> to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <InspectionCard key={request.id} request={request} />
      ))}
    </div>
  );
}

function InspectionCard({ request }: { request: InspectionRequestDto }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleCancel() {
    if (!window.confirm("Cancel this inspection request?")) return;
    setPending(true);
    const result = await cancelInspectionAction({ id: request.id });
    setPending(false);
    if (result.ok) {
      toast.success("Inspection cancelled.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not cancel.");
    }
  }

  async function handleTogglePublish() {
    if (!request.report) return;
    setPending(true);
    const result = await toggleReportPublishedAction({
      reportId: request.report.id,
      isPublished: !request.report.isPublished,
    });
    setPending(false);
    if (result.ok) {
      toast.success(
        request.report.isPublished
          ? "Report hidden from the listing."
          : "Report published to the listing.",
      );
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not update the report.");
    }
  }

  const canCancel = CANCELLABLE.includes(request.status);
  const isPaid = request.paymentStatus === INSPECTION_PAYMENT_STATUSES.PAID;
  const canPay = !isPaid && PAYABLE.includes(request.status);

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <InspectionStatusBadge status={request.status} />
            {request.planName ? (
              <span className="text-muted-foreground text-xs">{request.planName}</span>
            ) : null}
          </div>
          <h3 className="mt-2 font-semibold">
            {request.listing ? (
              <Link href={`/listings/${request.listing.slug}`} className="hover:underline">
                {request.listing.title}
              </Link>
            ) : (
              (request.deviceInfo ?? "Inspection request")
            )}
          </h3>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span>{formatPrice(request.feeAmount, { currency: request.currency })}</span>
            {isPaid ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                <CheckCircle2 className="size-3.5" />
                Paid
                {request.paymentMethod ? ` · ${request.paymentMethod}` : ""}
              </span>
            ) : null}
            {request.scheduledAt ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" />
                {new Date(request.scheduledAt).toLocaleString("en-PK")}
              </span>
            ) : null}
          </p>
          {request.inspector ? (
            <p className="text-muted-foreground mt-0.5 text-xs">
              Inspector: {request.inspector.name}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          {canPay ? (
            <Link
              href={`${ROUTES.inspectionService}/pay/${request.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <CreditCard className="size-3.5" />
              Pay now
            </Link>
          ) : null}
          {canCancel ? (
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={pending}>
              Cancel
            </Button>
          ) : null}
          {request.report ? (
            <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)}>
              View report
              <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
            </Button>
          ) : null}
        </div>
      </div>

      {request.report && open ? (
        <div className="mt-4 border-t pt-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">
              {request.report.isPublished
                ? "This report is visible on the listing."
                : "This report is private to you."}
            </p>
            <Button variant="outline" size="sm" onClick={handleTogglePublish} disabled={pending}>
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : request.report.isPublished ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {request.report.isPublished ? "Hide from listing" : "Publish to listing"}
            </Button>
          </div>
          <InspectionReportView report={request.report} />
        </div>
      ) : null}
    </div>
  );
}
