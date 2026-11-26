import { z } from "zod";

import {
  INSPECTION_ITEM_RESULTS,
  INSPECTION_KINDS,
  INSPECTION_KIND_VALUES,
  INSPECTION_VERDICTS,
  type InspectionItemResult,
  type InspectionVerdict,
} from "@/lib/constants";

const ITEM_RESULT_VALUES = Object.values(INSPECTION_ITEM_RESULTS) as [
  InspectionItemResult,
  ...InspectionItemResult[],
];
const VERDICT_VALUES = Object.values(INSPECTION_VERDICTS) as [
  InspectionVerdict,
  ...InspectionVerdict[],
];

/** An image uploaded to Cloudinary (mirrors the listing uploader payload). */
export const uploadedImageSchema = z.object({
  url: z.url(),
  publicId: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type UploadedImage = z.infer<typeof uploadedImageSchema>;

// ---------------------------------------------------------------------------
// Buyer: request an inspection for a listing.
// ---------------------------------------------------------------------------

export const requestInspectionSchema = z.object({
  listingId: z.string().min(1),
  planId: z.string().min(1, "Choose an inspection package"),
  contactName: z.string().trim().min(2, "Enter your name").max(80),
  contactPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20),
  countryId: z.string().min(1, "Select a country"),
  cityId: z.string().min(1, "Select a city"),
  areaId: z.string().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional(),
  /** ISO date/datetime string for the buyer's preferred slot. */
  preferredAt: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional(),
});

export type RequestInspectionInput = z.infer<typeof requestInspectionSchema>;

/**
 * Standalone booking (PakWheels-style): the buyer describes the device they want
 * inspected instead of picking an existing listing. `listingId` is optional so the
 * same flow can also be pre-filled from a listing.
 */
export const bookInspectionSchema = z.object({
  planId: z.string().min(1, "Choose an inspection package"),
  deviceInfo: z
    .string()
    .trim()
    .min(2, "Tell us which device to inspect")
    .max(120),
  inspectionKind: z.enum(INSPECTION_KIND_VALUES).default(INSPECTION_KINDS.PHONE),
  listingId: z.string().optional(),
  contactName: z.string().trim().min(2, "Enter your name").max(80),
  contactPhone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  countryId: z.string().min(1, "Select a country"),
  cityId: z.string().min(1, "Select a city"),
  areaId: z.string().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional(),
  preferredAt: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional(),
});

export type BookInspectionInput = z.infer<typeof bookInspectionSchema>;

// ---------------------------------------------------------------------------
// Inspector: schedule + submit a report.
// ---------------------------------------------------------------------------

export const scheduleInspectionSchema = z.object({
  requestId: z.string().min(1),
  /** ISO datetime string. */
  scheduledAt: z.string().trim().min(1, "Pick a date & time"),
});

export type ScheduleInspectionInput = z.infer<typeof scheduleInspectionSchema>;

export const reportItemSchema = z.object({
  category: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  result: z.enum(ITEM_RESULT_VALUES),
  score: z.number().int().min(0).max(10).optional(),
  comment: z.string().trim().max(500).optional(),
});

export type ReportItemInput = z.infer<typeof reportItemSchema>;

export const submitReportSchema = z.object({
  requestId: z.string().min(1),
  verdict: z.enum(VERDICT_VALUES),
  summary: z.string().trim().max(2000).optional(),
  imei: z
    .string()
    .trim()
    .max(40)
    .optional()
    .refine((value) => !value || /^\d{15}$/.test(value), "IMEI must be exactly 15 digits"),
  ptaApproved: z.boolean().optional(),
  batteryHealth: z.number().int().min(0).max(100).optional(),
  items: z
    .array(reportItemSchema)
    .min(1, "Add at least one checklist item")
    .max(100, "Too many checklist items")
    // Ungraded (N/A) lines are excluded from the score, so a report needs at
    // least one real result. Otherwise every item could be skipped and an
    // unearned grade recorded.
    .refine(
      (items) =>
        items.some((item) => item.result !== INSPECTION_ITEM_RESULTS.NOT_APPLICABLE),
      "Grade at least one checklist item",
    ),
  photos: z.array(uploadedImageSchema).max(20).optional(),
});

export type SubmitReportInput = z.infer<typeof submitReportSchema>;

// ---------------------------------------------------------------------------
// Admin: manage inspection packages.
// ---------------------------------------------------------------------------

export const inspectionPlanSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  description: z.string().trim().max(500).optional(),
  price: z.number().nonnegative("Price cannot be negative").max(10_000_000),
  checkpoints: z.number().int().min(0).max(500).optional(),
  features: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  isActive: z.boolean().optional(),
});

export type InspectionPlanInput = z.infer<typeof inspectionPlanSchema>;
