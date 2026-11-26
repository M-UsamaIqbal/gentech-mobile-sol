"use server";

import { revalidatePath } from "next/cache";

import { logAudit } from "@/features/audit";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { ROUTES } from "@/lib/constants";
import { approveDealerSchema, rejectDealerSchema } from "../schemas/admin-review";
import { reviewDealerApplicationStatus } from "../services/dealer.service";

type ActionResult = { ok: true } | { ok: false; error: string };

async function review(input: {
  dealerId: string;
  status: "ACTIVE" | "REJECTED";
  reason?: string;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized: Admin privileges required." };

  try {
    const updated = await reviewDealerApplicationStatus(input);
    if (!updated) {
      return {
        ok: false,
        error: "This application is no longer pending review. Refresh the queue.",
      };
    }

    await logAudit({
      actorId: admin.id,
      action:
        input.status === "ACTIVE" ? "DEALER_APPLICATION_APPROVED" : "DEALER_APPLICATION_REJECTED",
      resource: "Dealer",
      resourceId: input.dealerId,
      after: {
        status: input.status,
        isVerified: input.status === "ACTIVE",
        reason: input.reason,
      },
    });

    revalidatePath(ROUTES.adminDealers);
    revalidatePath(ROUTES.dealerDashboard);
    revalidatePath(ROUTES.dealerProfile);
    return { ok: true };
  } catch (error) {
    console.error("[dealer] application review failed:", error);
    return { ok: false, error: "Could not update this dealer application." };
  }
}

export async function approveDealerApplicationAction(input: {
  dealerId: string;
}): Promise<ActionResult> {
  const parsed = approveDealerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid application." };
  return review({ ...parsed.data, status: "ACTIVE" });
}

export async function rejectDealerApplicationAction(input: {
  dealerId: string;
  reason: string;
}): Promise<ActionResult> {
  const parsed = rejectDealerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid review reason." };
  }
  return review({ ...parsed.data, status: "REJECTED" });
}
