"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/lib/constants";
import { requireInspector } from "@/features/inspections/lib/require-inspector";
import {
  claimInspection,
  scheduleInspection,
  submitInspectionReport,
} from "@/features/inspections/services/inspection.service";
import {
  scheduleInspectionSchema,
  submitReportSchema,
  type ScheduleInspectionInput,
  type SubmitReportInput,
} from "@/features/inspections/schemas/inspection";

type ActionResult = { ok: boolean; error?: string };

const FORBIDDEN = "Inspector access required.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

function revalidateInspectorSurfaces() {
  revalidatePath(ROUTES.inspector);
}

/** Inspector claims an open request. */
export async function claimInspectionAction(input: { id: string }): Promise<ActionResult> {
  const inspector = await requireInspector();
  if (!inspector) return { ok: false, error: FORBIDDEN };

  try {
    const ok = await claimInspection(input.id, inspector.id);
    if (!ok) return { ok: false, error: "This request was already claimed." };
    revalidateInspectorSurfaces();
    return { ok: true };
  } catch (error) {
    console.error("[inspections] claim failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Inspector schedules a slot for a claimed request. */
export async function scheduleInspectionAction(
  input: ScheduleInspectionInput,
): Promise<ActionResult> {
  const inspector = await requireInspector();
  if (!inspector) return { ok: false, error: FORBIDDEN };

  const parsed = scheduleInspectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick a valid date & time." };

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false, error: "Pick a valid date & time." };
  }

  try {
    const ok = await scheduleInspection(parsed.data.requestId, inspector.id, scheduledAt);
    if (!ok) return { ok: false, error: "You can only schedule requests assigned to you." };
    revalidateInspectorSurfaces();
    return { ok: true };
  } catch (error) {
    console.error("[inspections] schedule failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** Inspector submits the graded report; the request completes. */
export async function submitReportAction(input: SubmitReportInput): Promise<ActionResult> {
  const inspector = await requireInspector();
  if (!inspector) return { ok: false, error: FORBIDDEN };

  const parsed = submitReportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please complete the report before submitting." };
  }

  try {
    const ok = await submitInspectionReport(parsed.data, inspector.id);
    if (!ok) {
      return { ok: false, error: "You can only report on requests assigned to you." };
    }
    revalidateInspectorSurfaces();
    return { ok: true };
  } catch (error) {
    console.error("[inspections] submit report failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
