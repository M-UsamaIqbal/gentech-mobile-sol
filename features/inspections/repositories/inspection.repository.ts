import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import {
  INSPECTION_PAYMENT_STATUSES,
  INSPECTION_STATUSES,
  type InspectionItemResult,
  type InspectionPaymentStatus,
  type InspectionStatus,
  type InspectionVerdict,
  type PaymentMethod,
} from "@/lib/constants";
import { slugify } from "@/utils/slug";
import type {
  InspectionPlanDto,
  InspectionReportDto,
  InspectionRequestDto,
} from "@/features/inspections/types";
import { computeOverallScore, scoreToGrade } from "@/features/inspections/lib/grade";
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

function toReportDto(row: ReportRow): InspectionReportDto {
  return {
    id: row.id,
    overallScore: row.overallScore,
    grade: row.grade,
    verdict: row.verdict as InspectionVerdict,
    summary: row.summary,
    imei: row.imei,
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
    report: row.report ? toReportDto(row.report) : null,
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

/** Creates a request, snapshotting the plan's name + price onto it. Returns the id. */
export async function createRequest(
  input: RequestInspectionInput,
  requesterId: string,
): Promise<string> {
  const plan = await prisma.inspectionPlan.findUnique({
    where: { id: input.planId },
    select: { id: true, name: true, price: true, currency: true, isActive: true },
  });
  if (!plan || !plan.isActive) {
    throw new Error("Selected inspection package is unavailable.");
  }

  const preferredAt = input.preferredAt ? new Date(input.preferredAt) : null;

  const created = await prisma.inspectionRequest.create({
    data: {
      status: INSPECTION_STATUSES.REQUESTED,
      listingId: input.listingId,
      requesterId,
      planId: plan.id,
      planName: plan.name,
      feeAmount: plan.price,
      currency: plan.currency,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      city: input.city,
      area: input.area,
      address: input.address,
      notes: input.notes,
      preferredAt: preferredAt && !Number.isNaN(preferredAt.getTime()) ? preferredAt : null,
    },
    select: { id: true },
  });
  return created.id;
}

/**
 * Standalone booking: the buyer describes the phone (`deviceInfo`) rather than
 * selecting a listing. Snapshots the plan fee. Returns the new request id.
 */
export async function createBooking(
  input: BookInspectionInput,
  requesterId: string,
): Promise<string> {
  const plan = await prisma.inspectionPlan.findUnique({
    where: { id: input.planId },
    select: { id: true, name: true, price: true, currency: true, isActive: true },
  });
  if (!plan || !plan.isActive) {
    throw new Error("Selected inspection package is unavailable.");
  }

  const preferredAt = input.preferredAt ? new Date(input.preferredAt) : null;

  const created = await prisma.inspectionRequest.create({
    data: {
      status: INSPECTION_STATUSES.REQUESTED,
      listingId: input.listingId ?? null,
      deviceInfo: input.deviceInfo,
      requesterId,
      planId: plan.id,
      planName: plan.name,
      feeAmount: plan.price,
      currency: plan.currency,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      city: input.city,
      area: input.area,
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
  });
  return rows.map(toRequestDto);
}

/** Assigns the request to an inspector (only if currently unassigned). Returns success. */
export async function assignInspector(
  requestId: string,
  inspectorId: string,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: { id: requestId, inspectorId: null },
    data: { inspectorId },
  });
  return result.count > 0;
}

/** Sets the scheduled slot + moves to SCHEDULED. Scoped to the assigned inspector. */
export async function scheduleRequest(
  requestId: string,
  inspectorId: string,
  scheduledAt: Date,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: { id: requestId, inspectorId },
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
  currency: string;
  contactName: string | null;
  contactPhone: string | null;
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
    },
  });
  if (!row) return null;
  return {
    id: row.id,
    feeAmount: Number(row.feeAmount),
    currency: row.currency,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
  };
}

/** Records the chosen method + gateway reference when a checkout is started. */
export async function recordPaymentIntent(
  id: string,
  requesterId: string,
  reference: string,
  method: PaymentMethod,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: { id, requesterId, paymentStatus: { not: INSPECTION_PAYMENT_STATUSES.PAID } },
    data: { paymentRef: reference, paymentMethod: method },
  });
  return result.count > 0;
}

/** Marks a request paid (owner-scoped, idempotent). */
export async function markRequestPaid(
  id: string,
  requesterId: string,
  method?: PaymentMethod,
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: { id, requesterId, paymentStatus: { not: INSPECTION_PAYMENT_STATUSES.PAID } },
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
): Promise<boolean> {
  const result = await prisma.inspectionRequest.updateMany({
    where: { id, requesterId, paymentStatus: INSPECTION_PAYMENT_STATUSES.UNPAID },
    data: { paymentStatus: INSPECTION_PAYMENT_STATUSES.FAILED },
  });
  return result.count > 0;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

/**
 * Creates the report for a request, computes its score/grade, and flips the request
 * to COMPLETED — all in one transaction. Scoped to the assigned inspector. Returns
 * the requester id (for notification) or null if the request wasn't theirs to report.
 */
export async function createReport(
  input: SubmitReportInput,
  inspectorId: string,
): Promise<{ requesterId: string; listingId: string | null } | null> {
  const request = await prisma.inspectionRequest.findUnique({
    where: { id: input.requestId },
    select: { id: true, inspectorId: true, requesterId: true, listingId: true, report: { select: { id: true } } },
  });
  if (!request || request.inspectorId !== inspectorId || request.report) return null;

  const overallScore = computeOverallScore(input.items);
  const grade = scoreToGrade(overallScore);

  await prisma.$transaction([
    prisma.inspectionReport.create({
      data: {
        requestId: input.requestId,
        overallScore,
        grade,
        verdict: input.verdict,
        summary: input.summary,
        imei: input.imei,
        ptaApproved: input.ptaApproved,
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
    }),
    prisma.inspectionRequest.update({
      where: { id: input.requestId },
      data: { status: INSPECTION_STATUSES.COMPLETED, completedAt: new Date() },
    }),
  ]);

  return { requesterId: request.requesterId, listingId: request.listingId };
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
  return row ? toReportDto(row) : null;
}
