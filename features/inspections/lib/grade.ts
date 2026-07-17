import { INSPECTION_ITEM_RESULTS, type InspectionItemResult } from "@/lib/constants";

/** Points a single checklist result contributes toward the overall score (0..100). */
const RESULT_WEIGHT: Record<InspectionItemResult, number | null> = {
  [INSPECTION_ITEM_RESULTS.PASS]: 100,
  [INSPECTION_ITEM_RESULTS.MINOR_ISSUE]: 60,
  [INSPECTION_ITEM_RESULTS.MAJOR_ISSUE]: 0,
  // N/A items are excluded from the average entirely.
  [INSPECTION_ITEM_RESULTS.NOT_APPLICABLE]: null,
};

/**
 * Derives a 0..100 overall score from the graded checklist. Items marked N/A are
 * ignored. Returns 0 when every item is N/A (nothing meaningful was tested).
 */
export function computeOverallScore(
  items: ReadonlyArray<{ result: InspectionItemResult }>,
): number {
  const weights = items
    .map((item) => RESULT_WEIGHT[item.result])
    .filter((w): w is number => w !== null);
  if (weights.length === 0) return 0;
  const sum = weights.reduce((total, w) => total + w, 0);
  return Math.round(sum / weights.length);
}

/** Maps a 0..100 score to a letter grade. */
export function scoreToGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}
