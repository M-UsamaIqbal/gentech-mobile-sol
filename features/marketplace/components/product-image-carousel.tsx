"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMobileCarousel } from "@/hooks/use-mobile-carousel";

const ROTATION_INTERVAL_MS = 1200;

interface Props {
  images: string[];
  title: string;
  fallback?: React.ReactNode;
  className?: string;
  imageClassName?: string;
  showControls?: boolean;
}

function isReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

/**
 * Shared card media surface. Mobile keeps native scroll-snap swiping; desktop
 * cross-fades between the same photographs and rotates only while hovered.
 * Every card owns its own timer, so several cards can rotate independently.
 */
export function ProductImageCarousel({
  images,
  title,
  fallback,
  className,
  imageClassName,
  showControls = true,
}: Props) {
  const t = useTranslations("productViewer");
  const { active, scrollerRef, onScroll, goTo } = useMobileCarousel(images.length);
  const [hovered, setHovered] = React.useState(false);
  const [inView, setInView] = React.useState(true);
  const [pageVisible, setPageVisible] = React.useState(true);
  const [reduceMotion, setReduceMotion] = React.useState(isReducedMotion);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const count = images.length;

  React.useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);

  React.useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? true),
      { threshold: 0.05 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const onVisibilityChange = () => setPageVisible(document.visibilityState === "visible");
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const shouldRotate = hovered && inView && pageVisible && !reduceMotion && count > 1;

  React.useEffect(() => {
    if (!shouldRotate) return;
    const timer = window.setInterval(() => {
      goTo((previous) => (previous + 1) % count);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [shouldRotate, count, goTo]);

  const step = React.useCallback(
    (direction: -1 | 1) => {
      goTo((previous) => (previous + direction + count) % count);
    },
    [count, goTo],
  );

  if (count === 0) {
    return (
      <div
        ref={rootRef}
        data-product-image-carousel="0"
        className={cn("bg-muted relative aspect-4/3 w-full overflow-hidden", className)}
      >
        {fallback}
      </div>
    );
  }

  const nextIndex = (active + 1) % count;

  return (
    <div
      ref={rootRef}
      data-product-image-carousel={count}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        goTo(0);
      }}
      className={cn("bg-muted relative aspect-4/3 w-full overflow-hidden", className)}
    >
      {/* Mobile: native touch swiping, preserved for the existing carousel contract. */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        data-mobile-card-carousel={count}
        className="scroll-smooth flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] md:snap-none md:overflow-hidden [&::-webkit-scrollbar]:hidden"
      >
        {images.map((url, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${url}-${index}`}
            src={url}
            alt={title}
            loading={index === 0 ? "eager" : "lazy"}
            className={cn(
              "h-full w-full shrink-0 snap-center object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105",
              imageClassName,
              index > 0 && "md:hidden",
            )}
          />
        ))}
      </div>

      {/* Desktop: the same photographs cross-fade while the pointer is over the card. */}
      <div
        data-desktop-card-carousel={count}
        className="absolute inset-0 hidden md:block"
        aria-roledescription="carousel"
      >
        {images.map((url, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`desktop-${url}-${index}`}
            src={url}
            alt={index === active ? title : ""}
            aria-hidden={index !== active}
            loading={index === active || index === nextIndex ? "eager" : "lazy"}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105",
              imageClassName,
              index === active ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>

      {showControls && count > 1 ? (
        <>
          <button
            type="button"
            aria-label={t("previousPhoto")}
            data-card-carousel-previous
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              step(-1);
            }}
            className="absolute start-1.5 top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/75 focus-visible:opacity-100 group-hover:opacity-100 md:grid"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={t("nextPhoto")}
            data-card-carousel-next
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              step(1);
            }}
            className="absolute end-1.5 top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity hover:bg-black/75 focus-visible:opacity-100 group-hover:opacity-100 md:grid"
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="absolute bottom-2 start-2 z-10 hidden items-center gap-1.5 md:flex">
            {images.map((_, index) => (
              <button
                key={`desktop-dot-${index}`}
                type="button"
                aria-label={`Show image ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  goTo(index);
                }}
                className={cn(
                  "h-1.5 rounded-full bg-white/70 shadow transition-all",
                  index === active ? "w-4 bg-white" : "w-1.5",
                )}
              />
            ))}
          </div>
          <span
            data-card-counter
            className="absolute bottom-2 end-2 z-10 hidden rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white md:block"
          >
            {active + 1}/{count}
          </span>

          <div className="absolute bottom-2 start-2 z-10 flex items-center gap-1.5 md:hidden">
            {images.map((_, index) => (
              <button
                key={`mobile-dot-${index}`}
                type="button"
                aria-label={`View image ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  goTo(index);
                }}
                className={cn(
                  "h-1.5 rounded-full bg-white/70 shadow transition-all",
                  index === active ? "w-4 bg-white" : "w-1.5",
                )}
              />
            ))}
          </div>
          <span
            data-mobile-card-counter
            className="absolute bottom-2 end-2 z-10 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white md:hidden"
          >
            {active + 1}/{count}
          </span>
        </>
      ) : null}
    </div>
  );
}
