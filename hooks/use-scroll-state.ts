"use client";

import * as React from "react";

export type ScrollDirection = "up" | "down" | "none";

export interface ScrollState {
  scrollY: number;
  direction: ScrollDirection;
  isAtTop: boolean;
  hasScrolledPast: boolean;
}

const DIRECTION_THRESHOLD_PX = 18;
const DEFAULT_SCROLL_THRESHOLD_PX = 320;

/**
 * Passive, rAF-throttled scroll tracking. Direction only flips after a deliberate
 * movement so sub-pixel jitter and momentum bounces do not retrigger UI changes.
 */
export function useScrollState(scrollThreshold = DEFAULT_SCROLL_THRESHOLD_PX): ScrollState {
  const [state, setState] = React.useState<ScrollState>(() => ({
    scrollY: 0,
    direction: "none",
    isAtTop: true,
    hasScrolledPast: false,
  }));

  React.useEffect(() => {
    let frame: number | null = null;
    let lastY = window.scrollY;
    let direction: ScrollDirection = "none";

    const read = () => {
      frame = null;
      const scrollY = Math.max(0, window.scrollY);
      const delta = scrollY - lastY;

      if (Math.abs(delta) >= DIRECTION_THRESHOLD_PX) {
        direction = delta > 0 ? "down" : "up";
        lastY = scrollY;
      } else if (scrollY <= DIRECTION_THRESHOLD_PX) {
        direction = "none";
        lastY = scrollY;
      }

      setState({
        scrollY,
        direction,
        isAtTop: scrollY <= DIRECTION_THRESHOLD_PX,
        hasScrolledPast: scrollY > scrollThreshold,
      });
    };

    const onScroll = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [scrollThreshold]);

  return state;
}
