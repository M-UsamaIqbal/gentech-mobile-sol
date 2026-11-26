import { fireEvent, render, screen, within } from "@testing-library/react";
import type * as React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const translate = (key: string) => key;
    translate.has = () => false;
    return translate;
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/pk/en/marketplace",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/localized-link", () => ({
  LocalizedLink: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("@/features/marketplace/components/favorite-button", () => ({
  FavoriteButton: () => <button type="button">favorite</button>,
}));

import { CompareSelectionProvider } from "@/features/compare/components/compare-selection-provider";
import { ListingGallery } from "@/features/listings/components/listing-gallery";
import { ListingCard } from "@/features/marketplace/components/listing-card";
import type { ListingCardData, ListingImageData } from "@/types/marketplace";

const imageUrls = [
  "https://example.com/phone-front.jpg",
  "https://example.com/phone-back.jpg",
  "https://example.com/phone-side.jpg",
];

const card: ListingCardData = {
  id: "slider-card",
  title: "iPhone 15 Pro",
  slug: "iphone-15-pro",
  price: 419999,
  currency: "PKR",
  condition: "USED",
  city: "Karachi",
  brand: "Apple",
  createdAt: new Date().toISOString(),
  imageUrl: imageUrls[0],
  imageUrls,
};

const galleryImages: ListingImageData[] = imageUrls.map((url) => ({ url }));

function setViewportWidth(element: HTMLElement, width: number) {
  Object.defineProperty(element, "clientWidth", { configurable: true, value: width });
}

function required(selector: string): HTMLElement {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element as HTMLElement;
}

function renderCard(listing: ListingCardData = card) {
  return render(
    <CompareSelectionProvider>
      <ListingCard listing={listing} isAuthenticated={false} />
    </CompareSelectionProvider>,
  );
}

describe("mobile listing card image slider", () => {
  it("renders each image in the swipe strip but keeps desktop on the primary image", () => {
    renderCard();

    const strip = required("[data-mobile-card-carousel='3']");
    const images = Array.from(strip.querySelectorAll("img"));
    expect(images).toHaveLength(3);
    expect(images[0]?.getAttribute("src")).toBe(imageUrls[0]);
    expect(images.slice(1).every((image) => image.className.includes("md:hidden"))).toBe(true);
    expect(required("[data-mobile-card-counter]").textContent).toBe("1/3");
  });

  it("moves the counter with a swipe", () => {
    renderCard();
    const strip = required("[data-mobile-card-carousel='3']");
    setViewportWidth(strip, 100);

    strip.scrollLeft = 200;
    fireEvent.scroll(strip);

    expect(required("[data-mobile-card-counter]").textContent).toBe("3/3");
  });

  it("jumps to a slide when its dot is tapped", () => {
    renderCard();
    const strip = required("[data-mobile-card-carousel='3']");
    setViewportWidth(strip, 100);

    fireEvent.click(screen.getByRole("button", { name: "View image 2" }));

    expect(strip.scrollLeft).toBe(100);
    expect(required("[data-mobile-card-counter]").textContent).toBe("2/3");
  });

  it("renders a plain image and no dots for a single-photo listing", () => {
    renderCard({ ...card, imageUrls: undefined });

    expect(required("[data-mobile-card-carousel='1']").querySelectorAll("img")).toHaveLength(1);
    expect(document.querySelector("[data-mobile-card-counter]")).toBeNull();
    expect(screen.queryByRole("button", { name: "View image 1" })).toBeNull();
  });

  it("keeps the branded placeholder when a listing has no images", () => {
    renderCard({ ...card, imageUrl: undefined, imageUrls: undefined });

    expect(document.querySelector("[data-mobile-card-carousel]")).toBeNull();
    expect(screen.getByText("Apple")).toBeTruthy();
  });
});

describe("mobile listing detail gallery", () => {
  it("shows a swipeable strip, dots and a slide counter", () => {
    render(<ListingGallery images={galleryImages} title="iPhone 15 Pro" brand="Apple" />);

    const strip = required("[data-mobile-gallery='3']");
    expect(strip.querySelectorAll("img")).toHaveLength(3);
    expect(required("[data-mobile-gallery-counter]").textContent).toBe("1 / 3");
  });

  it("syncs the counter with scrolling and dot taps", () => {
    render(<ListingGallery images={galleryImages} title="iPhone 15 Pro" brand="Apple" />);

    const strip = required("[data-mobile-gallery='3']");
    const counter = required("[data-mobile-gallery-counter]");
    setViewportWidth(strip, 100);

    strip.scrollLeft = 100;
    fireEvent.scroll(strip);
    expect(counter.textContent).toBe("2 / 3");

    const mobileFrame = counter.parentElement as HTMLElement;
    fireEvent.click(within(mobileFrame).getByRole("button", { name: "View image 3" }));
    expect(strip.scrollLeft).toBe(200);
    expect(counter.textContent).toBe("3 / 3");
  });

  it("opens the interactive viewer from the gallery trigger", () => {
    render(<ListingGallery images={galleryImages} title="iPhone 15 Pro" brand="Apple" />);

    fireEvent.click(required("[data-product-viewer-trigger]"));

    expect(required("[data-product-viewer-tier='switch']")).toBeTruthy();
  });

  it("omits mobile controls when the listing has a single photo", () => {
    render(<ListingGallery images={[galleryImages[0]!]} title="iPhone 15 Pro" />);

    expect(required("[data-mobile-gallery='1']").querySelectorAll("img")).toHaveLength(1);
    expect(document.querySelector("[data-mobile-gallery-counter]")).toBeNull();
  });
});
