/** Pure geometry helpers for the mobile image sliders. Desktop never uses these. */

export const MOBILE_CAROUSEL_IMAGE_LIMIT = 4;

/** Keeps a slide index inside the available range, including empty image sets. */
export function clampCarouselIndex(index: number, count: number): number {
  if (!Number.isFinite(index) || count <= 0) return 0;
  return Math.min(Math.max(Math.round(index), 0), count - 1);
}

/** Maps a horizontal scroll offset to the nearest snapped slide. */
export function carouselIndexFromScroll(
  scrollLeft: number,
  itemWidth: number,
  count: number,
): number {
  if (count <= 0 || itemWidth <= 0 || !Number.isFinite(scrollLeft)) return 0;
  return clampCarouselIndex(Math.round(scrollLeft / itemWidth), count);
}

/** Scroll offset that places a slide flush with the carousel viewport. */
export function carouselScrollLeft(index: number, itemWidth: number, count: number): number {
  if (itemWidth <= 0 || !Number.isFinite(itemWidth)) return 0;
  return clampCarouselIndex(index, count) * itemWidth;
}
