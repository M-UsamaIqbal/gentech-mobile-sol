import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => "/pk/en/compare",
  useSearchParams: () => mocks.searchParams,
}));

import { ComparisonWithControls } from "@/features/compare/components/comparison-with-controls";
import type { PhoneSpecComparison } from "@/features/phone-intelligence/schemas/comparison.schema";

function spec(id: string, name: string): PhoneSpecComparison {
  return {
    id,
    name,
    brand: "Apple",
    slug: `slug-${id}`,
    displaySize: null,
    displayResolution: null,
    displayType: null,
    refreshRate: null,
    processor: null,
    cpuCores: null,
    gpu: null,
    ramOptions: [],
    storageOptions: [],
    mainCamera: null,
    selfieCamera: null,
    cameraFeatures: [],
    batteryCapacity: null,
    batteryType: null,
    chargingSpeed: null,
    networkSupport: [],
    simType: null,
    wifi: null,
    bluetooth: null,
    nfc: null,
    weight: null,
    dimensions: null,
    os: null,
    osVersion: null,
    features: [],
    colors: [],
    launchPrice: null,
    releaseDate: null,
  };
}

describe("comparison page controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams("listings=live-1,live-2");
  });

  it("removes one product while keeping the others in the URL", () => {
    render(
      <ComparisonWithControls
        phones={[spec("live-1", "Apple"), spec("live-2", "Samsung")]}
        currency="PKR"
        idParam="listings"
        marketplaceHref="/pk/en/marketplace"
        canCompare
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /removeFromCompare: Apple/ }));

    expect(mocks.push).toHaveBeenCalledWith(
      "/pk/en/compare?listings=live-2",
    );
  });

  it("removes the last product by clearing the id param from the URL", () => {
    mocks.searchParams = new URLSearchParams("listings=live-1");

    render(
      <ComparisonWithControls
        phones={[spec("live-1", "Apple")]}
        currency="PKR"
        idParam="listings"
        marketplaceHref="/pk/en/marketplace"
        canCompare={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /removeFromCompare: Apple/ }));

    expect(mocks.push).toHaveBeenCalledWith("/pk/en/compare");
  });

  it("offers a marketplace link and a select-more hint for a single product", () => {
    render(
      <ComparisonWithControls
        phones={[spec("live-1", "Apple")]}
        currency="PKR"
        idParam="listings"
        marketplaceHref="/pk/en/marketplace"
        canCompare={false}
      />,
    );

    expect(screen.getByText("selectMore")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "browseMarketplace" })).toHaveAttribute(
      "href",
      "/pk/en/marketplace",
    );
  });
});
