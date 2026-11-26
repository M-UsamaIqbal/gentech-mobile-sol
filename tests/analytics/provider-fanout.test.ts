import { beforeEach, describe, expect, it, vi } from "vitest";

import { identify, pageview, resetAnalytics, track } from "@/features/analytics/lib/client";
import { ANALYTICS_EVENTS, trackPurchase } from "@/features/analytics/lib/events";

describe("analytics provider fan-out", () => {
  beforeEach(() => {
    window.history.replaceState(
      {},
      "",
      "/pk/en/checkout?utm_source=google&email=buyer@example.com",
    );
    document.documentElement.lang = "en";
    Object.defineProperty(document, "referrer", {
      value: "https://search.example.com/results?email=leak@example.com",
      configurable: true,
    });
    window.dataLayer = [];
    window.gtag = vi.fn();
    window.fbq = vi.fn();
    window.mixpanel = {
      track: vi.fn(),
      identify: vi.fn(),
      reset: vi.fn(),
      people: { set: vi.fn() },
    };
  });

  it("sends purchase conversions as standard provider events", () => {
    const items = [{ item_id: "listing-1", item_name: "Galaxy S25", quantity: 1, price: 120000 }];
    trackPurchase({ orderId: "order-1", value: 120000, currency: "PKR", items });

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      ANALYTICS_EVENTS.PURCHASE,
      expect.objectContaining({
        orderId: "order-1",
        transaction_id: "order-1",
        value: 120000,
        currency: "PKR",
        country: "PK",
        utm_source: "google",
        page_path: "/pk/en/checkout?utm_source=google",
      }),
    );
    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "Purchase",
      expect.objectContaining({ orderId: "order-1", currency: "PKR" }),
    );
    expect(window.fbq).not.toHaveBeenCalledWith("trackCustom", "purchase", expect.anything());
    expect(window.mixpanel?.track).toHaveBeenCalledWith(
      ANALYTICS_EVENTS.PURCHASE,
      expect.objectContaining({ orderId: "order-1" }),
    );
    expect(JSON.stringify(window.dataLayer)).not.toContain("buyer@example.com");
  });

  it("sends a diagnostic event as a custom Meta event", () => {
    track(ANALYTICS_EVENTS.TOGGLE_FAVORITE, { listingId: "listing-1", favorite: true });
    expect(window.fbq).toHaveBeenCalledWith(
      "trackCustom",
      ANALYTICS_EVENTS.TOGGLE_FAVORITE,
      expect.objectContaining({ listingId: "listing-1" }),
    );
  });

  it("sanitises page-view paths and referrers", () => {
    pageview("/pk/en/marketplace?orderId=secret&utm_source=google");
    const payload = (window.gtag as ReturnType<typeof vi.fn>).mock.calls[0]?.[2] as Record<
      string,
      unknown
    >;

    expect(payload).toEqual(
      expect.objectContaining({
        page_path: "/pk/en/marketplace?utm_source=google",
        referrer: "https://search.example.com/results",
        country: "PK",
      }),
    );
    expect(JSON.stringify(payload)).not.toContain("orderId=secret");
    expect(JSON.stringify(payload)).not.toContain("leak@example.com");
  });

  it("identifies a known user and clears the association on sign-out", () => {
    identify("user-1", { role: "CUSTOMER" });
    expect(window.gtag).toHaveBeenCalledWith("set", { user_id: "user-1" });
    expect(window.mixpanel?.identify).toHaveBeenCalledWith("user-1");

    resetAnalytics();
    expect(window.gtag).toHaveBeenCalledWith("set", { user_id: null });
    expect(window.mixpanel?.reset).toHaveBeenCalledTimes(1);
  });
});
