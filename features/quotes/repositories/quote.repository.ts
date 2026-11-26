import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  QUOTE_PRICING,
  QUOTE_SETTING_KEYS,
  QUOTE_STATUSES,
  type PtaStatus,
  type QuoteGrade,
  type QuoteInspectionResult,
  type QuoteStatus,
} from "@/lib/constants";
import { generateQuoteId } from "@/features/quotes/lib/quote-id";
import type { QuoteAnswers, QuotePhoto } from "@/features/quotes/schemas/quote";
import type {
  AppliedDeduction,
  CatalogDto,
  DeductionRuleDto,
  GradeMultipliers,
  PhoneModelDto,
  QuoteAiResult,
  QuoteDto,
} from "@/features/quotes/types";

// ---------------------------------------------------------------------------
// Phone models (price book)
// ---------------------------------------------------------------------------

const phoneModelSelect = {
  id: true,
  brand: true,
  model: true,
  storage: true,
  ptaStatus: true,
  basePricePkr: true,
  isActive: true,
} satisfies Prisma.QuotePriceBookSelect;

type PhoneModelRow = Prisma.QuotePriceBookGetPayload<{ select: typeof phoneModelSelect }>;

function toPhoneModelDto(row: PhoneModelRow): PhoneModelDto {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    storage: row.storage,
    ptaStatus: row.ptaStatus as PtaStatus,
    basePricePkr: Number(row.basePricePkr),
    isActive: row.isActive,
  };
}

/** Every price-book row (admin view), ordered for a readable table. */
export async function listAllPhoneModels(): Promise<PhoneModelDto[]> {
  const rows = await prisma.quotePriceBook.findMany({
    orderBy: [{ brand: "asc" }, { model: "asc" }, { storage: "asc" }, { ptaStatus: "asc" }],
    select: phoneModelSelect,
  });
  return rows.map(toPhoneModelDto);
}

/** Active rows, grouped into the cascading Brand → Model → Storage catalog. */
export async function getActiveCatalog(): Promise<CatalogDto> {
  const rows = await prisma.quotePriceBook.findMany({
    where: { isActive: true },
    orderBy: [{ brand: "asc" }, { model: "asc" }, { storage: "asc" }],
    select: phoneModelSelect,
  });

  const brands: string[] = [];
  const modelsByBrand: Record<string, string[]> = {};
  const variantsByModel: CatalogDto["variantsByModel"] = {};

  for (const row of rows) {
    let models = modelsByBrand[row.brand];
    if (!models) {
      models = [];
      modelsByBrand[row.brand] = models;
      brands.push(row.brand);
    }
    if (!models.includes(row.model)) models.push(row.model);

    const key = `${row.brand}::${row.model}`;
    (variantsByModel[key] ??= []).push({
      storage: row.storage,
      ptaStatus: row.ptaStatus as PtaStatus,
      basePricePkr: Number(row.basePricePkr),
    });
  }

  return { brands, modelsByBrand, variantsByModel };
}

/** The exact price-book row for a (brand, model, storage, PTA) tuple, if active. */
export async function findPhoneModel(
  brand: string,
  model: string,
  storage: string,
  ptaStatus: PtaStatus,
): Promise<PhoneModelDto | null> {
  const row = await prisma.quotePriceBook.findUnique({
    where: {
      brand_model_storage_ptaStatus: { brand, model, storage, ptaStatus },
    },
    select: phoneModelSelect,
  });
  return row && row.isActive ? toPhoneModelDto(row) : null;
}

export async function createPhoneModel(data: {
  brand: string;
  model: string;
  storage: string;
  ptaStatus: PtaStatus;
  basePricePkr: number;
  isActive?: boolean;
}): Promise<void> {
  await prisma.quotePriceBook.create({
    data: {
      brand: data.brand,
      model: data.model,
      storage: data.storage,
      ptaStatus: data.ptaStatus,
      basePricePkr: new Prisma.Decimal(data.basePricePkr),
      isActive: data.isActive ?? true,
    },
  });
}

export async function updatePhoneModel(
  id: string,
  data: {
    brand: string;
    model: string;
    storage: string;
    ptaStatus: PtaStatus;
    basePricePkr: number;
    isActive?: boolean;
  },
): Promise<void> {
  await prisma.quotePriceBook.update({
    where: { id },
    data: {
      brand: data.brand,
      model: data.model,
      storage: data.storage,
      ptaStatus: data.ptaStatus,
      basePricePkr: new Prisma.Decimal(data.basePricePkr),
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    },
  });
}

export async function deletePhoneModel(id: string): Promise<void> {
  await prisma.quotePriceBook.delete({ where: { id } });
}

// ---------------------------------------------------------------------------
// Deduction rules
// ---------------------------------------------------------------------------

const deductionSelect = {
  id: true,
  key: true,
  label: true,
  amountPkr: true,
  percent: true,
  isActive: true,
  position: true,
} satisfies Prisma.DeductionRuleSelect;

type DeductionRow = Prisma.DeductionRuleGetPayload<{ select: typeof deductionSelect }>;

function toDeductionDto(row: DeductionRow): DeductionRuleDto {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    amountPkr: row.amountPkr == null ? null : Number(row.amountPkr),
    percent: row.percent == null ? null : Number(row.percent),
    isActive: row.isActive,
    position: row.position,
  };
}

export async function listAllDeductionRules(): Promise<DeductionRuleDto[]> {
  const rows = await prisma.deductionRule.findMany({
    orderBy: [{ position: "asc" }, { key: "asc" }],
    select: deductionSelect,
  });
  return rows.map(toDeductionDto);
}

export async function listActiveDeductionRules(): Promise<DeductionRuleDto[]> {
  const rows = await prisma.deductionRule.findMany({
    where: { isActive: true },
    orderBy: [{ position: "asc" }, { key: "asc" }],
    select: deductionSelect,
  });
  return rows.map(toDeductionDto);
}

/** Create or update a rule by its unique `key`. Enforces amount XOR percent. */
export async function upsertDeductionRule(data: {
  key: string;
  label: string;
  amountPkr?: number | null;
  percent?: number | null;
  isActive?: boolean;
  position?: number;
}): Promise<void> {
  const amount = data.amountPkr != null ? new Prisma.Decimal(data.amountPkr) : null;
  const percent = data.percent != null ? new Prisma.Decimal(data.percent) : null;
  await prisma.deductionRule.upsert({
    where: { key: data.key },
    create: {
      key: data.key,
      label: data.label,
      amountPkr: amount,
      percent,
      isActive: data.isActive ?? true,
      position: data.position ?? 0,
    },
    update: {
      label: data.label,
      amountPkr: amount,
      percent,
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
      ...(data.position === undefined ? {} : { position: data.position }),
    },
  });
}

export async function setDeductionRuleActive(key: string, isActive: boolean): Promise<void> {
  await prisma.deductionRule.update({ where: { key }, data: { isActive } });
}

export async function deleteDeductionRule(key: string): Promise<void> {
  await prisma.deductionRule.delete({ where: { key } });
}

// ---------------------------------------------------------------------------
// Grade multipliers (QuoteSetting)
// ---------------------------------------------------------------------------

export async function getGradeMultipliers(): Promise<GradeMultipliers> {
  const rows = await prisma.quoteSetting.findMany({
    where: {
      key: {
        in: [
          QUOTE_SETTING_KEYS.gradeMultiplierA,
          QUOTE_SETTING_KEYS.gradeMultiplierB,
          QUOTE_SETTING_KEYS.gradeMultiplierC,
        ],
      },
    },
    select: { key: true, value: true },
  });
  const byKey = new Map(rows.map((r) => [r.key, Number(r.value)]));
  const d = QUOTE_PRICING.gradeMultipliers;
  return {
    A: byKey.get(QUOTE_SETTING_KEYS.gradeMultiplierA) ?? d.A,
    B: byKey.get(QUOTE_SETTING_KEYS.gradeMultiplierB) ?? d.B,
    C: byKey.get(QUOTE_SETTING_KEYS.gradeMultiplierC) ?? d.C,
  };
}

export async function setGradeMultipliers(multipliers: GradeMultipliers): Promise<void> {
  const entries: Array<[string, number, string]> = [
    [QUOTE_SETTING_KEYS.gradeMultiplierA, multipliers.A, "Grade A multiplier"],
    [QUOTE_SETTING_KEYS.gradeMultiplierB, multipliers.B, "Grade B multiplier"],
    [QUOTE_SETTING_KEYS.gradeMultiplierC, multipliers.C, "Grade C multiplier"],
  ];
  await prisma.$transaction(
    entries.map(([key, value, label]) =>
      prisma.quoteSetting.upsert({
        where: { key },
        create: { key, value: new Prisma.Decimal(value), label },
        update: { value: new Prisma.Decimal(value), label },
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

const quoteSelect = {
  id: true,
  status: true,
  brand: true,
  model: true,
  storage: true,
  ptaStatus: true,
  basePricePkr: true,
  answers: true,
  photoUrls: true,
  aiGrade: true,
  aiDefects: true,
  aiFlags: true,
  gradeMultiplier: true,
  deductions: true,
  priceMin: true,
  priceMax: true,
  pickupAddress: true,
  pickupSlot: true,
  acceptedAt: true,
  declineReason: true,
  inspectionResult: true,
  inspectionReason: true,
  adjustedPricePkr: true,
  inspectedAt: true,
  paidAt: true,
  createdAt: true,
  validUntil: true,
} satisfies Prisma.QuoteSelect;

const quoteWithUserSelect = {
  ...quoteSelect,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.QuoteSelect;

type QuoteRow = Prisma.QuoteGetPayload<{ select: typeof quoteWithUserSelect }>;

function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function toQuoteDto(row: QuoteRow, includeUser = false): QuoteDto {
  const flags = (row.aiFlags ?? null) as QuoteDto["aiFlags"];
  return {
    id: row.id,
    status: row.status as QuoteStatus,
    brand: row.brand,
    model: row.model,
    storage: row.storage,
    ptaStatus: row.ptaStatus as PtaStatus,
    basePricePkr: Number(row.basePricePkr),
    answers: row.answers as unknown as QuoteAnswers,
    photos: (row.photoUrls as unknown as QuotePhoto[]) ?? [],
    aiGrade: (row.aiGrade as QuoteGrade | null) ?? null,
    aiDefects: (row.aiDefects as unknown as QuoteAiResult["defects"]) ?? [],
    aiFlags: flags,
    gradeMultiplier: Number(row.gradeMultiplier),
    deductions: (row.deductions as unknown as AppliedDeduction[]) ?? [],
    priceMin: Number(row.priceMin),
    priceMax: Number(row.priceMax),
    pickupAddress: row.pickupAddress,
    pickupSlot: row.pickupSlot,
    acceptedAt: iso(row.acceptedAt),
    declineReason: row.declineReason,
    inspectionResult: (row.inspectionResult as QuoteInspectionResult | null) ?? null,
    inspectionReason: row.inspectionReason,
    adjustedPricePkr: row.adjustedPricePkr == null ? null : Number(row.adjustedPricePkr),
    inspectedAt: iso(row.inspectedAt),
    paidAt: iso(row.paidAt),
    createdAt: row.createdAt.toISOString(),
    validUntil: row.validUntil.toISOString(),
    user: includeUser && row.user ? row.user : undefined,
  };
}

export interface CreateQuoteData {
  userId: string;
  modelId: string | null;
  brand: string;
  model: string;
  storage: string;
  ptaStatus: PtaStatus;
  basePricePkr: number;
  answers: QuoteAnswers;
  photos: QuotePhoto[];
  aiGrade: QuoteGrade;
  aiResult: QuoteAiResult;
  effectiveGrade: QuoteGrade;
  gradeMultiplier: number;
  deductions: AppliedDeduction[];
  priceMin: number;
  priceMax: number;
  validUntil: Date;
}

/** Inserts a quote row with a generated code, retrying on the (rare) id collision. */
async function insertQuoteWithRetry(
  base: Omit<Prisma.QuoteUncheckedCreateInput, "id">,
): Promise<QuoteDto> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const row = await prisma.quote.create({
        data: { id: generateQuoteId(), ...base },
        select: quoteWithUserSelect,
      });
      return toQuoteDto(row);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        attempt < 4
      ) {
        continue; // id collision — try a fresh code
      }
      throw error;
    }
  }
  throw new Error("Could not allocate a unique quote id.");
}

/** Persists a fully-computed quote (legacy instant-pricing path; kept for reuse). */
export async function createQuote(data: CreateQuoteData): Promise<QuoteDto> {
  return insertQuoteWithRetry({
    userId: data.userId,
    modelId: data.modelId,
    brand: data.brand,
    model: data.model,
    storage: data.storage,
    ptaStatus: data.ptaStatus,
    basePricePkr: new Prisma.Decimal(data.basePricePkr),
    answers: data.answers as unknown as Prisma.InputJsonValue,
    photoUrls: data.photos as unknown as Prisma.InputJsonValue,
    aiGrade: data.effectiveGrade,
    aiDefects: data.aiResult.defects as unknown as Prisma.InputJsonValue,
    aiFlags: {
      mismatches: data.aiResult.mismatches,
      screenshot_data: data.aiResult.screenshot_data,
      retake_needed: data.aiResult.retake_needed,
      confidence: data.aiResult.confidence,
      rawGrade: data.aiGrade,
    } as unknown as Prisma.InputJsonValue,
    aiConfidence: new Prisma.Decimal(data.aiResult.confidence),
    gradeMultiplier: new Prisma.Decimal(data.gradeMultiplier),
    deductions: data.deductions as unknown as Prisma.InputJsonValue,
    priceMin: new Prisma.Decimal(data.priceMin),
    priceMax: new Prisma.Decimal(data.priceMax),
    status: QUOTE_STATUSES.ACTIVE,
    validUntil: data.validUntil,
  });
}

export interface CreatePendingQuoteData {
  userId: string;
  brand: string;
  model: string;
  storage: string;
  ptaStatus: PtaStatus;
  answers: QuoteAnswers;
  photos: QuotePhoto[];
}

/**
 * Persists a submitted buy-back request awaiting manual admin review. No price is
 * computed yet — the price fields hold neutral placeholders until an admin approves.
 */
export async function createPendingQuote(data: CreatePendingQuoteData): Promise<QuoteDto> {
  return insertQuoteWithRetry({
    userId: data.userId,
    modelId: null,
    brand: data.brand,
    model: data.model,
    storage: data.storage,
    ptaStatus: data.ptaStatus,
    basePricePkr: new Prisma.Decimal(0),
    answers: data.answers as unknown as Prisma.InputJsonValue,
    photoUrls: data.photos as unknown as Prisma.InputJsonValue,
    gradeMultiplier: new Prisma.Decimal(1),
    deductions: [] as unknown as Prisma.InputJsonValue,
    priceMin: new Prisma.Decimal(0),
    priceMax: new Prisma.Decimal(0),
    status: QUOTE_STATUSES.PENDING,
    // Placeholder; reset when the admin approves. Pending quotes are never auto-expired.
    validUntil: new Date(Date.now() + QUOTE_PRICING.validityHours * 3_600_000),
  });
}

/**
 * Admin approves a pending request with a single firm offer price → ACTIVE.
 * Guarded to only transition from PENDING; returns the updated quote or null.
 */
export async function approveQuote(id: string, offerPricePkr: number): Promise<QuoteDto | null> {
  const price = new Prisma.Decimal(offerPricePkr);
  const res = await prisma.quote.updateMany({
    where: { id, status: QUOTE_STATUSES.PENDING },
    data: {
      status: QUOTE_STATUSES.ACTIVE,
      basePricePkr: price,
      priceMin: price,
      priceMax: price,
      declineReason: null,
      validUntil: new Date(Date.now() + QUOTE_PRICING.validityHours * 3_600_000),
    },
  });
  if (res.count === 0) return null;
  return getQuoteById(id);
}

/** Admin declines a pending request with a reason → DECLINED. */
export async function declineQuote(id: string, reason: string): Promise<QuoteDto | null> {
  const res = await prisma.quote.updateMany({
    where: { id, status: QUOTE_STATUSES.PENDING },
    data: { status: QUOTE_STATUSES.DECLINED, declineReason: reason },
  });
  if (res.count === 0) return null;
  return getQuoteById(id);
}

/** A single quote with its owner (callers enforce authorization). */
export async function getQuoteById(id: string): Promise<QuoteDto | null> {
  const row = await prisma.quote.findUnique({ where: { id }, select: quoteWithUserSelect });
  return row ? toQuoteDto(row, true) : null;
}

export async function listQuotesForUser(userId: string): Promise<QuoteDto[]> {
  const rows = await prisma.quote.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: quoteWithUserSelect,
  });
  return rows.map((r) => toQuoteDto(r));
}

export async function countQuotesForUser(userId: string): Promise<number> {
  return prisma.quote.count({ where: { userId } });
}

export async function listAllQuotes(limit = 100): Promise<QuoteDto[]> {
  const rows = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: quoteWithUserSelect,
  });
  return rows.map((r) => toQuoteDto(r, true));
}

/** Owner-scoped accept: only an ACTIVE, unexpired quote can be accepted. */
export async function acceptQuote(
  id: string,
  userId: string,
  pickupAddress: string,
  pickupSlot: string,
): Promise<boolean> {
  const result = await prisma.quote.updateMany({
    where: {
      id,
      userId,
      status: QUOTE_STATUSES.ACTIVE,
      validUntil: { gt: new Date() },
    },
    data: {
      status: QUOTE_STATUSES.ACCEPTED,
      pickupAddress,
      pickupSlot,
      acceptedAt: new Date(),
    },
  });
  return result.count > 0;
}

/** Admin records the physical-inspection outcome. MATCH honours; MISMATCH adjusts. */
export async function recordInspection(data: {
  id: string;
  result: QuoteInspectionResult;
  reason?: string;
  adjustedPricePkr?: number;
}): Promise<boolean> {
  const result = await prisma.quote.updateMany({
    where: { id: data.id },
    data: {
      status: QUOTE_STATUSES.INSPECTED,
      inspectionResult: data.result,
      inspectionReason: data.reason ?? null,
      adjustedPricePkr:
        data.adjustedPricePkr != null ? new Prisma.Decimal(data.adjustedPricePkr) : null,
      inspectedAt: new Date(),
    },
  });
  return result.count > 0;
}

/** Marks every due ACTIVE quote EXPIRED. Returns how many flipped (cron, Step 7). */
export async function expireDueQuotes(now = new Date()): Promise<number> {
  const result = await prisma.quote.updateMany({
    where: { status: QUOTE_STATUSES.ACTIVE, validUntil: { lte: now } },
    data: { status: QUOTE_STATUSES.EXPIRED },
  });
  return result.count;
}

/** Lazily flips one due quote to EXPIRED (called on read so the UI is never stale). */
export async function expireQuoteIfDue(id: string): Promise<void> {
  await prisma.quote.updateMany({
    where: { id, status: QUOTE_STATUSES.ACTIVE, validUntil: { lte: new Date() } },
    data: { status: QUOTE_STATUSES.EXPIRED },
  });
}
