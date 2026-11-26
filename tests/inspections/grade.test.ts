import { describe, expect, it } from "vitest";

import { INSPECTION_ITEM_RESULTS } from "@/lib/constants";
import { computeOverallScore, scoreToGrade } from "@/features/inspections/lib/grade";

type ItemResult = (typeof INSPECTION_ITEM_RESULTS)[keyof typeof INSPECTION_ITEM_RESULTS];

function items(...results: ItemResult[]) {
  return results.map((result) => ({ result }));
}

describe("inspection grading", () => {
  it("scores all-pass checklists as 100 / A", () => {
    const score = computeOverallScore(
      items(...Array<ItemResult>(8).fill(INSPECTION_ITEM_RESULTS.PASS)),
    );

    expect(score).toBe(100);
    expect(scoreToGrade(score)).toBe("A");
  });

  it("scores all-minor checklists as 60 / C", () => {
    const score = computeOverallScore(
      items(...Array<ItemResult>(5).fill(INSPECTION_ITEM_RESULTS.MINOR_ISSUE)),
    );

    expect(score).toBe(60);
    expect(scoreToGrade(score)).toBe("C");
  });

  it("scores all-major checklists as 0 / F", () => {
    const score = computeOverallScore(
      items(...Array<ItemResult>(5).fill(INSPECTION_ITEM_RESULTS.MAJOR_ISSUE)),
    );

    expect(score).toBe(0);
    expect(scoreToGrade(score)).toBe("F");
  });

  it("excludes N/A items from the average", () => {
    const score = computeOverallScore(
      items(
        INSPECTION_ITEM_RESULTS.PASS,
        INSPECTION_ITEM_RESULTS.NOT_APPLICABLE,
        INSPECTION_ITEM_RESULTS.PASS,
      ),
    );

    expect(score).toBe(100);
  });

  it("returns 0 when every item is N/A (nothing was actually graded)", () => {
    const score = computeOverallScore(
      items(
        INSPECTION_ITEM_RESULTS.NOT_APPLICABLE,
        INSPECTION_ITEM_RESULTS.NOT_APPLICABLE,
      ),
    );

    expect(score).toBe(0);
    expect(scoreToGrade(score)).toBe("F");
  });

  it("rounds the average to the nearest whole number", () => {
    // (100 + 60 + 60) / 3 = 73.33…
    expect(
      computeOverallScore(
        items(
          INSPECTION_ITEM_RESULTS.PASS,
          INSPECTION_ITEM_RESULTS.MINOR_ISSUE,
          INSPECTION_ITEM_RESULTS.MINOR_ISSUE,
        ),
      ),
    ).toBe(73);
  });

  it("handles a mixed pass/major checklist", () => {
    // (100 + 0) / 2 = 50
    expect(
      computeOverallScore(
        items(INSPECTION_ITEM_RESULTS.PASS, INSPECTION_ITEM_RESULTS.MAJOR_ISSUE),
      ),
    ).toBe(50);
  });

  it("returns 0 for an empty checklist", () => {
    expect(computeOverallScore([])).toBe(0);
  });

  it.each([
    [100, "A"],
    [90, "A"],
    [89, "B"],
    [75, "B"],
    [74, "C"],
    [60, "C"],
    [59, "D"],
    [40, "D"],
    [39, "F"],
    [0, "F"],
  ] as const)("maps score %i to grade %s", (score, grade) => {
    expect(scoreToGrade(score)).toBe(grade);
  });
});
