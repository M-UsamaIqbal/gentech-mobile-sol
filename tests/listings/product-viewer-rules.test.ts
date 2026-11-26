import { describe, expect, it } from "vitest";

import {
  DRAG_PIXELS_PER_FRAME,
  MAX_ZOOM,
  MIN_FULL_360_FRAMES,
  MIN_ROTATION_FRAMES,
  MIN_ZOOM,
  blendFromDrag,
  clampFrame,
  clampPanOffset,
  clampZoom,
  frameFromDrag,
  getViewerTier,
  preloadFrames,
  wrapFrameIndex,
} from "@/lib/product-viewer";

describe("product viewer tiers", () => {
  it.each([
    [1, "photo"],
    [2, "switch"],
    [3, "switch"],
    [4, "multi-angle"],
    [11, "multi-angle"],
    [12, "rotation"],
    [23, "rotation"],
    [24, "full-360"],
    [36, "full-360"],
  ])("maps %i photos to the %s tier", (count, mode) => {
    expect(getViewerTier(count).mode).toBe(mode);
  });

  it("enables auto rotation and wrapping only for rotation tiers", () => {
    expect(getViewerTier(4).autoRotate).toBe(false);
    expect(getViewerTier(MIN_ROTATION_FRAMES).autoRotate).toBe(true);
    expect(getViewerTier(MIN_FULL_360_FRAMES).mode).toBe("full-360");
  });
});

describe("product viewer frame geometry", () => {
  it("advances frames in the drag direction", () => {
    expect(frameFromDrag(0, -DRAG_PIXELS_PER_FRAME - 1, 12, true)).toBe(1);
    expect(frameFromDrag(5, DRAG_PIXELS_PER_FRAME + 1, 12, true)).toBe(4);
    expect(frameFromDrag(0, -5, 12, true)).toBe(0);
  });

  it("clamps limited-angle sets but wraps true rotation sets", () => {
    expect(frameFromDrag(11, -DRAG_PIXELS_PER_FRAME, 12, false)).toBe(11);
    expect(frameFromDrag(11, -DRAG_PIXELS_PER_FRAME, 12, true)).toBe(0);
    expect(frameFromDrag(0, DRAG_PIXELS_PER_FRAME, 12, true)).toBe(11);
  });

  it("keeps invalid input bounded", () => {
    expect(clampFrame(Number.NaN, 4)).toBe(0);
    expect(clampFrame(99, 4)).toBe(3);
    expect(frameFromDrag(2, Number.NaN, 4, true)).toBe(2);
  });
});

describe("zero-cost frame blending", () => {
  it("wraps indices for rotation tiers", () => {
    expect(wrapFrameIndex(-1, 12)).toBe(11);
    expect(wrapFrameIndex(12, 12)).toBe(0);
  });

  it("blends adjacent real photos in the drag direction", () => {
    expect(blendFromDrag(0, -DRAG_PIXELS_PER_FRAME / 2, 12, true)).toEqual({
      from: 0,
      to: 1,
      ratio: 0.5,
    });
    expect(blendFromDrag(0, DRAG_PIXELS_PER_FRAME / 2, 12, true)).toEqual({
      from: 0,
      to: 11,
      ratio: 0.5,
    });
  });

  it("does not blend past the ends of limited-angle sets", () => {
    expect(blendFromDrag(2, -DRAG_PIXELS_PER_FRAME, 3, false)).toEqual({
      from: 2,
      to: 2,
      ratio: 0,
    });
  });

  it("never blends with one photo or an invalid drag", () => {
    expect(blendFromDrag(0, -13, 1, true)).toEqual({ from: 0, to: 0, ratio: 0 });
    expect(blendFromDrag(0, Number.NaN, 4, true)).toEqual({ from: 0, to: 0, ratio: 0 });
  });

  it("keeps the blend base aligned with the selected frame", () => {
    const delta = -DRAG_PIXELS_PER_FRAME - 5;
    expect(blendFromDrag(0, delta, 12, true).from).toBe(
      frameFromDrag(0, delta, 12, true),
    );
  });
});

describe("product viewer zoom and preloading", () => {
  it("snaps zoom to quarter steps and clamps its range", () => {
    expect(clampZoom(1.1)).toBe(1);
    expect(clampZoom(1.3)).toBe(1.25);
    expect(clampZoom(99)).toBe(MAX_ZOOM);
    expect(clampZoom(Number.NaN)).toBe(MIN_ZOOM);
  });

  it("keeps pan proportional to the zoom level", () => {
    expect(clampPanOffset(1000, MIN_ZOOM)).toBe(0);
    expect(clampPanOffset(1000, 2)).toBe(240);
    expect(clampPanOffset(Number.NaN, 2)).toBe(0);
  });

  it("warms neighbours without duplicating the active frame", () => {
    expect(preloadFrames(0, 12, 2, false)).toEqual([1, 2]);
    expect(preloadFrames(0, 12, 1, true)).toEqual([11, 1]);
    expect(preloadFrames(0, 1, 2, true)).toEqual([]);
  });
});
