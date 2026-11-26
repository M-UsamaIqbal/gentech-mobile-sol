import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ANALYTICS_EVENTS,
  trackBeginCheckout,
  trackCreateListing,
  trackPurchase,
  trackSearch,
} from "@/features/analytics/lib/events";
import { collectAttribution } from "@/features/analytics/lib/attribution";

describe("analytics event contract", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/bh/ar/marketplace");
    window.dataLayer = [];
    window.gtag = vi.fn();
    window.fbq = vi.fn();
    window.mixpanel = { track: vi.fn(), identify: vi.fn(), reset: vi.fn() };
  });

  function lastEvent(): Record<string, unknown> {
    const event = window.dataLayer?.at(-1);
    if (!event || typeof event !== "object") throw new Error("No analytics event captured");
    return event as Record<string, unknown>;
  }

  it("exposes commerce events alongside marketplace events", () => {
    expect(ANALYTICS_EVENTS.BEGIN_CHECKOUT).toBe("begin_checkout");
    expect(ANALYTICS_EVENTS.PURCHASE).toBe("purchase");
    expect(ANALYTICS_EVENTS.CREATE_LISTING).toBe("create_listing");
  });

  it("tracks search with optional city", () => {
    trackSearch("iphone 15", "Karachi");
    expect(lastEvent()).toEqual(
      expect.objectContaining({
        event: ANALYTICS_EVENTS.SEARCH,
        query: "iphone 15",
        city: "Karachi",
      }),
    );
  });

  it("tracks listing supply conversion with a real listing id", () => {
    trackCreateListing({ id: "listing-1", price: 150 });
    expect(lastEvent()).toEqual(
      expect.objectContaining({
        event: ANALYTICS_EVENTS.CREATE_LISTING,
        id: "listing-1",
        price: 150,
      }),
    );
  });

  it("tracks checkout and purchase with ecommerce payloads", () => {
    const items = [{ item_id: "listing-1", item_name: "iPhone 15", quantity: 1, price: 150 }];

    trackBeginCheckout({ value: 150, currency: "BHD", items });
    expect(lastEvent()).toEqual(
      expect.objectContaining({
        event: ANALYTICS_EVENTS.BEGIN_CHECKOUT,
        value: 150,
        currency: "BHD",
        items,
      }),
    );

    trackPurchase({ orderId: "order-1", value: 150.5, currency: "BHD", items });
    expect(lastEvent()).toEqual(
      expect.objectContaining({
        event: ANALYTICS_EVENTS.PURCHASE,
        orderId: "order-1",
        transaction_id: "order-1",
        value: 150.5,
        currency: "BHD",
        items,
      }),
    );
  });
});

describe("attribution collection", () => {
  it("keeps only UTM, country, language, referrer and sanitised path", () => {
    const result = collectAttribution(
      "https://gentech.bh/bh/ar/checkout?utm_source=meta&utm_medium=paid&utm_campaign=launch&email=buyer@example.com",
      "https://news.example.com/article?email=leak@example.com",
      "ar",
    );

    expect(result).toEqual({
      page_path: "/bh/ar/checkout?utm_source=meta&utm_medium=paid&utm_campaign=launch",
      referrer: "https://news.example.com/article",
      country: "BH",
      language: "ar",
      utm_source: "meta",
      utm_medium: "paid",
      utm_campaign: "launch",
    });
    expect(JSON.stringify(result)).not.toContain("buyer@example.com");
    expect(JSON.stringify(result)).not.toContain("leak@example.com");
  });

  it("does not invent a country from browser-only routes", () => {
    expect(collectAttribution("/marketplace?q=iphone", "", "en")).toEqual({
      page_path: "/marketplace",
      language: "en",
    });
  });

  it("returns a safe path for malformed input", () => {
    expect(collectAttribution("", "", undefined)).toEqual({ page_path: "/" });
  });
});
