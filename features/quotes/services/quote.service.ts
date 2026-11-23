import "server-only";

import {
  APP,
  NOTIFICATION_TYPES,
  QUOTE_PRICING,
  QUOTE_STATUSES,
  ROUTES,
  type QuoteInspectionResult,
} from "@/lib/constants";
import type {
  AcceptQuoteInput,
  CreateQuoteInput,
  DeductionRuleInput,
  GradeMultipliersInput,
  PhoneModelInput,
} from "@/features/quotes/schemas/quote";
import type {
  CatalogDto,
  DeductionRuleDto,
  GradeMultipliers,
  PhoneModelDto,
  QuoteDto,
} from "@/features/quotes/types";
import { dispatchNotification } from "@/features/notifications/services/notification.service";
import {
  acceptQuote,
  approveQuote as approveQuoteRecord,
  countQuotesForUser,
  createPendingQuote as persistPendingQuote,
  createPhoneModel,
  declineQuote as declineQuoteRecord,
  deleteDeductionRule,
  deletePhoneModel,
  expireDueQuotes,
  expireQuoteIfDue,
  getActiveCatalog,
  getGradeMultipliers,
  getQuoteById,
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

/** Formats a PKR amount for emails, e.g. 150000 → "Rs 150,000". */
function formatPkr(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString("en-PK")}`;
}

/** Emails the seller the admin's decision (offer or decline) + an in-app notification. */
async function notifyQuoteDecision(quote: QuoteDto, kind: "approved" | "declined"): Promise<void> {
  const user = quote.user;
  if (!user) return;
  const device = `${quote.brand} ${quote.model} ${quote.storage}`.trim();
  const url = `${ROUTES.sellPhone}/${quote.id}`;

  if (kind === "approved") {
    await dispatchNotification({
      userId: user.id,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: `${APP.name}: your offer for the ${quote.brand} ${quote.model}`,
      body: `Good news — we can offer ${formatPkr(quote.priceMax)} for your ${device}. Review and accept to schedule a free pickup.`,
      url,
      email: true,
    });
  } else {
    await dispatchNotification({
      userId: user.id,
      type: NOTIFICATION_TYPES.SYSTEM,
      title: `${APP.name}: update on your ${quote.brand} ${quote.model} request`,
      body: quote.declineReason
        ? `We're unable to make an offer for your ${device}. Reason: ${quote.declineReason}`
        : `We're unable to make an offer for your ${device} at this time.`,
      url,
      email: true,
    });
  }
}

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
// Submit a request (manual review) — the heart of the feature.
// ---------------------------------------------------------------------------

/**
 * Submits a buy-back request for manual admin review. No price is computed — the
 * admin reviews the details + photos and sets a firm offer price (or declines),
 * which is then emailed to the seller. Returns the newly-created PENDING quote.
 */
export async function createQuote(input: CreateQuoteInput, userId: string): Promise<QuoteDto> {
  return persistPendingQuote({
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

// ---------------------------------------------------------------------------
// Admin review (manual quote): approve with a price, or decline with a reason.
// ---------------------------------------------------------------------------

/**
 * Admin approves a pending request with a firm offer price → ACTIVE, then emails
 * the seller the offer. Returns the updated quote, or null if it wasn't pending.
 */
export async function approveQuote(id: string, offerPricePkr: number): Promise<QuoteDto | null> {
  const quote = await approveQuoteRecord(id, offerPricePkr);
  if (!quote) return null;
  await notifyQuoteDecision(quote, "approved");
  return quote;
}

/** Admin declines a pending request with a reason → DECLINED, then emails the seller. */
export async function declineQuote(id: string, reason: string): Promise<QuoteDto | null> {
  const quote = await declineQuoteRecord(id, reason);
  if (!quote) return null;
  await notifyQuoteDecision(quote, "declined");
  return quote;
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
