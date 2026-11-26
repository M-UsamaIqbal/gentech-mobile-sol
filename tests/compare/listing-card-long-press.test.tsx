import { act, fireEvent, render, screen } from "@testing-library/react";
import type * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const translate = (key: string, values?: Record<string, string | number>) =>
      key === "selected" ? `Selected ${values?.count} of ${values?.max}` : key;
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

vi.mock("@/components/ui/input", () => ({
  Input: (props: React.ComponentProps<"input">) => <input {...props} />,
}));

vi.mock("@/features/marketplace/components/favorite-button", () => ({
  FavoriteButton: () => <button type="button">favorite</button>,
}));

import { CompareControls } from "@/features/compare/components/compare-controls";
import { CompareSelectionProvider } from "@/features/compare/components/compare-selection-provider";
import { ListingCard } from "@/features/marketplace/components/listing-card";
import type { ListingCardData } from "@/types/marketplace";

const listing: ListingCardData = {
  id: "long-press-1",
  title: "Apple iPhone 13",
  slug: "apple-iphone-13",
  price: 180000,
  currency: "PKR",
  condition: "USED",
  city: "Karachi",
  createdAt: new Date().toISOString(),
};

function renderCard() {
  return render(
    <CompareSelectionProvider>
      <CompareControls />
      <ListingCard listing={listing} isAuthenticated={false} />
    </CompareSelectionProvider>,
  );
}

function cardElement(): HTMLElement {
  const heading = screen.getByText(listing.title);
  const card = heading.closest("article");
  if (!card) throw new Error("Card article not found");
  return card;
}

describe("listing card long press", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("enables compare mode and selects the card on a touch long press", () => {
    renderCard();

    fireEvent.pointerDown(cardElement(), {
      pointerType: "touch",
      clientX: 20,
      clientY: 20,
      bubbles: true,
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("Selected 1 of 4")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "open" })).not.toBeInTheDocument();
  });

  it("does not select when the touch moves before the long press completes", () => {
    renderCard();
    const card = cardElement();

    fireEvent.pointerDown(card, {
      pointerType: "touch",
      clientX: 20,
      clientY: 20,
      bubbles: true,
    });
    fireEvent.pointerMove(card, {
      pointerType: "touch",
      clientX: 80,
      clientY: 20,
      bubbles: true,
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByRole("button", { name: "open" })).toBeInTheDocument();
    expect(screen.queryByText("Selected 1 of 4")).not.toBeInTheDocument();
  });
});
