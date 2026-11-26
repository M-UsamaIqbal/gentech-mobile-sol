import { fireEvent, render, screen } from "@testing-library/react";
import type * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => {
    const translate = (key: string, values?: Record<string, string | number>) =>
      key === "selected" ? `Selected ${values?.count} of ${values?.max}` : key;
    translate.has = () => false;
    return translate;
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => "/pk/en/marketplace",
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
import type { ListingCardData } from "@/types/marketplace";

function listing(id: string, title: string): ListingCardData {
  return {
    id,
    title,
    slug: `slug-${id}`,
    price: 125000,
    currency: "PKR",
    condition: "USED",
    city: "Lahore",
    brand: "Apple",
    createdAt: new Date().toISOString(),
  };
}

describe("compare live search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [listing("picker-1", "Apple iPhone 15"), listing("picker-2", "Apple iPhone 14")] }),
    });
    vi.stubGlobal("fetch", mocks.fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("searches listings live and adds results to the compare selection", async () => {
    render(
      <CompareSelectionProvider>
        <CompareControls />
      </CompareSelectionProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "open" }));
    fireEvent.change(screen.getByLabelText("searchLabel"), {
      target: { value: "iphone" },
    });

    const first = await screen.findByRole("option", { name: "addToCompare: Apple iPhone 15" });
    const second = await screen.findByRole("option", { name: "addToCompare: Apple iPhone 14" });

    expect(mocks.fetch).toHaveBeenCalledWith(
      "/api/v1/search/listings?q=iphone&limit=8&country=PK",
      expect.objectContaining({ signal: expect.anything() }),
    );

    fireEvent.click(first);
    expect(screen.getByText("Selected 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "removeFromCompare: Apple iPhone 15" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(second);
    expect(screen.getByText("Selected 2 of 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "compareSelected" }));
    expect(mocks.push).toHaveBeenCalledWith("/pk/en/compare?listings=picker-1,picker-2");
  });

  it("shows a hint before the query is long enough to search", () => {
    render(
      <CompareSelectionProvider>
        <CompareControls />
      </CompareSelectionProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "open" }));
    fireEvent.change(screen.getByLabelText("searchLabel"), { target: { value: "i" } });

    expect(screen.getByText("searchHint")).toBeInTheDocument();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
