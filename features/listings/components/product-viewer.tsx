"use client";

import * as React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
  blendFromDrag,
  clampFrame,
  clampPanOffset,
  clampZoom,
  frameFromDrag,
  getViewerTier,
  preloadFrames,
  wrapFrameIndex,
} from "@/lib/product-viewer";
import type { FrameBlend } from "@/lib/product-viewer";
import { isOptimizableImageUrl } from "@/lib/validation/image-url";
import type { ListingImageData, ListingModelData } from "@/types/marketplace";

const ModelViewer = dynamic(
  () => import("./model-viewer").then((module) => module.ModelViewer),
  {
    ssr: false,
    loading: () => <div className="bg-neutral-950 h-full w-full" aria-hidden="true" />,
  },
);

type ViewerSelection = "photos" | "rotation" | "3d";

interface Props {
  images: ListingImageData[];
  title: string;
  open: boolean;
  initialFrame?: number;
  /** Optional genuine seller model. No 3D tab or bundle is loaded without it. */
  model?: ListingModelData | null;
  onClose: () => void;
}

interface GestureState {
  startX: number;
  startY: number;
  startFrame: number;
  startZoom: number;
  startPanX: number;
  startPanY: number;
  pinchDistance: number;
}

/**
 * Interactive viewer built only from the seller's ordinary photographs.
 * Drag/swipe selects the next photograph, pinch or buttons zoom, and the
 * honest tier label never claims a genuine 360° capture without 24 frames.
 */
export function ProductViewer({
  images,
  title,
  open,
  initialFrame = 0,
  model,
  onClose,
}: Props) {
  const t = useTranslations("productViewer");
  const count = images.length;
  const tier = React.useMemo(() => getViewerTier(count), [count]);
  const wrap = tier.mode === "rotation" || tier.mode === "full-360";
  const rotationAvailable = tier.autoRotate && count > 1;
  const modelAvailable = Boolean(model);
  const availableModes: ViewerSelection[] = [
    "photos",
    ...(rotationAvailable ? (["rotation"] as const) : []),
    ...(modelAvailable ? (["3d"] as const) : []),
  ];

  const [selection, setSelection] = React.useState<ViewerSelection>("photos");
  const isPhotoMode = selection !== "3d";
  const [frame, setFrame] = React.useState(() => clampFrame(initialFrame, count));
  const [zoom, setZoom] = React.useState(MIN_ZOOM);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [autoRotate, setAutoRotate] = React.useState(false);
  const [blending, setBlending] = React.useState(false);
  const [blend, setBlend] = React.useState<FrameBlend | null>(null);

  const overlayRef = React.useRef<HTMLDivElement>(null);
  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const gesture = React.useRef<GestureState | null>(null);

  const close = React.useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.().catch(() => undefined);
    }
    onClose();
  }, [onClose]);

  const step = React.useCallback(
    (direction: -1 | 1) => {
      if (!isPhotoMode || count < 2) return;
      setAutoRotate(false);
      setBlend(null);
      setFrame((previous) =>
        wrap ? wrapFrameIndex(previous + direction, count) : clampFrame(previous + direction, count),
      );
    },
    [count, isPhotoMode, wrap],
  );

  React.useEffect(() => {
    if (!open || !isPhotoMode || count === 0) return;
    const warmed: HTMLImageElement[] = [];
    for (const index of preloadFrames(frame, count, 2, wrap)) {
      const url = images[index]?.url;
      if (!url) continue;
      const image = new window.Image();
      image.src = url;
      warmed.push(image);
    }
    return () => {
      warmed.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [open, isPhotoMode, frame, count, wrap, images]);

  React.useEffect(() => {
    if (!open || !isPhotoMode || !autoRotate || !tier.autoRotate || count < 2) return;
    const timer = window.setInterval(() => {
      setBlend(null);
      setFrame((previous) =>
        wrap ? wrapFrameIndex(previous + 1, count) : clampFrame(previous + 1, count),
      );
    }, 1100);
    return () => window.clearInterval(timer);
  }, [open, isPhotoMode, autoRotate, tier.autoRotate, count, wrap]);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowLeft") {
        step(-1);
      } else if (event.key === "ArrowRight") {
        step(1);
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close, step]);

  const visibleFrames = React.useMemo(() => {
    const nearby = new Set<number>([frame, ...preloadFrames(frame, count, 1, wrap)]);
    return images
      .map((image, index) => ({ image, index }))
      .filter(({ index }) => nearby.has(index));
  }, [frame, count, wrap, images]);

  const hasGeneratedViews = images.some((image) => image.isGenerated);

  function changeZoom(delta: number) {
    setAutoRotate(false);
    const next = clampZoom(zoom + delta);
    setZoom(next);
    if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
  }

  function resetView() {
    setZoom(MIN_ZOOM);
    setPan({ x: 0, y: 0 });
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
      } else if (overlayRef.current?.requestFullscreen) {
        await overlayRef.current.requestFullscreen();
      }
    } catch {
      // Native fullscreen can be blocked; the overlay already fills the viewport.
    }
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    setAutoRotate(false);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    const base: GestureState = {
      startX: event.clientX,
      startY: event.clientY,
      startFrame: frame,
      startZoom: zoom,
      startPanX: pan.x,
      startPanY: pan.y,
      pinchDistance: 0,
    };
    if (points.length === 2) {
      base.pinchDistance = Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y);
    }
    gesture.current = base;
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const current = gesture.current;
    if (!current) return;

    const points = [...pointers.current.values()];
    if (points.length >= 2) {
      if (current.pinchDistance > 0) {
        const distance = Math.hypot(points[0]!.x - points[1]!.x, points[0]!.y - points[1]!.y);
        setZoom(clampZoom(current.startZoom * (distance / current.pinchDistance)));
      }
      return;
    }

    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    if (tier.rotates && count > 1 && Math.abs(deltaX) > Math.abs(deltaY)) {
      setFrame(frameFromDrag(current.startFrame, deltaX, count, wrap));
      if (blending) {
        const next = blendFromDrag(current.startFrame, deltaX, count, wrap);
        setBlend(next.ratio > 0 && next.from !== next.to ? next : null);
      }
      return;
    }
    if (zoom > 1) {
      setPan({
        x: clampPanOffset(current.startPanX + deltaX, zoom),
        y: clampPanOffset(current.startPanY + deltaY, zoom),
      });
    }
  }

  function onPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    pointers.current.delete(event.pointerId);
    const remaining = [...pointers.current.values()];
    if (remaining.length === 1) {
      const point = remaining[0]!;
      gesture.current = {
        startX: point.x,
        startY: point.y,
        startFrame: frame,
        startZoom: zoom,
        startPanX: pan.x,
        startPanY: pan.y,
        pinchDistance: 0,
      };
      return;
    }
    gesture.current = null;
    setDragging(false);
    setBlend(null);
  }

  if (!open || count === 0) return null;

  const currentImage = images[frame];
  const blendActive = blending && blend !== null && blend.ratio > 0;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      data-product-viewer-tier={tier.mode}
      data-product-viewer-mode={selection}
      data-product-viewer-modes={availableModes.join(",")}
      data-product-viewer-count={count}
      data-product-viewer-frame={frame}
      data-product-viewer-zoom={zoom}
      data-product-viewer-blending={blending ? "true" : "false"}
      data-product-viewer-blend={blendActive ? "true" : undefined}
      data-zoom={zoom}
      className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-white/60">
            {isPhotoMode
              ? `${t(tier.labelKey)} · ${t("frame", { current: frame + 1, total: count })}`
              : model?.sourceType === "GENERATED"
                ? t("modelGeneratedLabel")
                : t("mode3d")}
          </p>
          {!isPhotoMode && model?.sourceType === "GENERATED" ? (
            <p className="mt-0.5 text-[11px] text-white/50" data-product-viewer-generated>
              {t("modelGeneratedNotice")}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isPhotoMode && tier.autoRotate && count > 1 ? (
            <button
              type="button"
              aria-label={autoRotate ? t("stopAutoRotate") : t("autoRotate")}
              onClick={() => setAutoRotate((previous) => !previous)}
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
            >
              {autoRotate ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>
          ) : null}
          {isPhotoMode && count > 1 ? (
            <button
              type="button"
              aria-label={blending ? t("blendOff") : t("blendOn")}
              aria-pressed={blending}
              onClick={() => {
                setBlending((previous) => !previous);
                setBlend(null);
              }}
              className={cn(
                "grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10",
                blending && "bg-white/15",
              )}
            >
              <Layers className="size-4" />
            </button>
          ) : null}
          {isPhotoMode ? (
            <button
              type="button"
              aria-label={t("fullscreen")}
              onClick={() => void toggleFullscreen()}
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
            >
              <Maximize2 className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label={t("close")}
            onClick={close}
            className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
          >
            <X className="size-5" />
          </button>
        </div>
      </header>

      {availableModes.length > 1 ? (
        <nav
          aria-label={t("title")}
          data-product-viewer-mode-tabs
          className="flex shrink-0 gap-1 border-b border-white/10 px-3 py-2 sm:px-5"
        >
          {availableModes.map((available) => (
            <button
              key={available}
              type="button"
              data-viewer-mode={available}
              aria-pressed={selection === available}
              onClick={() => {
                if (available === "rotation") {
                  setSelection("rotation");
                  setAutoRotate(true);
                  setBlend(null);
                } else if (available === "3d") {
                  setSelection("3d");
                  setAutoRotate(false);
                } else {
                  setSelection("photos");
                  setAutoRotate(false);
                }
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                selection === available
                  ? "bg-white text-neutral-950"
                  : "bg-white/10 text-white/80 hover:bg-white/20",
              )}
            >
              {available === "photos"
                ? t("modePhotos")
                : available === "rotation"
                  ? t(tier.labelKey)
                  : t("mode3d")}
            </button>
          ))}
        </nav>
      ) : null}

      {!isPhotoMode && model ? (
        <div className="min-h-0 flex-1" data-product-viewer-3d>
          <ModelViewer model={model} title={title} />
        </div>
      ) : (
        <>
          <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
        <div
          data-product-viewer-stage
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className={cn(
            "absolute inset-0 touch-pan-y select-none",
            dragging ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transition: dragging ? "none" : "transform 180ms ease-out",
            }}
          >
            {visibleFrames.map(({ image, index }) => {
              let opacity = index === frame ? 1 : 0;
              if (blendActive && blend) {
                if (index === blend.from) opacity = 1 - blend.ratio;
                else if (index === blend.to) opacity = blend.ratio;
                else opacity = 0;
              }
              const labelled =
                index === frame ||
                (blendActive && (index === blend?.from || index === blend?.to));
              return (
                <div
                  key={`${image.url}-${index}`}
                  className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                  style={{ opacity, transition: blendActive ? "none" : undefined }}
                >
                  <Image
                    src={image.url}
                    alt={labelled ? `${title} — ${t("frame", { current: index + 1, total: count })}` : ""}
                    fill
                    priority={index === 0 && index === frame}
                    loading={index === frame && index !== 0 ? "eager" : undefined}
                    unoptimized={!isOptimizableImageUrl(image.url)}
                    sizes="100vw"
                    className="object-contain"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <p className="pointer-events-none absolute start-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs text-white/80">
          {t("dragHint")}
        </p>

        {currentImage?.isGenerated ? (
          <span
            data-generated-badge
            className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-sky-500/90 px-2.5 py-1 text-xs font-medium"
          >
            {t("generatedView")}
          </span>
        ) : null}

        {blendActive ? (
          <span
            data-blend-badge
            className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full bg-sky-500/90 px-2.5 py-1 text-xs font-medium"
          >
            {t("blendedView")}
          </span>
        ) : null}

        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label={t("previous")}
              onClick={() => step(-1)}
              className="absolute start-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 transition-colors hover:bg-black/80"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label={t("next")}
              onClick={() => step(1)}
              className="absolute end-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 transition-colors hover:bg-black/80"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        ) : null}

        <span className="pointer-events-none absolute bottom-3 end-3 rounded-full bg-black/60 px-2 py-0.5 text-xs tabular-nums">
          {t("frame", { current: frame + 1, total: count })}
        </span>
        {hasGeneratedViews ? (
          <span className="pointer-events-none absolute bottom-3 start-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white/80">
            {t("generatedNotice")}
          </span>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-neutral-950 px-3 py-2 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t("zoomOut")}
              onClick={() => changeZoom(-ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              <ZoomOut className="size-4" />
            </button>
            <span className="w-12 text-center text-xs tabular-nums text-white/80">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              aria-label={t("zoomIn")}
              onClick={() => changeZoom(ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              aria-label={t("resetZoom")}
              onClick={resetView}
              className="grid size-9 place-items-center rounded-full transition-colors hover:bg-white/10"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-center">
            {blending ? <p className="text-xs text-sky-200">{t("blendNotice")}</p> : null}
            {tier.mode === "multi-angle" ? (
              <p className="text-xs text-white/60">{t("limitedAngles", { count })}</p>
            ) : null}
          </div>
        </div>

        {count > 1 ? (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((image, index) => (
              <button
                key={`${image.url}-thumb-${index}`}
                type="button"
                onClick={() => {
                  setAutoRotate(false);
                  setBlend(null);
                  setFrame(index);
                }}
                aria-label={t("frame", { current: index + 1, total: count })}
                aria-current={index === frame ? "true" : undefined}
                className={cn(
                  "relative size-12 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                  index === frame ? "border-white" : "border-white/20",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  loading="lazy"
                  unoptimized={!isOptimizableImageUrl(image.url)}
                  sizes="48px"
                  className="object-cover"
                />
                {image.isGenerated ? (
                  <span className="absolute bottom-0 end-0 bg-sky-500 px-1 text-[9px] font-semibold">
                    AI
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        </footer>
        </>
      )}
    </div>
  );
}
