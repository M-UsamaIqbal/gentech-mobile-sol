import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

vi.mock("@/features/marketplace/components/favorite-button", () => ({
  FavoriteButton: () => <button type="button">favorite</button>,
}));

import { CompareControls } from "@/features/compare/components/compare-controls";
import { CompareSelectionProvider } from "@/features/compare/components/compare-selection-provider";
import { ListingCard } from "@/features/marketplace/components/listing-card";
import type { ListingCardData } from "@/types/marketplace";

function card(id: string, title: string): ListingCardData {
  return {
    id,
    title,
    slug: `slug-${id}`,
    price: 1000,
    currency: "PKR",
    condition: "USED",
    city: "Karachi",
    createdAt: new Date().toISOString(),
  };
}

function renderMarketplace() {
  return render(
    <CompareSelectionProvider>
      <CompareControls />
      <ListingCard listing={card("listing-1", "Apple iPhone")} isAuthenticated={false} />
      <ListingCard listing={card("listing-2", "Samsung Galaxy")} isAuthenticated={false} />
      <ListingCard listing={card("listing-3", "Xiaomi 14")} isAuthenticated={false} />
    </CompareSelectionProvider>,
  );
}

function checkboxFor(title: string): HTMLElement {
  const heading = screen.getByText(title);
  const article = heading.closest("article");
  if (!article) throw new Error(`No card found for ${title}`);
  const checkbox = article.querySelector("span[aria-hidden='true']");
  if (!checkbox) throw new Error(`No checkbox found for ${title}`);
  return checkbox as HTMLElement;
}

describe("marketplace checkbox selection", () => {
  it("toggles each visible checkbox independently", () => {
    renderMarketplace();
    fireEvent.click(screen.getByRole("button", { name: "open" }));

    const apple = checkboxFor("Apple iPhone");
    const samsung = checkboxFor("Samsung Galaxy");
    const xiaomi = checkboxFor("Xiaomi 14");

    fireEvent.click(apple);
    expect(screen.getByText("Selected 1 of 4")).toBeInTheDocument();

    fireEvent.click(samsung);
    expect(screen.getByText("Selected 2 of 4")).toBeInTheDocument();

    fireEvent.click(xiaomi);
    expect(screen.getByText("Selected 3 of 4")).toBeInTheDocument();

    fireEvent.click(samsung);
    expect(screen.getByText("Selected 2 of 4")).toBeInTheDocument();
  });

  it("resolves checkbox clicks through the card toggle button", () => {
    renderMarketplace();
    fireEvent.click(screen.getByRole("button", { name: "open" }));

    const samsung = checkboxFor("Samsung Galaxy");
    expect(samsung.parentElement?.tagName).toBe("BUTTON");

    fireEvent.click(samsung);
    expect(screen.getByText("Selected 1 of 4")).toBeInTheDocument();
  });
});
