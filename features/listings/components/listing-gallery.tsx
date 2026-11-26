"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, RotateCw, Smartphone, ZoomIn } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMobileCarousel } from "@/hooks/use-mobile-carousel";
import { isOptimizableImageUrl } from "@/lib/validation/image-url";
import { ProductViewer } from "@/features/listings/components/product-viewer";
import type { ListingImageData, ListingModelData } from "@/types/marketplace";

export function ListingGallery({
  images,
  title,
  brand,
  model3d,
}: {
  images: ListingImageData[];
  title: string;
  brand?: string;
  model3d?: ListingModelData | null;
}) {
  const { active, scrollerRef, onScroll, goTo } = useMobileCarousel(images.length);
  const t = useTranslations("productViewer");
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const count = images.length;

  const step = React.useCallback(
    (direction: -1 | 1) => {
      if (count < 2) return;
      goTo((previous) => (previous + direction + count) % count);
    },
    [count, goTo],
  );

  if (count === 0) {
    return (
      <div className="text-muted-foreground bg-muted flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-xl border">
        <Smartphone className="size-16" />
        {brand ? <span className="text-foreground/50 font-medium">{brand}</span> : null}
      </div>
    );
  }

  const current = images[active] ?? images[0]!;

  return (
    <div
      className="space-y-3"
      tabIndex={0}
      aria-roledescription="gallery"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          step(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          step(1);
        }
      }}
    >
      {/* Mobile: native swipe with snap points, mirrored dots and a counter. */}
      <div className="md:hidden">
        <div className="bg-muted relative aspect-4/3 w-full overflow-hidden rounded-xl border">
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            data-mobile-gallery={count}
            className="scroll-smooth flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className="relative h-full w-full shrink-0 snap-center"
              >
                <Image
                  src={image.url}
                  alt={title}
                  fill
                  priority={index === 0}
                  loading={index <= 1 ? "eager" : "lazy"}
                  unoptimized={!isOptimizableImageUrl(image.url)}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            data-product-viewer-trigger
            onClick={() => setViewerOpen(true)}
            aria-label={count > 1 ? t("openAngles") : t("openPhoto")}
            className="absolute end-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
          >
            {count > 1 ? <RotateCw className="size-3.5" /> : <ZoomIn className="size-3.5" />}
            {count > 1 ? t("explore") : t("zoom")}
          </button>

          {count > 1 ? (
            <>
              <div className="absolute bottom-2 start-2 z-10 flex items-center gap-1.5">
                {images.map((image, index) => (
                  <button
                    key={`${image.url}-dot`}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`View image ${index + 1}`}
                    aria-current={index === active ? "true" : undefined}
                    className={cn(
                      "h-1.5 rounded-full bg-white/70 shadow transition-all",
                      index === active ? "w-4 bg-white" : "w-1.5",
                    )}
                  />
                ))}
              </div>
              <span
                data-mobile-gallery-counter
                className="absolute bottom-2 end-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white"
              >
                {active + 1} / {count}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Desktop: arrows, dots, active thumbnail and the same Explore action. */}
      <div className="hidden space-y-3 md:block">
        <div className="bg-muted relative aspect-4/3 w-full overflow-hidden rounded-xl border">
          <Image
            key={current.url}
            src={current.url}
            alt={title}
            fill
            priority
            unoptimized={!isOptimizableImageUrl(current.url)}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />

          {count > 1 ? (
            <>
              <button
                type="button"
                aria-label={t("previousPhoto")}
                data-gallery-previous
                onClick={() => step(-1)}
                className="absolute start-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label={t("nextPhoto")}
                data-gallery-next
                onClick={() => step(1)}
                className="absolute end-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              >
                <ChevronRight className="size-5" />
              </button>
              <div className="absolute bottom-2 start-2 z-10 flex items-center gap-1.5">
                {images.map((image, index) => (
                  <button
                    key={`${image.url}-desktop-dot`}
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Show image ${index + 1}`}
                    aria-current={index === active ? "true" : undefined}
                    className={cn(
                      "h-1.5 rounded-full bg-white/70 shadow transition-all",
                      index === active ? "w-4 bg-white" : "w-1.5",
                    )}
                  />
                ))}
              </div>
              <span className="absolute bottom-2 end-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                {active + 1} / {count}
              </span>
            </>
          ) : null}

          <button
            type="button"
            data-product-viewer-trigger
            onClick={() => setViewerOpen(true)}
            aria-label={count > 1 || model3d ? t("openAngles") : t("openPhoto")}
            className="absolute end-2 top-2 z-10 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
          >
            {count > 1 || model3d ? <RotateCw className="size-3.5" /> : <ZoomIn className="size-3.5" />}
            {count > 1 || model3d ? t("explore") : t("zoom")}
          </button>
        </div>

        {count > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((image, index) => (
              <button
                key={`${image.url}-thumb`}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                  index === active ? "border-primary" : "border-transparent",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  unoptimized={!isOptimizableImageUrl(image.url)}
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {viewerOpen ? (
        <ProductViewer
          images={images}
          title={title}
          model={model3d}
          open
          initialFrame={active}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </div>
  );
}
