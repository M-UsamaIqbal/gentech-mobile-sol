"use server";

import { revalidatePath, updateTag } from "next/cache";

import { requireAdmin } from "@/features/admin/lib/require-admin";
import { logAudit } from "@/features/audit";
import { CACHE_TAGS } from "@/lib/cache";
import { ROUTES } from "@/lib/constants";
import { createPlan, updatePlan } from "../services/promotion.service";
import { createPromotionPlanSchema, updatePromotionPlanSchema } from "../schemas/promotion";

type ActionResult = { ok: true } | { ok: false; error: string };

function validationError(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? "Invalid promotion plan.";
}

export async function createPromotionPlanAction(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized: Admin privileges required." };

  const parsed = createPromotionPlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationError(parsed.error) };

  try {
    const plan = await createPlan(parsed.data);
    await logAudit({
      actorId: admin.id,
      action: "PROMOTION_PLAN_CREATED",
      resource: "PromotionPlan",
      resourceId: plan.id,
      after: {
        name: plan.name,
        placement: plan.placement,
        price: plan.price,
        durationDays: plan.durationDays,
        isActive: plan.isActive,
      },
    });
    revalidatePath(ROUTES.adminPromotions);
    revalidatePath(ROUTES.dashboard);
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (error) {
    console.error("[promotions] create plan failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Could not create plan." };
  }
}

export async function updatePromotionPlanAction(input: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized: Admin privileges required." };

  const parsed = updatePromotionPlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationError(parsed.error) };

  const { id, ...data } = parsed.data;
  try {
    const plan = await updatePlan(id, data);
    await logAudit({
      actorId: admin.id,
      action: "PROMOTION_PLAN_UPDATED",
      resource: "PromotionPlan",
      resourceId: plan.id,
      after: {
        name: plan.name,
        placement: plan.placement,
        price: plan.price,
        durationDays: plan.durationDays,
        maxSlots: plan.maxSlots,
        isActive: plan.isActive,
      },
    });
    revalidatePath(ROUTES.adminPromotions);
    revalidatePath(ROUTES.dashboard);
    updateTag(CACHE_TAGS.catalog);
    return { ok: true };
  } catch (error) {
    console.error("[promotions] update plan failed:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Could not update plan." };
  }
}
