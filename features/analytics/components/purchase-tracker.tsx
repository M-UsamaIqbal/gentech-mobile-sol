"use client";

import * as React from "react";

import { trackPurchase, type AnalyticsItem } from "@/features/analytics/lib/events";

/**
 * Fires one standard purchase event only for an order the server has confirmed as paid.
 * Rendered from the order detail page so a query-string visit can never manufacture a
 * conversion.
 */
export function PurchaseTracker({
  orderId,
  value,
  currency,
  items,
}: {
  orderId: string;
  value: number;
  currency: string;
  items: AnalyticsItem[];
}) {
  const fired = React.useRef(false);
  const itemsKey = JSON.stringify(items);

  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPurchase({ orderId, value, currency, items: JSON.parse(itemsKey) as AnalyticsItem[] });
  }, [currency, itemsKey, orderId, value]);

  return null;
}
