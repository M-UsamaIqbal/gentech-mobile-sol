import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const translate = (key: string) => key;
    translate.has = () => false;
    return translate;
  },
}));

import { ProductViewer } from "@/features/listings/components/product-viewer";
import type { ListingImageData } from "@/types/marketplace";

function makeFrames(count: number, generatedIndex?: number): ListingImageData[] {
  return Array.from({ length: count }, (_, index) => ({
    url: `https://cdn.example.com/phone/angle-${index}.jpg`,
    ...(generatedIndex === index ? { isGenerated: true } : {}),
  }));
}

function required(selector: string): HTMLElement {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element as HTMLElement;
}

function drag(stage: HTMLElement, fromX: number, toX: number) {
  fireEvent.pointerDown(stage, { pointerId: 1, pointerType: "mouse", button: 0, clientX: fromX });
  fireEvent.pointerMove(stage, { pointerId: 1, pointerType: "mouse", clientX: toX });
  fireEvent.pointerUp(stage, { pointerId: 1, pointerType: "mouse", clientX: toX });
}

function renderViewer(images: ListingImageData[], onClose = vi.fn()) {
  return { onClose, ...render(<ProductViewer images={images} title="Test phone" open onClose={onClose} />) };
}

describe("product viewer", () => {
  it("uses the honest photo tier for one image and still allows zoom and pan", () => {
    renderViewer(makeFrames(1));

    expect(required("[data-product-viewer-tier='photo']")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "previous" })).toBeNull();
    expect(screen.queryByRole("button", { name: "blendOn" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "zoomIn" }));
    expect(required("[data-product-viewer-zoom]").dataset.zoom).toBe("1.25");

    fireEvent.click(screen.getByRole("button", { name: "resetZoom" }));
    expect(required("[data-product-viewer-zoom]").dataset.zoom).toBe("1");
  });

  it("switches limited-angle photos by dragging without wrapping", () => {
    renderViewer(makeFrames(3));

    const stage = required("[data-product-viewer-stage]");
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    expect(required("[data-product-viewer-frame='1']")).toBeTruthy();

    drag(stage, 200, 170);
    expect(required("[data-product-viewer-frame='2']")).toBeTruthy();

    drag(stage, 200, 170);
    expect(required("[data-product-viewer-frame='2']")).toBeTruthy();
  });

  it("wraps frames and exposes auto rotation for the full 360 tier", () => {
    renderViewer(makeFrames(24));

    expect(required("[data-product-viewer-tier='full-360']")).toBeTruthy();
    const autoRotate = screen.getByRole("button", { name: "autoRotate" });
    fireEvent.click(autoRotate);
    expect(screen.getByRole("button", { name: "stopAutoRotate" })).toBeTruthy();

    drag(required("[data-product-viewer-stage]"), 200, 230);
    expect(required("[data-product-viewer-frame='23']")).toBeTruthy();
  });

  it("blends only real photos in-browser and clears the blend on release", () => {
    renderViewer(makeFrames(4));

    const overlay = required("[data-product-viewer-tier]");
    const stage = required("[data-product-viewer-stage]");
    expect(overlay.dataset.productViewerBlending).toBe("false");
    expect(screen.queryByRole("button", { name: "blendOn" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "blendOn" }));
    expect(required("[data-product-viewer-tier]").dataset.productViewerBlending).toBe("true");

    fireEvent.pointerDown(stage, { pointerId: 1, pointerType: "mouse", button: 0, clientX: 200 });
    fireEvent.pointerMove(stage, { pointerId: 1, pointerType: "mouse", clientX: 187 });
    expect(required("[data-product-viewer-tier]").dataset.productViewerBlend).toBe("true");
    expect(document.querySelector("[data-blend-badge]")).not.toBeNull();
    expect(required("[data-product-viewer-frame='0']")).toBeTruthy();

    fireEvent.pointerUp(stage, { pointerId: 1, pointerType: "mouse", clientX: 187 });
    expect(required("[data-product-viewer-tier]").dataset.productViewerBlend).toBeUndefined();
    expect(document.querySelector("[data-blend-badge]")).toBeNull();
  });

  it("labels AI-generated views separately from seller photographs", () => {
    renderViewer(makeFrames(4, 2));

    expect(document.querySelector("[data-generated-badge]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    fireEvent.click(screen.getByRole("button", { name: "next" }));
    expect(document.querySelector("[data-generated-badge]")).not.toBeNull();
  });

  it("closes on Escape", () => {
    const { onClose } = renderViewer(makeFrames(2));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
