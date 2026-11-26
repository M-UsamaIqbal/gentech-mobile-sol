import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  INSPECTION_KINDS,
  INSPECTION_PAYMENT_STATUSES,
  INSPECTION_STATUSES,
  type InspectionItemResult,
  type InspectionPaymentStatus,
  type InspectionStatus,
  type InspectionVerdict,
  type PaymentMethod,
} from "@/lib/constants";
import { slugify } from "@/utils/slug";
import { addHistoryEvent } from "@/features/phone-history/services/phone-history.service";
import type {
  InspectionPlanDto,
  InspectionReportDto,
  InspectionRequestDto,
} from "@/features/inspections/types";
import { computeOverallScore, scoreToGrade } from "@/features/inspections/lib/grade";
import {
  CLAIMABLE_STATUSES,
  SCHEDULABLE_STATUSES,
  canSubmitInspectionReport,
} from "@/features/inspections/lib/inspection-state";
import { maskReportImei } from "@/features/inspections/lib/imei";
import {
  inspectionKindForCategory,
  resolveInspectionKind,
} from "@/features/inspections/lib/inspection-kind";
import type {
  BookInspectionInput,
  InspectionPlanInput,
  RequestInspectionInput,
  SubmitReportInput,
} from "@/features/inspections/schemas/inspection";

// ---------------------------------------------------------------------------
// Selects
// ---------------------------------------------------------------------------

const planSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  currency: true,
  checkpoints: true,
  features: true,
  position: true,
  isActive: true,
} satisfies Prisma.InspectionPlanSelect;

const reportSelect = {
  id: true,
  overallScore: true,
  grade: true,
  verdict: true,
  summary: true,
  imei: true,
  ptaApproved: true,
  batteryHealth: true,
  isPublished: true,
  publishedAt: true,
  createdAt: true,
  items: {
    orderBy: { position: "asc" },
    select: {
      id: true,
      category: true,
      label: true,
      result: true,
      score: true,
      comment: true,
    },
  },
  photos: {
    orderBy: { position: "asc" },
    select: { id: true, url: true, caption: true },
  },
} satisfies Prisma.InspectionReportSelect;

const requestSelect = {
  id: true,
  status: true,
  planName: true,
  feeAmount: true,
  currency: true,
  paymentStatus: true,
  paymentMethod: true,
  paidAt: true,
  deviceInfo: true,
  inspectionKind: true,
  contactName: true,
  contactPhone: true,
  city: true,
  area: true,
  address: true,
  notes: true,
  preferredAt: true,
  scheduledAt: true,
  completedAt: true,
  cancelReason: true,
  createdAt: true,
  requester: { select: { id: true, name: true } },
  inspector: { select: { id: true, name: true } },
  listing: {
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      currency: true,
      category: { select: { slug: true } },
      images: {
        where: { isPrimary: true },
        take: 1,
        select: { url: true },
      },
    },
  },
  report: { select: reportSelect },
} satisfies Prisma.InspectionRequestSelect;

type PlanRow = Prisma.InspectionPlanGetPayload<{ select: typeof planSelect }>;
type ReportRow = Prisma.InspectionReportGetPayload<{ select: typeof reportSelect }>;
type RequestRow = Prisma.InspectionRequestGetPayload<{ select: typeof requestSelect }>;

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

/** Coerces the plan's JSON `features` column into a string array. */
function toFeatures(value: Prisma.JsonValue | null): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

function toPlanDto(row: PlanRow): InspectionPlanDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    currency: row.currency,
    checkpoints: row.checkpoints,
    features: toFeatures(row.features),
    position: row.position,
    isActive: row.isActive,
  };
}

function toReportDto(row: ReportRow, includeFullImei: boolean = false): InspectionReportDto {
  return {
    id: row.id,
    overallScore: row.overallScore,
    grade: row.grade,
    verdict: row.verdict as InspectionVerdict,
    summary: row.summary,
    imei: includeFullImei ? row.imei : maskReportImei(row.imei),
    ptaApproved: row.ptaApproved,
    batteryHealth: row.batteryHealth,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((item) => ({
      id: item.id,
      category: item.category,
      label: item.label,
      result: item.result as InspectionItemResult,
      score: item.score,
      comment: item.comment,
    })),
    photos: row.photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      caption: photo.caption,
    })),
  };
}

function toRequestDto(row: RequestRow): InspectionRequestDto {
  return {
    id: row.id,
    status: row.status as InspectionStatus,
    listing: row.listing
      ? {
          id: row.listing.id,
          title: row.listing.title,
          slug: row.listing.slug,
          imageUrl: row.listing.images[0]?.url ?? null,
          price: Number(row.listing.price),
          currency: row.listing.currency,
        }
      : null,
    planName: row.planName,
    feeAmount: Number(row.feeAmount),
    currency: row.currency,
    paymentStatus: row.paymentStatus as InspectionPaymentStatus,
    paymentMethod: (row.paymentMethod as PaymentMethod | null) ?? null,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    deviceInfo: row.deviceInfo,
    inspectionKind: resolveInspectionKind(row.inspectionKind, row.listing?.category.slug),
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    city: row.city,
    area: row.area,
    address: row.address,
    notes: row.notes,
    preferredAt: row.preferredAt ? row.preferredAt.toISOString() : null,
    scheduledAt: row.scheduledAt ? row.scheduledAt.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    cancelReason: row.cancelReason,
    requester: { id: row.requester.id, name: row.requester.name },
    inspector: row.inspector ? { id: row.inspector.id, name: row.inspector.name } : null,
    report: row.report ? toReportDto(row.report, false) : null,
    createdAt: row.createdAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

/** Active inspection packages, cheapest first. */
export async function listActivePlans(): Promise<InspectionPlanDto[]> {
  const rows = await prisma.inspectionPlan.findMany({
    where: { isActive: true },
    orderBy: [{ position: "asc" }, { price: "asc" }],
    select: planSelect,
  });
  return rows.map(toPlanDto);
}

/** All plans (admin view). */
export async function listAllPlans(): Promise<InspectionPlanDto[]> {
  const rows = await prisma.inspectionPlan.findMany({
    orderBy: [{ position: "asc" }, { price: "asc" }],
    select: planSelect,
  });
  return rows.map(toPlanDto);
}

export async function getPlanById(id: string): Promise<InspectionPlanDto | null> {
  const row = await prisma.inspectionPlan.findUnique({ where: { id }, select: planSelect });
  return row ? toPlanDto(row) : null;
}

async function uniquePlanSlug(name: string): Promise<string> {
  const base = slugify(name) || "plan";
  let slug = base;
  let n = 1;
  while (await prisma.inspectionPlan.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function createPlan(input: InspectionPlanInput): Promise<void> {
  await prisma.inspectionPlan.create({
    data: {
      name: input.name,
      slug: await uniquePlanSlug(input.name),
      description: input.description,
      price: new Prisma.Decimal(input.price),
      checkpoints: input.checkpoints ?? 0,
      features: (input.features ?? []) as Prisma.InputJsonValue,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updatePlan(id: string, input: InspectionPlanInput): Promise<void> {
  await prisma.inspectionPlan.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      price: new Prisma.Decimal(input.price),
      checkpoints: input.checkpoints ?? 0,
      features: (input.features ?? []) as Prisma.InputJsonValue,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    },
  });
}

export async function setPlanActive(id: string, isActive: boolean): Promise<void> {
  await prisma.inspectionPlan.update({ where: { id }, data: { isActive } });
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

async function resolveRequestLocation(input: {
  countryId: string;
  cityId: string;
  areaId?: string;
}) {
  const city = await prisma.city.findFirst({
    where: {
      id: input.cityId,
      countryId: input.countryId,
      isActive: true,
      country: { isActive: true },
    },
    select: {
      id: true,
      name: true,
      areas: {
        where: { id: input.areaId || undefined, isActive: true },
        select: { id: true, name: true },
        take: 1,
      },
    },
  });
  if (!city) throw new Error("Choose an active city in the selected country.");
  const area = input.areaId ? city.areas[0] : undefined;
  if (input.areaId && !area) throw new Error("Choose an active area in the selected city.");
  return { city, area };
}

/** Creates a request, snapshotting the plan's name + price onto it. Returns the id. */
export async function createRequest(
  input: RequestInspectionInput,
  requesterId: string,
): Promise<string> {
  const { city, area } = await resolveRequestLocation(input);
  const [plan, listing] = await Promise.all([
    prisma.inspectionPlan.findUnique({
      where: { id: input.planId },
      select: { id: true, name: true, price: true, currency: true, isActive: true },
    }),
    prisma.listing.findUnique({
      where: { id: input.listingId },
      select: { category: { select: { slug: true } } },
    }),
  ]);
  if (!plan || !plan.isActive) {
    throw new Error("Selected inspection package is unavailable.");
  }

  const preferredAt = input.preferredAt ? new Date(input.preferredAt) : null;

  const created = await prisma.inspectionRequest.create({
    data: {
      status: INSPECTION_STATUSES.REQUESTED,
      listingId: input.listingId,
      inspectionKind: inspectionKindForCategory(listing?.category.slug),
      requesterId,
      planId: plan.id,
      planName: plan.name,
      feeAmount: plan.price,
      currency: plan.currency,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      city: city.name,
      cityId: city.id,
      area: area?.name,
      areaId: area?.id,
      address: input.address,
      notes: input.notes,
      preferredAt: preferredAt && !Number.isNaN(preferredAt.getTime()) ? preferredAt : null,
    },
    select: { id: true },
  });
  return created.id;
}

/**
 * Standalone booking: the buyer describes the device (`deviceInfo`) and selects
 * its family rather than picking a listing. Snapshots the plan fee. Returns the id.
 */
export async function createBooking(
  input: BookInspectionInput,
  requesterId: string,
): Promise<string> {
  const { city, area } = await resolveRequestLocation(input);
  const [plan, listing] = await Promise.all([
    prisma.inspectionPlan.findUnique({
      where: { id: input.planId },
      select: { id: true, name: true, price: true, currency: true, isActive: true },
    }),
    input.listingId
      ? prisma.listing.findUnique({
          where: { id: input.listingId },
          select: { category: { select: { slug: true } } },
        })
      : Promise.resolve(null),
  ]);
  if (!plan || !plan.isActive) {
    throw new Error("Selected inspection package is unavailable.");
  }

  // Listing-backed bookings always use the listing's category, even if a client
  // sends a conflicting family. Only standalone bookings honour the selector.
  const kind = input.listingId
    ? inspectionKindForCategory(listing?.category.slug)
    : (input.inspectionKind ?? INSPECTION_KINDS.PHONE);
  const preferredAt = input.preferredAt ? new Date(input.preferredAt) : null;

  const created = await prisma.inspectionRequest.create({
    data: {
      status: INSPECTION_STATUSES.REQUESTED,
      listingId: input.listingId ?? null,
      deviceInfo: input.deviceInfo,
      inspectionKind: kind,
      requesterId,
      planId: plan.id,
      planName: plan.name,
      feeAmount: plan.price,
      currency: plan.currency,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      city: city.name,
      cityId: city.id,
      area: area?.name,
      areaId: area?.id,
      address: input.address,
      notes: input.notes,
      preferredAt: preferredAt && !Number.isNaN(preferredAt.getTime()) ? preferredAt : null,
    },
    select: { id: true },
  });
  return created.id;
}

export async function getRequestById(id: string): Promise<InspectionRequestDto | null> {
  const row = await prisma.inspectionRequest.findUnique({ where: { id }, select: requestSelect });
  return row ? toRequestDto(row) : null;
}

/** Requests created by a buyer, newest first. */
export async function listRequestsForRequester(
  requesterId: string,
): Promise<InspectionRequestDto[]> {
  const rows = await prisma.inspectionRequest.findMany({
    where: { requesterId },
    orderBy: { createdAt: "desc" },
    select: requestSelect,
    take: 100,
  });
  return rows.map(toRequestDto);
}

/** Count of a buyer's inspection requests (for the dashboard tile). */
export async function countRequestsForRequester(requesterId: string): Promise<number> {
  return prisma.inspectionRequest.count({ where: { requesterId } });
}

/**
 * The inspector work queue: unassigned open requests plus everything assigned to
 * this inspector. Terminal states (cancelled/expired) without an assignment are
 * hidden. Admins pass `all` to see every request.
 */
export async function listInspectorQueue(
  inspectorId: string,
  opts?: { all?: boolean },
): Promise<InspectionRequestDto[]> {
  const where: Prisma.InspectionRequestWhereInput = opts?.all
    ? {}
    : {
        OR: [
          { inspectorId },
          {
            inspectorId: null,
            status: {
              in: [
                INSPECTION_STATUSES.REQUESTED,
                INSPECTION_STATUSES.PAYMENT_PENDING,
                INSPECTION_STATUSES.SCHEDULED,
              ],
            },
          },
        ],
      };

  const rows = await prisma.inspectionRequest.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: requestSelect,
    take: 100,
  });
  return rows.map(toRequestDto);
}

/** Assigns the request to an inspector (only if unassigned and still open). */
export async function assignInspector(
  requestId: string,
  inspectorId: string,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: {
      id: requestId,
      inspectorId: null,
      status: { in: [...CLAIMABLE_STATUSES] },
    },
    data: { inspectorId },
  });
  return result.count > 0;
}

/**
 * Sets the scheduled slot + moves to SCHEDULED. Scoped to the assigned inspector
 * and to non-terminal states, so a completed/cancelled request cannot regress.
 */
export async function scheduleRequest(
  requestId: string,
  inspectorId: string,
  scheduledAt: Date,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: {
      id: requestId,
      inspectorId,
      status: { in: [...SCHEDULABLE_STATUSES] },
    },
    data: { status: INSPECTION_STATUSES.SCHEDULED, scheduledAt },
  });
  return result.count > 0;
}

/** Buyer cancels their own request (only before completion). Returns success. */
export async function cancelRequest(
  requestId: string,
  requesterId: string,
  reason?: string,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: {
      id: requestId,
      requesterId,
      status: {
        in: [
          INSPECTION_STATUSES.REQUESTED,
          INSPECTION_STATUSES.PAYMENT_PENDING,
          INSPECTION_STATUSES.SCHEDULED,
        ],
      },
    },
    data: {
      status: INSPECTION_STATUSES.CANCELLED,
      cancelledAt: new Date(),
      cancelReason: reason,
    },
  });
  return result.count > 0;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

const PAYABLE_STATUSES = [
  INSPECTION_STATUSES.REQUESTED,
  INSPECTION_STATUSES.PAYMENT_PENDING,
  INSPECTION_STATUSES.SCHEDULED,
];

/** The buyer's request if it exists, is theirs, and is still awaiting payment. */
export async function getPayableRequest(
  id: string,
  requesterId: string,
): Promise<{
  id: string;
  feeAmount: number;
  feeAmountDecimal: string;
  currency: string;
  contactName: string | null;
  contactPhone: string | null;
  paymentStatus: (typeof INSPECTION_PAYMENT_STATUSES)[keyof typeof INSPECTION_PAYMENT_STATUSES];
  paymentRef: string | null;
} | null> {
  const row = await prisma.inspectionRequest.findFirst({
    where: {
      id,
      requesterId,
      paymentStatus: { not: INSPECTION_PAYMENT_STATUSES.PAID },
      status: { in: PAYABLE_STATUSES },
    },
    select: {
      id: true,
      feeAmount: true,
      currency: true,
      contactName: true,
      contactPhone: true,
      paymentStatus: true,
      paymentRef: true,
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    feeAmount: Number(row.feeAmount),
    feeAmountDecimal: row.feeAmount.toFixed(2),
    currency: row.currency,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    paymentStatus: row.paymentStatus,
    paymentRef: row.paymentRef,
  };
}

/** Stores only the provider transaction id while awaiting customer authentication. */
export async function recordPaymentIntent(
  id: string,
  requesterId: string,
  reference: string,
  method: PaymentMethod,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: {
      id,
      requesterId,
      paymentStatus: {
        in: [
          INSPECTION_PAYMENT_STATUSES.UNPAID,
          INSPECTION_PAYMENT_STATUSES.FAILED,
          INSPECTION_PAYMENT_STATUSES.AWAITING_CUSTOMER,
        ],
      },
    },
    data: {
      paymentRef: reference,
      paymentMethod: method,
      paymentStatus: INSPECTION_PAYMENT_STATUSES.AWAITING_CUSTOMER,
    },
  });
  return result.count > 0;
}

/** Marks a request paid (owner-scoped, idempotent). */
export async function markRequestPaid(
  id: string,
  requesterId: string,
  reference: string,
  method?: PaymentMethod,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: {
      id,
      requesterId,
      paymentRef: reference,
      paymentStatus: {
        notIn: [
          INSPECTION_PAYMENT_STATUSES.PAID,
          INSPECTION_PAYMENT_STATUSES.REFUNDED,
        ],
      },
    },
    data: {
      paymentStatus: INSPECTION_PAYMENT_STATUSES.PAID,
      paidAt: new Date(),
      ...(method ? { paymentMethod: method } : {}),
    },
  });
  return result.count > 0;
}

/** Marks a payment attempt failed (owner-scoped). */
export async function markRequestPaymentFailed(
  id: string,
  requesterId: string,
  reference: string,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: {
      id,
      requesterId,
      paymentRef: reference,
      paymentStatus: {
        in: [
          INSPECTION_PAYMENT_STATUSES.PENDING,
          INSPECTION_PAYMENT_STATUSES.PROCESSING,
        ],
      },
    },
    data: { paymentStatus: INSPECTION_PAYMENT_STATUSES.FAILED },
  });
  return result.count > 0;
}

/** Keeps an accepted PayFast attempt eligible for provider status checks. */
export async function markRequestPaymentPending(
  id: string,
  requesterId: string,
  reference: string,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: {
      id,
      requesterId,
      paymentRef: reference,
      paymentStatus: INSPECTION_PAYMENT_STATUSES.PROCESSING,
    },
    data: { paymentStatus: INSPECTION_PAYMENT_STATUSES.PENDING },
  });
  return result.count > 0;
}

/** Allows a single request to submit the tokenized payment to PayFast. */
export async function claimPaymentProcessing(
  id: string,
  requesterId: string,
  reference: string,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: {
      id,
      requesterId,
      paymentRef: reference,
      paymentStatus: INSPECTION_PAYMENT_STATUSES.AWAITING_CUSTOMER,
    },
    data: { paymentStatus: INSPECTION_PAYMENT_STATUSES.PROCESSING },
  });
  return result.count > 0;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

/** Why a graded report could not be created; mapped to a user message by the action. */
export type InspectionReportOutcome =
  | { ok: true; requesterId: string; listingId: string | null }
  | {
      ok: false;
      reason: "NOT_ASSIGNED" | "ALREADY_REPORTED" | "NOT_REPORTABLE" | "UNPAID";
    };

/**
 * Creates the report for a request, computes its score/grade, and flips the request
 * to COMPLETED — all in one transaction. Scoped to the assigned inspector, refuses
 * terminal requests, and requires the fee to be paid before the report is released.
 */
export async function createReport(
  input: SubmitReportInput,
  inspectorId: string,
): Promise<InspectionReportOutcome> {
  const request = await prisma.inspectionRequest.findUnique({
    where: { id: input.requestId },
    select: {
      id: true,
      inspectorId: true,
      requesterId: true,
      listingId: true,
      inspectionKind: true,
      status: true,
      paymentStatus: true,
      listing: { select: { category: { select: { slug: true } } } },
      report: { select: { id: true } },
    },
  });
  if (!request || request.inspectorId !== inspectorId) {
    return { ok: false, reason: "NOT_ASSIGNED" };
  }
  if (request.report) return { ok: false, reason: "ALREADY_REPORTED" };
  if (
    !canSubmitInspectionReport({
      status: request.status as InspectionStatus,
      paymentStatus: request.paymentStatus as InspectionPaymentStatus,
    })
  ) {
    return {
      ok: false,
      reason:
        request.paymentStatus === INSPECTION_PAYMENT_STATUSES.PAID
          ? "NOT_REPORTABLE"
          : "UNPAID",
    };
  }

  const kind = resolveInspectionKind(request.inspectionKind, request.listing?.category.slug);
  const isPhoneInspection = kind === INSPECTION_KINDS.PHONE;
  const overallScore = computeOverallScore(input.items);
  const grade = scoreToGrade(overallScore);

  // Claim completion inside the transaction so a concurrent cancellation or a
  // double submission can never write a report against a stale state.
  const completed = await prisma.$transaction(async (tx) => {
    const claimed = await tx.inspectionRequest.updateMany({
      where: {
        id: input.requestId,
        inspectorId,
        status: { in: [...SCHEDULABLE_STATUSES] },
        paymentStatus: INSPECTION_PAYMENT_STATUSES.PAID,
      },
      data: { status: INSPECTION_STATUSES.COMPLETED, completedAt: new Date() },
    });
    if (claimed.count === 0) return false;

    await tx.inspectionReport.create({
      data: {
        requestId: input.requestId,
        overallScore,
        grade,
        verdict: input.verdict,
        summary: input.summary,
        // Laptop reports never carry phone-only identity signals, even if a
        // client sends them. Server-side normalisation keeps published data clean.
        imei: isPhoneInspection ? input.imei : null,
        ptaApproved: isPhoneInspection ? input.ptaApproved : null,
        batteryHealth: input.batteryHealth,
        items: {
          create: input.items.map((item, index) => ({
            category: item.category,
            label: item.label,
            result: item.result,
            score: item.score,
            comment: item.comment,
            position: index,
          })),
        },
        photos: {
          create: (input.photos ?? []).map((photo, index) => ({
            url: photo.url,
            publicId: photo.publicId,
            width: photo.width,
            height: photo.height,
            position: index,
          })),
        },
      },
    });
    return true;
  });

  if (!completed) return { ok: false, reason: "ALREADY_REPORTED" };

  // Phone history tracks device identity only; laptop inspections must not pollute it.
  if (isPhoneInspection && request.listingId) {
    await addHistoryEvent({
      listingId: request.listingId,
      eventType: "INSPECTION",
      title: "Inspection Completed",
      description: `Overall score: ${overallScore}/100 (${grade})`,
      status: grade === "A" || grade === "B" ? "PASS" : grade === "C" ? "WARNING" : "FAIL",
      source: "inspection",
      sourceId: input.requestId,
      metadata: {
        overallScore,
        grade,
        verdict: input.verdict,
        ptaApproved: input.ptaApproved,
        batteryHealth: input.batteryHealth,
      },
    }).catch((error) => console.warn("[inspection] failed to create history event:", error));
  }

  return { ok: true, requesterId: request.requesterId, listingId: request.listingId };
}

/** Publishes/unpublishes a report so it shows on the listing. Requester-scoped. */
export async function setReportPublished(
  reportId: string,
  requesterId: string,
  isPublished: boolean,
): Promise<boolean> {
  const result = await prisma.inspectionReport.updateMany({
    where: { id: reportId, request: { requesterId } },
    data: { isPublished, publishedAt: isPublished ? new Date() : null },
  });
  return result.count > 0;
}

/** The most recent PUBLISHED report for a listing, for the public detail page. */
export async function getPublishedReportForListing(
  listingId: string,
): Promise<InspectionReportDto | null> {
  const row = await prisma.inspectionReport.findFirst({
    where: { isPublished: true, request: { listingId } },
    orderBy: { publishedAt: "desc" },
    select: reportSelect,
  });
  return row ? toReportDto(row, false) : null;
}

/**
 * Gets a report with full IMEI for authorized users (requester, assigned inspector, or admin).
 * This should be called from the service layer after authorization checks.
 */
export async function getReportWithFullImei(
  reportId: string,
): Promise<InspectionReportDto | null> {
  const row = await prisma.inspectionReport.findUnique({
    where: { id: reportId },
    select: reportSelect,
  });
  return row ? toReportDto(row, true) : null;
}
