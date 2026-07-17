"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ROUTES } from "@/lib/constants";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import {
  createPlan,
  setPlanActive,
  updatePlan,
} from "@/features/inspections/repositories/inspection.repository";
import {
  inspectionPlanSchema,
  type InspectionPlanInput,
} from "@/features/inspections/schemas/inspection";

type ActionResult = { ok: boolean; error?: string };

const FORBIDDEN = "Admin access required.";
const GENERIC_ERROR = "Something went wrong. Please try again.";

function revalidatePlans() {
  revalidatePath(ROUTES.adminInspections);
  revalidatePath(ROUTES.inspectionService);
}

/** Admin creates an inspection package. */
export async function createPlanAction(input: InspectionPlanInput): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };

  const parsed = inspectionPlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields." };

  try {
    await createPlan(parsed.data);
    revalidatePlans();
    return { ok: true };
  } catch (error) {
    console.error("[inspections] create plan failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

const updateSchema = inspectionPlanSchema.extend({ id: z.string().min(1) });

/** Admin edits an inspection package. */
export async function updatePlanAction(
  input: InspectionPlanInput & { id: string },
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields." };

  try {
    const { id, ...data } = parsed.data;
    await updatePlan(id, data);
    revalidatePlans();
    return { ok: true };
  } catch (error) {
    console.error("[inspections] update plan failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

const toggleSchema = z.object({ id: z.string().min(1), isActive: z.boolean() });

/** Admin activates/deactivates an inspection package. */
export async function setPlanActiveAction(input: {
  id: string;
  isActive: boolean;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: FORBIDDEN };

  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  try {
    await setPlanActive(parsed.data.id, parsed.data.isActive);
    revalidatePlans();
    return { ok: true };
  } catch (error) {
    console.error("[inspections] toggle plan failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
