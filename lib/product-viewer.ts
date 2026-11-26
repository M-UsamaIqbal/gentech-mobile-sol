/**
 * Framework-agnostic rules for turning ordinary product photographs into an
 * interactive viewing experience. No special 360 media is involved: the
 * uploaded photo sequence is the frame sequence.
 */

export type ViewerMode = "photo" | "switch" | "multi-angle" | "rotation" | "full-360";

export interface ViewerTier {
  mode: ViewerMode;
  /** Minimum photo count that qualifies for this tier. */
  minFrames: number;
  /** Whether horizontal dragging selects another photo. */
  rotates: boolean;
  /** Whether continuous auto-play is appropriate. */
  autoRotate: boolean;
  /** Translation suffix used for the tier hint. */
  labelKey: string;
}

const TIERS: readonly ViewerTier[] = [
  { mode: "photo", minFrames: 1, rotates: false, autoRotate: false, labelKey: "photo" },
  { mode: "switch", minFrames: 2, rotates: true, autoRotate: false, labelKey: "switch" },
  { mode: "multi-angle", minFrames: 4, rotates: true, autoRotate: false, labelKey: "multiAngle" },
  { mode: "rotation", minFrames: 12, rotates: true, autoRotate: true, labelKey: "rotation" },
  { mode: "full-360", minFrames: 24, rotates: true, autoRotate: true, labelKey: "full360" },
];

/** Honest tier for a photo count — never claims 360° with fewer than 24 frames. */
export function getViewerTier(frameCount: number): ViewerTier {
  let tier = TIERS[0]!;
  for (const candidate of TIERS) {
    if (frameCount >= candidate.minFrames) tier = candidate;
  }
  return tier;
}

export const MIN_ROTATION_FRAMES = TIERS[3]!.minFrames;
export const MIN_FULL_360_FRAMES = TIERS[4]!.minFrames;

/** Pixels of horizontal drag required to advance one frame. */
export const DRAG_PIXELS_PER_FRAME = 26;

export function clampFrame(index: number, frameCount: number): number {
  if (!Number.isFinite(index) || frameCount <= 0) return 0;
  return Math.min(Math.max(Math.round(index), 0), frameCount - 1);
}

export function wrapFrameIndex(index: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  return ((index % frameCount) + frameCount) % frameCount;
}

/** A zero-cost, in-memory blend between two existing photographs. */
export interface FrameBlend {
  from: number;
  to: number;
  /** 0 = entirely `from`, 1 = entirely `to`. */
  ratio: number;
}

/**
 * Derives a smooth interpolated view from continuous drag displacement.
 * Only the seller's real photographs are displayed; the blend is computed in
 * the browser, never stored, and must be labelled as interpolated.
 */
export function blendFromDrag(
  current: number,
  deltaX: number,
  frameCount: number,
  wrap: boolean,
): FrameBlend {
  if (frameCount < 2 || !Number.isFinite(deltaX)) {
    const only = clampFrame(current, frameCount);
    return { from: only, to: only, ratio: 0 };
  }
  const position = -deltaX / DRAG_PIXELS_PER_FRAME;
  const whole = Math.trunc(position);
  const fraction = Math.abs(position - whole);
  const from = wrap
    ? wrapFrameIndex(current + whole, frameCount)
    : clampFrame(current + whole, frameCount);
  const direction = position >= 0 ? 1 : -1;
  const target = from + direction;
  const to = wrap ? wrapFrameIndex(target, frameCount) : clampFrame(target, frameCount);
  if (to === from) return { from, to, ratio: 0 };
  return { from, to, ratio: Math.min(fraction, 1) };
}

/**
 * Maps drag displacement to a frame. Dragging left (negative delta) advances to
 * the next angle; dragging right steps back. Wrapping is enabled only for true
 * rotation tiers so a limited-angle set never jumps from last to first.
 */
export function frameFromDrag(
  current: number,
  deltaX: number,
  frameCount: number,
  wrap: boolean,
): number {
  if (frameCount <= 1 || !Number.isFinite(deltaX)) return clampFrame(current, frameCount);
  const steps = Math.trunc(deltaX / DRAG_PIXELS_PER_FRAME);
  if (steps === 0) return clampFrame(current, frameCount);
  const target = current - steps;
  if (!wrap) return clampFrame(target, frameCount);
  return ((target % frameCount) + frameCount) % frameCount;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.25;

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return MIN_ZOOM;
  return Math.min(Math.max(Math.round(zoom / ZOOM_STEP) * ZOOM_STEP, MIN_ZOOM), MAX_ZOOM);
}

/** Keeps a zoomed image within a sensible pan range around the stage centre. */
export function clampPanOffset(offset: number, zoom: number): number {
  if (!Number.isFinite(offset)) return 0;
  const limit = Math.max(0, (zoom - MIN_ZOOM) * 240);
  return Math.min(Math.max(offset, -limit), limit);
}

/** Neighbouring frames to warm up, with wrap for rotational tiers. */
export function preloadFrames(current: number, frameCount: number, radius: number, wrap: boolean): number[] {
  if (frameCount <= 0) return [];
  const frames = new Set<number>();
  for (let offset = -radius; offset <= radius; offset += 1) {
    if (offset === 0) continue;
    const index = wrap ? wrapFrameIndex(current + offset, frameCount) : current + offset;
    if (index === current) continue;
    if (!wrap && (index < 0 || index >= frameCount)) continue;
    frames.add(index);
  }
  return [...frames];
}
