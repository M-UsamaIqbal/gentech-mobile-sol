"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/lib/constants";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import {
  approveQuoteSchema,
  declineQuoteSchema,
  deductionRuleSchema,
  gradeMultipliersSchema,
  inspectQuoteSchema,
  phoneModelSchema,
  type ApproveQuoteInput,
  type DeclineQuoteInput,
  type DeductionRuleInput,
  type GradeMultipliersInput,
  type InspectQuoteInput,
  type PhoneModelInput,
} from "@/features/quotes/schemas/quote";
import {
  addPhoneModel,
  approveQuote,
  declineQuote,
  editPhoneModel,
  recordQuoteInspection,
  removeDeductionRule,
  removePhoneModel,
  saveDeductionRule,
  saveMultipliers,
  toggleDeductionRule,
} from "@/features/quotes/services/quote.service";

type ActionResult = { ok: boolean; error?: string };

const FORBIDDEN = "You do not have permission to do that.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const PRICING_PATH = `${ROUTES.adminQuotes}/pricing`;

function invalid() {
  return { ok: false as const, error: "Please fix the highlighted fields and try again." };
}

// --- Price book ------------------------------------------------------------

export async function createPhoneModelAction(input: PhoneModelInput): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: FORBIDDEN };
  const parsed = phoneModelSchema.safeParse(input);
  if (!parsed.success) return invalid();
  try {
    await addPhoneModel(parsed.data);
    revalidatePath(PRICING_PATH);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] create model failed:", error);
    return { ok: false, error: "Could not add — this exact variant may already exist." };
  }
}

export async function updatePhoneModelAction(
  input: PhoneModelInput & { id: string },
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: FORBIDDEN };
  if (!input.id) return invalid();
  const parsed = phoneModelSchema.safeParse(input);
  if (!parsed.success) return invalid();
  try {
    await editPhoneModel(input.id, parsed.data);
    revalidatePath(PRICING_PATH);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] update model failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function deletePhoneModelAction(input: { id: string }): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: FORBIDDEN };
  if (!input?.id) return invalid();
  try {
    await removePhoneModel(input.id);
    revalidatePath(PRICING_PATH);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] delete model failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

// --- Deduction rules -------------------------------------------------------

export async function saveDeductionRuleAction(input: DeductionRuleInput): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: FORBIDDEN };
  const parsed = deductionRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? invalid().error };
  }
  try {
    await saveDeductionRule(parsed.data);
    revalidatePath(PRICING_PATH);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] save deduction failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function toggleDeductionRuleAction(input: {
  key: string;
  isActive: boolean;
}): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: FORBIDDEN };
  if (!input?.key) return invalid();
  try {
    await toggleDeductionRule(input.key, input.isActive);
    revalidatePath(PRICING_PATH);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] toggle deduction failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function deleteDeductionRuleAction(input: { key: string }): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: FORBIDDEN };
  if (!input?.key) return invalid();
  try {
    await removeDeductionRule(input.key);
    revalidatePath(PRICING_PATH);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] delete deduction failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

// --- Grade multipliers -----------------------------------------------------

export async function saveMultipliersAction(input: GradeMultipliersInput): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: FORBIDDEN };
  const parsed = gradeMultipliersSchema.safeParse(input);
  if (!parsed.success) return invalid();
  try {
    await saveMultipliers(parsed.data);
    revalidatePath(PRICING_PATH);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] save multipliers failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

// --- Manual review: approve / decline a pending request --------------------

export async function approveQuoteAction(input: ApproveQuoteInput): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: FORBIDDEN };
  const parsed = approveQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? invalid().error };
  }
  try {
    const quote = await approveQuote(parsed.data.id, parsed.data.offerPricePkr);
    if (!quote) return { ok: false, error: "This request can no longer be reviewed." };
    revalidatePath(ROUTES.adminQuotes);
    revalidatePath(`${ROUTES.adminQuotes}/${parsed.data.id}`);
    revalidatePath(`${ROUTES.sellPhone}/${parsed.data.id}`);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] approve failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function declineQuoteAction(input: DeclineQuoteInput): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: FORBIDDEN };
  const parsed = declineQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? invalid().error };
  }
  try {
    const quote = await declineQuote(parsed.data.id, parsed.data.reason);
    if (!quote) return { ok: false, error: "This request can no longer be reviewed." };
    revalidatePath(ROUTES.adminQuotes);
    revalidatePath(`${ROUTES.adminQuotes}/${parsed.data.id}`);
    revalidatePath(`${ROUTES.sellPhone}/${parsed.data.id}`);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] decline failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

// --- Inspection screen -----------------------------------------------------

export async function inspectQuoteAction(input: InspectQuoteInput): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: FORBIDDEN };
  const parsed = inspectQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? invalid().error };
  }
  try {
    const ok = await recordQuoteInspection(parsed.data);
    if (!ok) return { ok: false, error: "Quote not found." };
    revalidatePath(ROUTES.adminQuotes);
    revalidatePath(`${ROUTES.adminQuotes}/${parsed.data.id}`);
    return { ok: true };
  } catch (error) {
    console.error("[quotes] inspect failed:", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}
