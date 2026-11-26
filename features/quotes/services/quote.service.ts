import "server-only";

import {
  APP,
  NOTIFICATION_TYPES,
  QUOTE_PRICING,
  QUOTE_STATUSES,
  ROUTES,
  type QuoteInspectionResult,
} from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { dispatchNotification } from "@/features/notifications/services/notification.service";
import { buildQuotePdf } from "@/features/quotes/lib/quote-pdf";
import type {
  AcceptQuoteInput,
  CreateQuoteInput,
  DeductionRuleInput,
  GradeMultipliersInput,
  PhoneModelInput,
} from "@/features/quotes/schemas/quote";
import { applyMismatchGradePenalty, computeQuotePricing } from "@/features/quotes/lib/pricing";
import { gradeDevice, type Grader } from "@/features/quotes/lib/grading";
import type {
  CatalogDto,
  CreateQuoteResult,
  DeductionRuleDto,
  GradeMultipliers,
  PhoneModelDto,
  QuoteDto,
} from "@/features/quotes/types";
import {
  acceptQuote,
  approveQuote as approveQuoteRow,
  countQuotesForUser,
  createPendingQuote,
  createPhoneModel,
  createQuote as persistQuote,
  declineQuote as declineQuoteRow,
  deleteDeductionRule,
  deletePhoneModel,
  expireDueQuotes,
  expireQuoteIfDue,
  findPhoneModel,
  getActiveCatalog,
  getGradeMultipliers,
  getQuoteById,
  listActiveDeductionRules,
  listAllDeductionRules,
  listAllPhoneModels,
  listAllQuotes,
  listQuotesForUser,
  recordInspection,
  setDeductionRuleActive,
  setGradeMultipliers,
  updatePhoneModel,
  upsertDeductionRule,
} from "@/features/quotes/repositories/quote.repository";

function warn(scope: string, error: unknown): void {
  console.warn(`[quotes] ${scope}:`, error instanceof Error ? error.message : error);
}

// ---------------------------------------------------------------------------
// Catalog (public)
// ---------------------------------------------------------------------------

/** Active price book grouped for the Brand → Model → Storage picker. Empty on failure. */
export async function getCatalog(): Promise<CatalogDto> {
  try {
    return await getActiveCatalog();
  } catch (error) {
    warn("could not load catalog", error);
    return { brands: [], modelsByBrand: {}, variantsByModel: {} };
  }
}

// ---------------------------------------------------------------------------
// Create a quote (Steps 4 + 5) — the heart of the feature.
// ---------------------------------------------------------------------------

/**
 * Reconciles the AI's screenshot reading with the seller's selection. When the
 * screenshot reports a different storage that *also* exists in the price book, we
 * trust the screenshot (per spec) and note it as a mismatch the seller will see.
 */
async function resolvePriceModel(
  input: CreateQuoteInput,
  mismatches: string[],
  screenshot: { model: string; storage: string },
): Promise<PhoneModelDto | null> {
  const pta = input.answers.ptaStatus;
  const selected = await findPhoneModel(input.brand, input.model, input.storage, pta);

  const shotStorage = screenshot.storage.trim();
  if (shotStorage && shotStorage.toLowerCase() !== input.storage.toLowerCase()) {
    const fromShot = await findPhoneModel(input.brand, input.model, shotStorage, pta);
    if (fromShot) {
      mismatches.push(
        `You selected ${input.storage} but the screenshot shows ${shotStorage} — using ${shotStorage}.`,
      );
      return fromShot;
    }
  }
  return selected;
}

/**
 * Runs AI grading, reconciles screenshot data, prices the device and persists the
 * quote. Returns a `retake` outcome instead when the photos aren't gradeable.
 * `grader` is injectable so tests can drive clean / mismatch / retake scenarios.
 */
export async function createQuote(
  input: CreateQuoteInput,
  userId: string,
  opts?: { grader?: Grader },
): Promise<CreateQuoteResult> {
  const grader = opts?.grader ?? gradeDevice;

  const ai = await grader({
    brand: input.brand,
    model: input.model,
    storage: input.storage,
    answers: input.answers,
    photos: input.photos,
  });

  // Gate on photo quality / confidence before we price anything (Step 4 rule).
  if (ai.retake_needed.length > 0 || ai.confidence < QUOTE_PRICING.minConfidence) {
    return {
      kind: "retake",
      retakeSlots: ai.retake_needed,
      confidence: ai.confidence,
      reason:
        ai.retake_needed.length > 0
          ? "Some photos need to be retaken before we can price your phone."
          : "We couldn't read the photos clearly enough. Please retake them in good light.",
    };
  }

  const mismatches = [...ai.mismatches];

  // Reconcile the About/Battery screenshot with the seller's selection.
  const resolved = await resolvePriceModel(input, mismatches, ai.screenshot_data);
  if (!resolved) {
    throw new Error("This exact model/storage/PTA combination isn't in our price book yet.");
  }

  // Trust the screenshot's battery health when it conflicts (affects a deduction).
  const answers = { ...input.answers };
  const shotBattery = Number(ai.screenshot_data.battery_health);
  if (
    Number.isFinite(shotBattery) &&
    shotBattery > 0 &&
    shotBattery <= 100 &&
    answers.batteryHealth != null &&
    Math.abs(shotBattery - answers.batteryHealth) > 2
  ) {
    mismatches.push(
      `You entered ${answers.batteryHealth}% battery health but the screenshot shows ${shotBattery}% — using ${shotBattery}%.`,
    );
    answers.batteryHealth = Math.round(shotBattery);
  }

  const effectiveGrade = applyMismatchGradePenalty(ai.grade, mismatches.length);

  const [multipliers, rules] = await Promise.all([
    getGradeMultipliers(),
    listActiveDeductionRules(),
  ]);

  const pricing = computeQuotePricing({
    basePrice: resolved.basePricePkr,
    grade: effectiveGrade,
    gradeMultipliers: multipliers,
    answers,
    rules,
  });

  const validUntil = new Date(Date.now() + QUOTE_PRICING.validityHours * 3_600_000);

  const quote = await persistQuote({
    userId,
    modelId: resolved.id,
    brand: resolved.brand,
    model: resolved.model,
    storage: resolved.storage,
    ptaStatus: answers.ptaStatus,
    basePricePkr: resolved.basePricePkr,
    answers,
    photos: input.photos,
    aiGrade: ai.grade,
    aiResult: { ...ai, mismatches },
    effectiveGrade,
    gradeMultiplier: pricing.gradeMultiplier,
    deductions: pricing.deductions,
    priceMin: pricing.priceMin,
    priceMax: pricing.priceMax,
    validUntil,
  });

  return { kind: "quote", quote };
}

/**
 * Manual-review request (the sell-phone flow): persist a PENDING quote with no price.
 * An admin reviews it and sets a firm offer — or declines — which emails the seller.
 */
export async function requestManualQuote(
  input: CreateQuoteInput,
  userId: string,
): Promise<QuoteDto> {
  return createPendingQuote({
    userId,
    brand: input.brand,
    model: input.model,
    storage: input.storage,
    ptaStatus: input.answers.ptaStatus,
    answers: input.answers,
    photos: input.photos,
  });
}

// ---------------------------------------------------------------------------
// Read + lifecycle
// ---------------------------------------------------------------------------

/** One quote, after lazily expiring it if its validity has lapsed. Null on failure. */
export async function getQuote(id: string): Promise<QuoteDto | null> {
  try {
    await expireQuoteIfDue(id);
    return await getQuoteById(id);
  } catch (error) {
    warn("could not load quote", error);
    return null;
  }
}

export async function getMyQuotes(userId: string): Promise<QuoteDto[]> {
  try {
    return await listQuotesForUser(userId);
  } catch (error) {
    warn("could not load quotes", error);
    return [];
  }
}

export async function getMyQuoteCount(userId: string): Promise<number> {
  try {
    return await countQuotesForUser(userId);
  } catch (error) {
    warn("could not count quotes", error);
    return 0;
  }
}

/** Buyer accepts an active quote, supplying a pickup address + slot. */
export async function acceptMyQuote(input: AcceptQuoteInput, userId: string): Promise<boolean> {
  return acceptQuote(input.id, userId, input.pickupAddress, input.pickupSlot);
}

/**
 * Re-quote an expired quote: reuse its answers + photos but price against today's
 * price book, deductions and multipliers (Step 7). Owner-scoped.
 */
export async function requote(
  id: string,
  userId: string,
  opts?: { grader?: Grader },
): Promise<CreateQuoteResult | null> {
  const prev = await getQuoteById(id);
  if (!prev || prev.user?.id !== userId) return null;

  return createQuote(
    {
      brand: prev.brand,
      model: prev.model,
      storage: prev.storage,
      answers: prev.answers,
      photos: prev.photos,
    },
    userId,
    opts,
  );
}

// ---------------------------------------------------------------------------
// Admin (Step 8)
// ---------------------------------------------------------------------------

export async function getAllQuotes(limit?: number): Promise<QuoteDto[]> {
  try {
    return await listAllQuotes(limit);
  } catch (error) {
    warn("could not load all quotes", error);
    return [];
  }
}

export async function recordQuoteInspection(data: {
  id: string;
  result: QuoteInspectionResult;
  reason?: string;
  adjustedPricePkr?: number;
}): Promise<boolean> {
  return recordInspection(data);
}

function formatPkr(amount: number): string {
  return `Rs ${new Intl.NumberFormat("en-PK").format(Math.round(amount))}`;
}

/**
 * Admin approves a PENDING request with a firm offer → ACTIVE. Emails the seller the
 * offer with a branded PDF attached, plus an in-app notification. Best-effort email —
 * a failed send never undoes the decision. Returns the updated quote, or null if it
 * was no longer PENDING.
 */
export async function approveQuote(id: string, offerPricePkr: number): Promise<QuoteDto | null> {
  const quote = await approveQuoteRow(id, offerPricePkr);
  if (!quote) return null;

  const url = `${ROUTES.sellPhone}/${quote.id}`;
  const device = `${quote.brand} ${quote.model} ${quote.storage}`.trim();
  const validUntil = new Date(quote.validUntil).toLocaleDateString("en-GB");
  const title = `Your ${APP.name} offer: ${formatPkr(offerPricePkr)}`;
  const body = `Good news! We can offer ${formatPkr(offerPricePkr)} for your ${device}. Your quote ${quote.id} is valid until ${validUntil}. The full quote is attached as a PDF.`;

  // In-app notification only — the richer email (with the PDF) is sent below.
  await dispatchNotification({
    userId: quote.user?.id ?? "",
    type: NOTIFICATION_TYPES.SYSTEM,
    title,
    body,
    url,
    email: false,
  });

  if (quote.user?.email) {
    try {
      const pdf = await buildQuotePdf(quote, offerPricePkr);
      await sendEmail({
        to: quote.user.email,
        subject: title,
        text: `${body}\n\nOpen ${APP.name}: ${url}`,
        attachments: [
          { filename: `${quote.id}-quote.pdf`, content: Buffer.from(pdf).toString("base64") },
        ],
      });
    } catch (error) {
      warn("could not email approved quote", error);
    }
  }

  return quote;
}

/**
 * Admin declines a PENDING request with a reason → DECLINED. Emails the seller the
 * reason (plain text). Returns the updated quote, or null if it was no longer PENDING.
 */
export async function declineQuote(id: string, reason: string): Promise<QuoteDto | null> {
  const quote = await declineQuoteRow(id, reason);
  if (!quote) return null;

  const device = `${quote.brand} ${quote.model} ${quote.storage}`.trim();
  await dispatchNotification({
    userId: quote.user?.id ?? "",
    type: NOTIFICATION_TYPES.SYSTEM,
    title: `Update on your ${APP.name} quote request`,
    body: `We're unable to make an offer on your ${device} right now. Reason: ${reason}`,
    url: `${ROUTES.sellPhone}/${quote.id}`,
    email: true,
  });

  return quote;
}

export async function getPriceBook(): Promise<PhoneModelDto[]> {
  try {
    return await listAllPhoneModels();
  } catch (error) {
    warn("could not load price book", error);
    return [];
  }
}

export async function addPhoneModel(input: PhoneModelInput): Promise<void> {
  await createPhoneModel(input);
}

export async function editPhoneModel(id: string, input: PhoneModelInput): Promise<void> {
  await updatePhoneModel(id, input);
}

export async function removePhoneModel(id: string): Promise<void> {
  await deletePhoneModel(id);
}

export async function getDeductionRules(): Promise<DeductionRuleDto[]> {
  try {
    return await listAllDeductionRules();
  } catch (error) {
    warn("could not load deduction rules", error);
    return [];
  }
}

export async function saveDeductionRule(input: DeductionRuleInput): Promise<void> {
  await upsertDeductionRule({
    key: input.key,
    label: input.label,
    amountPkr: input.amountPkr ?? null,
    percent: input.percent ?? null,
    isActive: input.isActive,
    position: input.position,
  });
}

export async function toggleDeductionRule(key: string, isActive: boolean): Promise<void> {
  await setDeductionRuleActive(key, isActive);
}

export async function removeDeductionRule(key: string): Promise<void> {
  await deleteDeductionRule(key);
}

export async function getMultipliers(): Promise<GradeMultipliers> {
  try {
    return await getGradeMultipliers();
  } catch (error) {
    warn("could not load multipliers", error);
    return { ...QUOTE_PRICING.gradeMultipliers };
  }
}

export async function saveMultipliers(input: GradeMultipliersInput): Promise<void> {
  await setGradeMultipliers(input);
}

// ---------------------------------------------------------------------------
// Scheduled job (Step 7)
// ---------------------------------------------------------------------------

/** Expire every quote past its validity window. Returns how many were flipped. */
export async function expireQuotes(): Promise<number> {
  return expireDueQuotes();
}

/** Convenience guard mirroring the enum, used by UI logic. */
export function isExpired(quote: QuoteDto): boolean {
  return (
    quote.status === QUOTE_STATUSES.EXPIRED ||
    (quote.status === QUOTE_STATUSES.ACTIVE && new Date(quote.validUntil).getTime() <= Date.now())
  );
}
