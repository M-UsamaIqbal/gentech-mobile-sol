import { z } from "zod";

import {
  PTA_STATUSES,
  QUOTE_INSPECTION_RESULTS,
  type PtaStatus,
  type QuoteInspectionResult,
} from "@/lib/constants";
import { PHOTO_SLOT_COUNT } from "@/features/quotes/lib/questions";

const PTA_VALUES = Object.values(PTA_STATUSES) as [PtaStatus, ...PtaStatus[]];
const INSPECTION_RESULT_VALUES = Object.values(QUOTE_INSPECTION_RESULTS) as [
  QuoteInspectionResult,
  ...QuoteInspectionResult[],
];

// ---------------------------------------------------------------------------
// Questionnaire answers (Step 2).
// ---------------------------------------------------------------------------

export const quoteAnswersSchema = z.object({
  ptaStatus: z.enum(PTA_VALUES),
  boxAvailable: z.boolean(),
  chargerAvailable: z.boolean(),
  warranty: z.enum(["none", "lt6", "6to12", "gt12"]),
  /** Required for iPhones (enforced in `createQuoteSchema`), optional otherwise. */
  batteryHealth: z.number().int().min(0).max(100).nullable().optional(),
  partsReplaced: z.array(z.enum(["screen", "back_panel", "battery"])).default([]),
  biometricsWorking: z.boolean(),
  displayIssues: z.array(z.enum(["lines", "dots", "shade"])).default([]),
  cameraIssue: z.boolean(),
  waterDamage: z.boolean(),
  screenProtector: z.boolean(),
});

export type QuoteAnswers = z.infer<typeof quoteAnswersSchema>;

// ---------------------------------------------------------------------------
// Photos (Step 3). The client compresses + validates; the server re-checks count.
// ---------------------------------------------------------------------------

export const quotePhotoSchema = z.object({
  slot: z.number().int().min(1).max(PHOTO_SLOT_COUNT),
  // Absolute URL (Cloudinary) or a root-relative local-upload path (dev fallback).
  url: z
    .string()
    .min(1)
    .refine((v) => /^https?:\/\//i.test(v) || v.startsWith("/"), "Enter a valid image URL."),
  publicId: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type QuotePhoto = z.infer<typeof quotePhotoSchema>;

const quotePhotosSchema = z
  .array(quotePhotoSchema)
  .length(PHOTO_SLOT_COUNT, `All ${PHOTO_SLOT_COUNT} photos are required.`)
  .refine(
    (photos) => new Set(photos.map((p) => p.slot)).size === PHOTO_SLOT_COUNT,
    "Each of the five photo slots must be filled exactly once.",
  );

// ---------------------------------------------------------------------------
// Create a quote (the whole submission).
// ---------------------------------------------------------------------------

export const createQuoteSchema = z
  .object({
    brand: z.string().trim().min(1, "Choose a brand").max(60),
    model: z.string().trim().min(1, "Choose a model").max(80),
    storage: z.string().trim().min(1, "Choose a storage option").max(40),
    answers: quoteAnswersSchema,
    photos: quotePhotosSchema,
  })
  .refine(
    // Battery health is mandatory for Apple devices (Step 2, rule 5).
    (data) =>
      data.brand.toLowerCase() !== "apple" ||
      (typeof data.answers.batteryHealth === "number" && data.answers.batteryHealth >= 0),
    {
      message: "Battery health is required for iPhones.",
      path: ["answers", "batteryHealth"],
    },
  );

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

// ---------------------------------------------------------------------------
// Accept a quote (Step 6) — pickup address + time slot.
// ---------------------------------------------------------------------------

export const acceptQuoteSchema = z.object({
  id: z.string().trim().min(1),
  pickupAddress: z.string().trim().min(10, "Enter a full pickup address").max(400),
  pickupSlot: z.string().trim().min(1, "Choose a pickup time").max(120),
});

export type AcceptQuoteInput = z.infer<typeof acceptQuoteSchema>;

// ---------------------------------------------------------------------------
// Admin: edit the price book, deduction rules and grade multipliers (Step 8).
// ---------------------------------------------------------------------------

export const phoneModelSchema = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  storage: z.string().trim().min(1).max(40),
  ptaStatus: z.enum(PTA_VALUES),
  basePricePkr: z.number().nonnegative().max(100_000_000),
  isActive: z.boolean().optional(),
});

export type PhoneModelInput = z.infer<typeof phoneModelSchema>;

export const deductionRuleSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(2)
      .max(60)
      .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores only"),
    label: z.string().trim().min(2).max(120),
    amountPkr: z.number().nonnegative().max(100_000_000).nullable().optional(),
    percent: z.number().min(0).max(100).nullable().optional(),
    isActive: z.boolean().optional(),
    position: z.number().int().min(0).max(999).optional(),
  })
  .refine(
    (r) =>
      (r.amountPkr != null && r.percent == null) || (r.amountPkr == null && r.percent != null),
    { message: "Set exactly one of a flat amount OR a percentage.", path: ["amountPkr"] },
  );

export type DeductionRuleInput = z.infer<typeof deductionRuleSchema>;

export const gradeMultipliersSchema = z.object({
  A: z.number().min(0).max(2),
  B: z.number().min(0).max(2),
  C: z.number().min(0).max(2),
});

export type GradeMultipliersInput = z.infer<typeof gradeMultipliersSchema>;

export const inspectQuoteSchema = z
  .object({
    id: z.string().trim().min(1),
    result: z.enum(INSPECTION_RESULT_VALUES),
    reason: z.string().trim().max(500).optional(),
    /** Required when the result is MISMATCH (Step 8). */
    adjustedPricePkr: z.number().nonnegative().max(100_000_000).optional(),
  })
  .refine(
    (d) =>
      d.result !== QUOTE_INSPECTION_RESULTS.MISMATCH ||
      (typeof d.adjustedPricePkr === "number" && (d.reason?.trim().length ?? 0) > 0),
    {
      message: "A mismatch needs both a reason and the adjusted price.",
      path: ["adjustedPricePkr"],
    },
  );

export type InspectQuoteInput = z.infer<typeof inspectQuoteSchema>;

// ---------------------------------------------------------------------------
// Admin review of a submitted (pending) request: approve with a price, or decline.
// ---------------------------------------------------------------------------

export const approveQuoteSchema = z.object({
  id: z.string().trim().min(1),
  offerPricePkr: z
    .number({ message: "Enter an offer price" })
    .positive("Offer must be greater than 0")
    .max(100_000_000),
});

export type ApproveQuoteInput = z.infer<typeof approveQuoteSchema>;

export const declineQuoteSchema = z.object({
  id: z.string().trim().min(1),
  reason: z.string().trim().min(3, "Add a short reason").max(500),
});

export type DeclineQuoteInput = z.infer<typeof declineQuoteSchema>;
