import type { ConversionFunnelMetric, MarketRegion } from "@/features/admin/types";

/** Percentage with two decimals; a zero denominator never yields NaN or Infinity. */
export function conversionRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10_000) / 100;
}

export interface ConversionFunnelRow {
  region: MarketRegion;
  label: string;
  flag: string;
  views: number;
  favorites: number;
  chats: number;
  orders: number;
  paidOrders: number;
}

/** Adds derived stage-to-stage conversion rates to raw region-scoped counts. */
export function buildConversionFunnel(rows: ConversionFunnelRow[]): ConversionFunnelMetric[] {
  return rows.map((row) => ({
    ...row,
    viewToChatRate: conversionRate(row.chats, row.views),
    chatToOrderRate: conversionRate(row.orders, row.chats),
    viewToOrderRate: conversionRate(row.orders, row.views),
  }));
}
