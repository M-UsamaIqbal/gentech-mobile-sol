import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock("@/features/listings/components/model-viewer", () => ({
  ModelViewer: ({ title }: { title: string }) => (
    <div data-model-viewer-stub data-title={title}>
      3D viewer
    </div>
  ),
}));

import { ProductViewer } from "@/features/listings/components/product-viewer";
import type { ListingImageData, ListingModelData } from "@/types/marketplace";

function makeFrames(count: number): ListingImageData[] {
  return Array.from({ length: count }, (_, index) => ({
    url: `https://cdn.example.com/phone/${index}.jpg`,
  }));
}

const model: ListingModelData = {
  url: "https://res.cloudinary.com/demo/raw/upload/v1/models/u1/phone.glb",
  publicId: "models/u1/phone.glb",
  format: "GLB",
  sizeBytes: 1024,
  assets: [],
};

function required(selector: string): HTMLElement {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element as HTMLElement;
}

function renderViewer(frames: number, viewerModel?: ListingModelData) {
  return render(
    <ProductViewer
      images={makeFrames(frames)}
      title="Test phone"
      open
      model={viewerModel}
      onClose={vi.fn()}
    />,
  );
}

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "requestFullscreen");
  Reflect.deleteProperty(document, "exitFullscreen");
});

describe("product viewer modes", () => {
  it("exposes only the photo mode when there is no rotation sequence or model", () => {
    renderViewer(3);
    expect(required("[data-product-viewer-modes]").dataset.productViewerModes).toBe("photos");
    expect(document.querySelector("[data-product-viewer-mode-tabs]")).toBeNull();
  });

  it("offers honest rotation at 12 photos without claiming a genuine 360 capture", () => {
    renderViewer(12);
    expect(required("[data-product-viewer-modes]").dataset.productViewerModes).toBe(
      "photos,rotation",
    );
    expect(screen.getByRole("button", { name: "rotation" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "full360" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "rotation" }));
    expect(required("[data-product-viewer-mode]").dataset.productViewerMode).toBe("rotation");
    expect(screen.getByRole("button", { name: "stopAutoRotate" })).toBeTruthy();
  });

  it("labels the 24-photo tier as 360°", () => {
    renderViewer(24);
    expect(screen.getByRole("button", { name: "full360" })).toBeTruthy();
    expect(required("[data-product-viewer-tier]").dataset.productViewerTier).toBe("full-360");
  });

  it("offers the 3D mode only when a genuine seller model exists", async () => {
    renderViewer(3, model);
    expect(required("[data-product-viewer-modes]").dataset.productViewerModes).toBe(
      "photos,3d",
    );

    fireEvent.click(screen.getByRole("button", { name: "mode3d" }));

    await waitFor(() => expect(document.querySelector("[data-model-viewer-stub]")).not.toBeNull());
    expect(required("[data-product-viewer-mode]").dataset.productViewerMode).toBe("3d");
    expect(document.querySelector("[data-product-viewer-stage]")).toBeNull();
    expect(required("[data-model-viewer-stub]").dataset.title).toBe("Test phone");
  });

  it("labels a generated model as an AI approximation", async () => {
    renderViewer(3, { ...model, sourceType: "GENERATED" });
    fireEvent.click(screen.getByRole("button", { name: "mode3d" }));

    await waitFor(() => expect(document.querySelector("[data-product-viewer-3d]")).not.toBeNull());
    expect(screen.getByText("modelGeneratedLabel")).toBeTruthy();
    expect(document.querySelector("[data-product-viewer-generated]")).not.toBeNull();
    expect(screen.getByText("modelGeneratedNotice")).toBeTruthy();
  });

  it("offers photo, rotation and 3D modes together when all are available", () => {
    renderViewer(36, model);
    expect(required("[data-product-viewer-modes]").dataset.productViewerModes).toBe(
      "photos,rotation,3d",
    );
  });

  it("supports native fullscreen from the photo viewer", async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      writable: true,
      value: requestFullscreen,
    });

    renderViewer(2);
    fireEvent.click(screen.getByRole("button", { name: "fullscreen" }));
    await waitFor(() => expect(requestFullscreen).toHaveBeenCalled());
  });
});
