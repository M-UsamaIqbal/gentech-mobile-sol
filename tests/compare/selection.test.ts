import { describe, expect, it } from "vitest";

import {
  MAX_COMPARE_ITEMS,
  canAddCompareSelection,
  toggleCompareSelection,
} from "@/features/compare/lib/selection";

describe("compare selection", () => {
  it("adds listings up to the four-phone limit", () => {
    let selected: string[] = [];
    for (let index = 1; index <= MAX_COMPARE_ITEMS; index += 1) {
      selected = toggleCompareSelection(selected, `listing-${index}`);
    }

    expect(selected).toEqual(["listing-1", "listing-2", "listing-3", "listing-4"]);
  });

  it("ignores an additional listing when the limit is reached", () => {
    const selected = ["a", "b", "c", "d"];

    expect(toggleCompareSelection(selected, "e")).toEqual(selected);
    expect(canAddCompareSelection(selected, "e")).toBe(false);
  });

  it("allows the already selected listing to be toggled off at the limit", () => {
    const selected = ["a", "b", "c", "d"];

    expect(canAddCompareSelection(selected, "b")).toBe(true);
    expect(toggleCompareSelection(selected, "b")).toEqual(["a", "c", "d"]);
  });

  it("does not mutate the input array", () => {
    const selected = ["a", "b"];
    const next = toggleCompareSelection(selected, "c");

    expect(selected).toEqual(["a", "b"]);
    expect(next).not.toBe(selected);
  });
});
