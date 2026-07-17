import "server-only";

import { NOTIFICATION_TYPES, ROUTES } from "@/lib/constants";
import { dispatchNotification } from "@/features/notifications/services/notification.service";
import {
  assignInspector,
  cancelRequest,
  countRequestsForRequester,
  createBooking,
  createReport,
  createRequest,
  getPublishedReportForListing,
  getRequestById,
  listActivePlans,
  listInspectorQueue,
  listRequestsForRequester,
  scheduleRequest,
  setReportPublished,
} from "@/features/inspections/repositories/inspection.repository";
import type {
  InspectionPlanDto,
  InspectionReportDto,
  InspectionRequestDto,
} from "@/features/inspections/types";
import type {
  BookInspectionInput,
  RequestInspectionInput,
  SubmitReportInput,
} from "@/features/inspections/schemas/inspection";

function warn(scope: string, error: unknown): void {
  console.warn(`[inspections] ${scope}:`, error instanceof Error ? error.message : error);
}

/** Active packages for the request form + pricing page. Empty on any failure. */
export async function getInspectionPlans(): Promise<InspectionPlanDto[]> {
  try {
    return await listActivePlans();
  } catch (error) {
    warn("could not load plans", error);
    return [];
  }
}

/** A buyer's own inspection requests. Empty on any failure. */
export async function getMyInspections(requesterId: string): Promise<InspectionRequestDto[]> {
  try {
    return await listRequestsForRequester(requesterId);
  } catch (error) {
    warn("could not load requests", error);
    return [];
  }
}

/** Count of a buyer's inspection requests (dashboard tile). 0 on any failure. */
export async function getMyInspectionCount(requesterId: string): Promise<number> {
  try {
    return await countRequestsForRequester(requesterId);
  } catch (error) {
    warn("could not count requests", error);
    return 0;
  }
}

/** The inspector work queue (or every request when `all`). Empty on any failure. */
export async function getInspectorQueue(
  inspectorId: string,
  opts?: { all?: boolean },
): Promise<InspectionRequestDto[]> {
  try {
    return await listInspectorQueue(inspectorId, opts);
  } catch (error) {
    warn("could not load queue", error);
    return [];
  }
}

/** Single request (authorization enforced by the caller/action). Null on failure. */
export async function getInspection(id: string): Promise<InspectionRequestDto | null> {
  try {
    return await getRequestById(id);
  } catch (error) {
    warn("could not load request", error);
    return null;
  }
}

/** The published inspection report attached to a listing, if any. Null on failure. */
export async function getListingInspectionReport(
  listingId: string,
): Promise<InspectionReportDto | null> {
  try {
    return await getPublishedReportForListing(listingId);
  } catch (error) {
    warn("could not load listing report", error);
    return null;
  }
}

/** Books a new inspection from a listing. Returns the new request id. */
export async function requestInspection(
  input: RequestInspectionInput,
  requesterId: string,
): Promise<string> {
  return createRequest(input, requesterId);
}

/** Standalone booking — buyer describes the phone. Returns the new request id. */
export async function bookInspection(
  input: BookInspectionInput,
  requesterId: string,
): Promise<string> {
  return createBooking(input, requesterId);
}

/** Buyer cancels their request. */
export async function cancelInspection(
  id: string,
  requesterId: string,
  reason?: string,
): Promise<boolean> {
  return cancelRequest(id, requesterId, reason);
}

/** Inspector claims an open request. */
export async function claimInspection(id: string, inspectorId: string): Promise<boolean> {
  return assignInspector(id, inspectorId);
}

/** Inspector schedules a slot, then notifies the buyer. */
export async function scheduleInspection(
  id: string,
  inspectorId: string,
  scheduledAt: Date,
): Promise<boolean> {
  const ok = await scheduleRequest(id, inspectorId, scheduledAt);
  if (!ok) return false;

  const request = await getRequestById(id).catch(() => null);
  if (request) {
    await dispatchNotification({
      userId: request.requester.id,
      type: NOTIFICATION_TYPES.INSPECTION_SCHEDULED,
      title: "Your inspection is scheduled",
      body: `We'll inspect ${request.listing?.title ?? "the phone"} on ${scheduledAt.toLocaleString("en-PK")}.`,
      url: ROUTES.inspections,
      email: true,
    }).catch((error) => warn("schedule notification failed", error));
  }
  return true;
}

/** Inspector submits the report; the request completes and the buyer is notified. */
export async function submitInspectionReport(
  input: SubmitReportInput,
  inspectorId: string,
): Promise<boolean> {
  const result = await createReport(input, inspectorId);
  if (!result) return false;

  await dispatchNotification({
    userId: result.requesterId,
    type: NOTIFICATION_TYPES.INSPECTION_COMPLETED,
    title: "Your inspection report is ready",
    body: "The inspector has completed the check. View the full graded report.",
    url: ROUTES.inspections,
    email: true,
  }).catch((error) => warn("completion notification failed", error));

  return true;
}

/** Buyer publishes/unpublishes their report onto the listing. */
export async function toggleReportPublished(
  reportId: string,
  requesterId: string,
  isPublished: boolean,
): Promise<boolean> {
  return setReportPublished(reportId, requesterId, isPublished);
}
