import { describe, expect, it } from "vitest";

import {
  carouselIndexFromScroll,
  carouselScrollLeft,
  clampCarouselIndex,
} from "@/lib/mobile-carousel";

describe("mobile carousel geometry", () => {
  it("clamps slide indices for empty sets and out-of-range values", () => {
    expect(clampCarouselIndex(2, 0)).toBe(0);
    expect(clampCarouselIndex(-4, 3)).toBe(0);
    expect(clampCarouselIndex(9, 3)).toBe(2);
    expect(clampCarouselIndex(Number.NaN, 3)).toBe(0);
    expect(clampCarouselIndex(1.6, 3)).toBe(2);
  });

  it("maps a snapped scroll offset back to the nearest slide", () => {
    expect(carouselIndexFromScroll(0, 320, 3)).toBe(0);
    expect(carouselIndexFromScroll(320, 320, 3)).toBe(1);
    expect(carouselIndexFromScroll(590, 320, 3)).toBe(2);
    expect(carouselIndexFromScroll(2000, 320, 3)).toBe(2);
    expect(carouselIndexFromScroll(120, 320, 0)).toBe(0);
    expect(carouselIndexFromScroll(120, 0, 3)).toBe(0);
  });

  it("computes a clamped scroll offset for a slide", () => {
    expect(carouselScrollLeft(1, 320, 3)).toBe(320);
    expect(carouselScrollLeft(7, 320, 3)).toBe(640);
    expect(carouselScrollLeft(2, 0, 3)).toBe(0);
  });
});
