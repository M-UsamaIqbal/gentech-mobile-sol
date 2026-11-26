import { describe, expect, it } from "vitest";

import {
  buildConversionFunnel,
  conversionRate,
  type ConversionFunnelRow,
} from "@/features/admin/lib/conversion-funnel";

describe("conversion funnel", () => {
  it("returns zero rather than NaN when there are no visitors", () => {
    expect(conversionRate(5, 0)).toBe(0);
    expect(conversionRate(0, 0)).toBe(0);
  });

  it("computes stage rates as percentages rounded to two decimals", () => {
    expect(conversionRate(1, 3)).toBe(33.33);
    expect(conversionRate(2, 3)).toBe(66.67);
  });

  it("adds derived rates to each region without mixing currencies", () => {
    const rows: ConversionFunnelRow[] = [
      {
        region: "BAHRAIN",
        label: "Bahrain",
        flag: "🇧🇭",
        views: 100,
        favorites: 20,
        chats: 10,
        orders: 4,
        paidOrders: 3,
      },
      {
        region: "PAKISTAN",
        label: "Pakistan",
        flag: "🇵🇰",
        views: 0,
        favorites: 0,
        chats: 0,
        orders: 0,
        paidOrders: 0,
      },
    ];

    const [bh, pk] = buildConversionFunnel(rows);

    expect(bh).toEqual(
      expect.objectContaining({
        region: "BAHRAIN",
        views: 100,
        viewToChatRate: 10,
        chatToOrderRate: 40,
        viewToOrderRate: 4,
      }),
    );
    expect(pk).toEqual(
      expect.objectContaining({
        region: "PAKISTAN",
        viewToChatRate: 0,
        chatToOrderRate: 0,
        viewToOrderRate: 0,
      }),
    );
  });
});
