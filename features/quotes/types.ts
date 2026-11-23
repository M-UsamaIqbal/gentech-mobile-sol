import type {
  PtaStatus,
  QuoteGrade,
  QuoteInspectionResult,
  QuoteStatus,
} from "@/lib/constants";
import type { QuoteAnswers, QuotePhoto } from "@/features/quotes/schemas/quote";

/** A row in the admin-editable price book. */
export interface PhoneModelDto {
  id: string;
  brand: string;
  model: string;
  storage: string;
  ptaStatus: PtaStatus;
  basePricePkr: number;
  isActive: boolean;
}

/** Catalog grouped for the cascading Brand → Model → Storage picker. */
export interface CatalogDto {
  brands: string[];
  /** brand → models */
  modelsByBrand: Record<string, string[]>;
  /** `${brand}::${model}` → [{ storage, ptaStatus, basePricePkr }] */
  variantsByModel: Record<
    string,
    Array<{ storage: string; ptaStatus: PtaStatus; basePricePkr: number }>
  >;
}

/** An admin-editable deduction rule. */
export interface DeductionRuleDto {
  id: string;
  key: string;
  label: string;
  amountPkr: number | null;
  percent: number | null;
  isActive: boolean;
  position: number;
}

/** One applied deduction line, snapshotted onto a quote. */
export interface AppliedDeduction {
  key: string;
  label: string;
  amount: number;
}

/** The structured result returned by the vision LLM (Step 4). */
export interface QuoteAiResult {
  grade: QuoteGrade;
  defects: Array<{ photo: number; issue: string; severity: "minor" | "major" }>;
  mismatches: string[];
  screenshot_data: { model: string; storage: string; battery_health: string };
  retake_needed: number[];
  confidence: number;
}

/** Grade multipliers used in pricing (admin-editable). */
export type GradeMultipliers = Record<QuoteGrade, number>;

/** A full quote for the result page / dashboard / admin. */
export interface QuoteDto {
  id: string;
  status: QuoteStatus;
  brand: string;
  model: string;
  storage: string;
  ptaStatus: PtaStatus;
  basePricePkr: number;
  answers: QuoteAnswers;
  photos: QuotePhoto[];
  aiGrade: QuoteGrade | null;
  aiDefects: QuoteAiResult["defects"];
  aiFlags: {
    mismatches: string[];
    screenshot_data?: QuoteAiResult["screenshot_data"];
    retake_needed: number[];
    confidence: number;
  } | null;
  gradeMultiplier: number;
  deductions: AppliedDeduction[];
  priceMin: number;
  priceMax: number;
  pickupAddress: string | null;
  pickupSlot: string | null;
  acceptedAt: string | null;
  /** Reason shown to the seller when an admin declines a pending request. */
  declineReason: string | null;
  inspectionResult: QuoteInspectionResult | null;
  inspectionReason: string | null;
  adjustedPricePkr: number | null;
  inspectedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  validUntil: string;
  /** Owner (present in admin views). */
  user?: { id: string; name: string; email: string } | null;
}

/**
 * Outcome of a create-quote attempt. When the AI needs retakes we return the
 * reasons instead of a quote so the UI can send the seller back to those slots.
 */
export type CreateQuoteResult =
  | { kind: "quote"; quote: QuoteDto }
  | {
      kind: "retake";
      retakeSlots: number[];
      confidence: number;
      reason: string;
    };
