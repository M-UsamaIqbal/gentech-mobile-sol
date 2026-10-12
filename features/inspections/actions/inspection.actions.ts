"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import {
  bookInspection,
  cancelInspection,
  requestInspection,
  toggleReportPublished,
} from "@/features/inspections/services/inspection.service";
import {
  bookInspectionSchema,
  requestInspectionSchema,
  type BookInspectionInput,
  type RequestInspectionInput,
} from "@/features/inspections/schemas/inspection";
import { isPhoneVerifiedForBooking } from "@/features/inspections/otp/otp.service";

type ActionResult = { ok: boolean; error?: string; id?: string };

const SIGN_IN_REQUIRED = "Sign in to request an inspection.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

/** Buyer books an inspection for a listing. */
export async function requestInspectionAction(
  input: RequestInspectionInput,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };
  if (!user.emailVerified) {
    return { ok: false, error: "Please verify your email before requesting an inspection." };
  }

  const parsed = requestInspectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }

  const phoneVerified = await isPhoneVerifiedForBooking(user.id, parsed.data.contactPhone);
  if (!phoneVerified) {
    return { ok: false, error: "Please verify your phone number before requesting." };
  }

  try {
    const id = await requestInspection(parsed.data, user.id);
    revalidatePath(ROUTES.inspections);
    return { ok: true, id };
  } catch (error) {
    console.error("[inspections] request failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : GENERIC_ERROR,
    };
  }
}

/** Buyer books a standalone inspection (describes the phone; no listing needed). */
export async function bookInspectionAction(input: BookInspectionInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };
  if (!user.emailVerified) {
    return { ok: false, error: "Please verify your email before requesting an inspection." };
  }

  const parsed = bookInspectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields and try again." };
  }

  const phoneVerified = await isPhoneVerifiedForBooking(user.id, parsed.data.contactPhone);
  if (!phoneVerified) {
    return { ok: false, error: "Please verify your phone number before booking." };
  }

  try {
    const id = await bookInspection(parsed.data, user.id);
    revalidatePath(ROUTES.inspections);
    return { ok: true, id };
  } catch (error) {
    console.error("[inspections] booking failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : GENERIC_ERROR };
  }
}

const cancelSchema = z.object({
  id: z.string().min(1),
  reason: z.string().trim().max(300).optional(),
});

/** Buyer cancels their own request. */
export async function cancelInspectionAction(input: {
  id: string;
  reason?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = cancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  try {
    const ok = await cancelInspection(parsed.data.id, user.id, parsed.data.reason);
    if (!ok) return { ok: false, error: "This request can no longer be cancelled." };
    revalidatePath(ROUTES.inspections);
    return { ok: true };
  } catch (error) {
    console.error("[inspections] cancel failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

const publishSchema = z.object({
  reportId: z.string().min(1),
  isPublished: z.boolean(),
});

/** Buyer publishes/unpublishes their report onto the listing. */
export async function toggleReportPublishedAction(input: {
  reportId: string;
  isPublished: boolean;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: SIGN_IN_REQUIRED };

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  try {
    const ok = await toggleReportPublished(
      parsed.data.reportId,
      user.id,
      parsed.data.isPublished,
    );
    if (!ok) return { ok: false, error: "Report not found." };
    revalidatePath(ROUTES.inspections);
    // The listing detail page renders dynamically (view counter), so the badge
    // updates on next visit — no extra revalidation needed.
    return { ok: true };
  } catch (error) {
    console.error("[inspections] publish toggle failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
