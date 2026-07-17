"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ClipboardCheck, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

import { INSPECTION_STATUSES, ROUTES } from "@/lib/constants";
import { formatPrice } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InspectionStatusBadge } from "@/features/inspections/components/inspection-status-badge";
import {
  claimInspectionAction,
  scheduleInspectionAction,
} from "@/features/inspections/actions/inspector.actions";
import type { InspectionRequestDto } from "@/features/inspections/types";

export function InspectorQueue({
  requests,
  inspectorId,
}: {
  requests: InspectionRequestDto[];
  inspectorId: string;
}) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-muted-foreground text-sm">No inspection requests in your queue.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <QueueItem key={request.id} request={request} inspectorId={inspectorId} />
      ))}
    </div>
  );
}

function QueueItem({
  request,
  inspectorId,
}: {
  request: InspectionRequestDto;
  inspectorId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [slot, setSlot] = React.useState("");

  const mine = request.inspector?.id === inspectorId;
  const unassigned = !request.inspector;
  const hasReport = Boolean(request.report);
  const canSchedule =
    mine &&
    (request.status === INSPECTION_STATUSES.REQUESTED ||
      request.status === INSPECTION_STATUSES.PAYMENT_PENDING ||
      request.status === INSPECTION_STATUSES.SCHEDULED);
  const canReport =
    mine && !hasReport && request.status !== INSPECTION_STATUSES.CANCELLED;

  async function claim() {
    setPending(true);
    const result = await claimInspectionAction({ id: request.id });
    setPending(false);
    if (result.ok) {
      toast.success("Assigned to you.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not claim.");
    }
  }

  async function schedule() {
    if (!slot) {
      toast.error("Pick a date & time first.");
      return;
    }
    setPending(true);
    const result = await scheduleInspectionAction({
      requestId: request.id,
      scheduledAt: new Date(slot).toISOString(),
    });
    setPending(false);
    if (result.ok) {
      toast.success("Scheduled. The buyer has been notified.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not schedule.");
    }
  }

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
          <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>{formatPrice(request.feeAmount, { currency: request.currency })}</span>
            {request.city ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {request.area ? `${request.area}, ` : ""}
                {request.city}
              </span>
            ) : null}
            {request.contactPhone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" />
                {request.contactPhone}
              </span>
            ) : null}
            {request.scheduledAt ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" />
                {new Date(request.scheduledAt).toLocaleString("en-PK")}
              </span>
            ) : null}
          </div>
          {request.notes ? (
            <p className="text-muted-foreground mt-2 text-sm">“{request.notes}”</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {unassigned ? (
            <Button size="sm" onClick={claim} disabled={pending}>
              Claim
            </Button>
          ) : null}
          {canReport ? (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`${ROUTES.inspector}/${request.id}`} />}
            >
              <ClipboardCheck className="size-3.5" />
              Write report
            </Button>
          ) : null}
          {hasReport ? (
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`${ROUTES.inspector}/${request.id}`} />}
            >
              View report
            </Button>
          ) : null}
        </div>
      </div>

      {canSchedule ? (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
          <Input
            type="datetime-local"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            className="max-w-56"
          />
          <Button size="sm" variant="secondary" onClick={schedule} disabled={pending}>
            {request.status === INSPECTION_STATUSES.SCHEDULED ? "Reschedule" : "Schedule"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
