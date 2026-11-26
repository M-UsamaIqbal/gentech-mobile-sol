import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ProductImageCarousel } from "@/features/marketplace/components/product-image-carousel";

const threePhotos = [
  "https://cdn.example.com/front.jpg",
  "https://cdn.example.com/back.jpg",
  "https://cdn.example.com/side.jpg",
];

function counters(): HTMLElement[] {
  return Array.from(document.querySelectorAll("[data-mobile-card-counter]"));
}

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    }),
  });
}

afterEach(() => {
  vi.useRealTimers();
  Reflect.deleteProperty(window, "matchMedia");
  Reflect.deleteProperty(window, "IntersectionObserver");
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

describe("product card image carousel", () => {
  it("rotates each hovered card independently and resets it on leave", () => {
    vi.useFakeTimers();
    const { container } = render(
      <div>
        <ProductImageCarousel images={threePhotos} title="First phone" />
        <ProductImageCarousel
          images={[...threePhotos, "https://cdn.example.com/bottom.jpg"]}
          title="Second phone"
        />
      </div>,
    );

    const cards = Array.from(container.querySelectorAll("[data-product-image-carousel]"));
    expect(cards).toHaveLength(2);
    fireEvent.mouseEnter(cards[0]!);
    fireEvent.mouseEnter(cards[1]!);

    act(() => vi.advanceTimersByTime(1200));
    expect(counters().map((counter) => counter.textContent)).toEqual(["2/3", "2/4"]);

    fireEvent.mouseLeave(cards[0]!);
    expect(counters()[0]?.textContent).toBe("1/3");

    act(() => vi.advanceTimersByTime(1200));
    expect(counters().map((counter) => counter.textContent)).toEqual(["1/3", "3/4"]);
  });

  it("resets to the first photo after a manual selection when the pointer leaves", () => {
    vi.useFakeTimers();
    const { container } = render(<ProductImageCarousel images={threePhotos} title="Phone" />);
    const card = container.querySelector("[data-product-image-carousel]") as HTMLElement;
    fireEvent.mouseEnter(card);
    fireEvent.click(screen.getByRole("button", { name: "Show image 3" }));
    expect(counters()[0]?.textContent).toBe("3/3");

    fireEvent.mouseLeave(card);
    expect(counters()[0]?.textContent).toBe("1/3");
  });

  it("does not auto-rotate when the user prefers reduced motion", () => {
    vi.useFakeTimers();
    setMatchMedia(true);
    const { container } = render(<ProductImageCarousel images={threePhotos} title="Phone" />);
    fireEvent.mouseEnter(container.querySelector("[data-product-image-carousel]") as HTMLElement);

    act(() => vi.advanceTimersByTime(3600));
    expect(counters()[0]?.textContent).toBe("1/3");
  });

  it("pauses when the card scrolls out of view", () => {
    vi.useFakeTimers();
    let notify: ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null;
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: class {
        constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    });

    const { container } = render(<ProductImageCarousel images={threePhotos} title="Phone" />);
    fireEvent.mouseEnter(container.querySelector("[data-product-image-carousel]") as HTMLElement);
    act(() => notify?.([{ isIntersecting: false }]));

    act(() => vi.advanceTimersByTime(3600));
    expect(counters()[0]?.textContent).toBe("1/3");
    Reflect.deleteProperty(window, "IntersectionObserver");
  });

  it("pauses when the browser tab is inactive", () => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    const { container } = render(<ProductImageCarousel images={threePhotos} title="Phone" />);
    fireEvent.mouseEnter(container.querySelector("[data-product-image-carousel]") as HTMLElement);

    act(() => vi.advanceTimersByTime(3600));
    expect(counters()[0]?.textContent).toBe("1/3");
  });

  it("keeps arrow and dot clicks from navigating the card", () => {
    vi.useFakeTimers();
    const onNavigate = vi.fn();
    const { container } = render(
      <div onClick={onNavigate}>
        <ProductImageCarousel images={threePhotos} title="Phone" />
      </div>,
    );

    fireEvent.click(container.querySelector("[data-card-carousel-next]") as HTMLElement);
    expect(counters()[0]?.textContent).toBe("2/3");

    fireEvent.click(screen.getByRole("button", { name: "View image 3" }));
    expect(counters()[0]?.textContent).toBe("3/3");
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("preloads the next photo and lazy-loads distant photos", () => {
    render(<ProductImageCarousel images={threePhotos} title="Phone" />);
    const mobile = document.querySelector("[data-mobile-card-carousel]") as HTMLElement;
    const images = Array.from(mobile.querySelectorAll("img"));
    expect(images.map((image) => image.getAttribute("loading"))).toEqual([
      "eager",
      "lazy",
      "lazy",
    ]);

    const desktop = document.querySelector("[data-desktop-card-carousel]") as HTMLElement;
    const desktopImages = Array.from(desktop.querySelectorAll("img"));
    expect(desktopImages[0]?.getAttribute("loading")).toBe("eager");
    expect(desktopImages[1]?.getAttribute("loading")).toBe("eager");
    expect(desktopImages[2]?.getAttribute("loading")).toBe("lazy");
  });

  it("renders no controls for a single photo", () => {
    render(<ProductImageCarousel images={[threePhotos[0]!]} title="Phone" />);
    expect(document.querySelector("[data-card-carousel-next]")).toBeNull();
    expect(document.querySelector("[data-mobile-card-counter]")).toBeNull();
  });
});
