"use client";

import * as React from "react";

import {
  carouselIndexFromScroll,
  carouselScrollLeft,
  clampCarouselIndex,
} from "@/lib/mobile-carousel";

type CarouselIndexUpdate = number | ((previous: number) => number);

/**
 * Tracks the active slide of a full-width, scroll-snap image strip.
 * Touch scrolling is handled natively by the browser; this only mirrors the
 * offset into an index so the dots, counters and desktop controls stay in sync.
 */
export function useMobileCarousel(count: number) {
  const [active, setActive] = React.useState(0);
  const activeRef = React.useRef(0);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  const boundedActive = clampCarouselIndex(active, count);

  const setIndex = React.useCallback(
    (target: number) => {
      const bounded = clampCarouselIndex(target, count);
      activeRef.current = bounded;
      setActive((previous) => (previous === bounded ? previous : bounded));
    },
    [count],
  );

  const onScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const element = event.currentTarget;
      const index = carouselIndexFromScroll(element.scrollLeft, element.clientWidth, count);
      setIndex(index);
    },
    [count, setIndex],
  );

  const goTo = React.useCallback(
    (index: CarouselIndexUpdate) => {
      const requested = typeof index === "function" ? index(activeRef.current) : index;
      const target = clampCarouselIndex(requested, count);
      activeRef.current = target;
      setActive((previous) => (previous === target ? previous : target));
      const element = scrollerRef.current;
      if (element) {
        element.scrollLeft = carouselScrollLeft(target, element.clientWidth, count);
      }
    },
    [count],
  );

  return { active: boundedActive, scrollerRef, onScroll, goTo, setIndex };
}
