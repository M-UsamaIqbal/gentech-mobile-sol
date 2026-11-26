import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock("@/features/listings/components/model-viewer", () => ({
  ModelViewer: () => <div data-model-viewer-stub>3D viewer</div>,
}));

import { ListingGallery } from "@/features/listings/components/listing-gallery";
import type { ListingImageData, ListingModelData } from "@/types/marketplace";

const images: ListingImageData[] = [
  { url: "https://cdn.example.com/one.jpg" },
  { url: "https://cdn.example.com/two.jpg" },
  { url: "https://cdn.example.com/three.jpg" },
];

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

describe("listing gallery controls", () => {
  it("steps photos with desktop arrows and highlights the active thumbnail", () => {
    const { container } = render(<ListingGallery images={images} title="Phone" />);

    fireEvent.click(required("[data-gallery-next]"));
    expect(required("[data-mobile-gallery-counter]").textContent).toBe("2 / 3");
    expect(
      Array.from(container.querySelectorAll('button[aria-label="Show image 2"]')).every(
        (button) => button.getAttribute("aria-current") === "true",
      ),
    ).toBe(true);

    fireEvent.click(required("[data-gallery-previous]"));
    expect(required("[data-mobile-gallery-counter]").textContent).toBe("1 / 3");
  });

  it("supports keyboard navigation without opening the viewer", () => {
    const { container } = render(<ListingGallery images={images} title="Phone" />);

    fireEvent.keyDown(container.firstElementChild as HTMLElement, { key: "ArrowRight" });
    expect(required("[data-mobile-gallery-counter]").textContent).toBe("2 / 3");
    expect(document.querySelector("[data-product-viewer-tier]")).toBeNull();

    fireEvent.keyDown(container.firstElementChild as HTMLElement, { key: "ArrowLeft" });
    expect(required("[data-mobile-gallery-counter]").textContent).toBe("1 / 3");
  });

  it("opens the viewer with only the modes the listing actually has", () => {
    render(<ListingGallery images={images} title="Phone" model3d={model} />);

    fireEvent.click(screen.getAllByRole("button", { name: "openAngles" })[0]!);
    expect(required("[data-product-viewer-modes]").dataset.productViewerModes).toBe("photos,3d");
    expect(screen.getByRole("button", { name: "mode3d" })).toBeTruthy();
  });

  it("does not advertise 3D when the listing has no model", () => {
    render(<ListingGallery images={images} title="Phone" />);

    fireEvent.click(screen.getAllByRole("button", { name: "openAngles" })[0]!);
    expect(required("[data-product-viewer-modes]").dataset.productViewerModes).toBe("photos");
    expect(screen.queryByRole("button", { name: "mode3d" })).toBeNull();
  });
});
