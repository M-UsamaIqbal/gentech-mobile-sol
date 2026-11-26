"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

interface CheckoutSummaryProps {
  country: string;
  subtotal: number;
  shippingMethodId: string | null;
  zoneId: string | null;
  discount?: number;
  currency: string;
  onTotalChange?: (total: number) => void;
}

interface CheckoutResult {
  subtotal: number;
  shipping: number;
  tax: number;
  taxRate: number;
  taxName: string;
  discount: number;
  total: number;
  currency: string;
  shippingMethod: string | null;
  shippingEstimatedDays: number | null;
  codAvailable: boolean;
}

export function CheckoutSummary({
  country,
  subtotal,
  shippingMethodId,
  zoneId,
  discount = 0,
  currency,
  onTotalChange,
}: CheckoutSummaryProps) {
  const t = useTranslations("checkout");
  const [result, setResult] = React.useState<CheckoutResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    async function calculate() {
      setLoading(true);
      try {
        const res = await fetch("/api/checkout/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country,
            subtotal,
            shippingMethodId,
            zoneId,
            discount,
          }),
        });
        const data = await res.json();
        setResult(data);
        onTotalChange?.(data.total);
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    }
    calculate();
  }, [country, subtotal, shippingMethodId, zoneId, discount, onTotalChange]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Calculating...</div>;
  }

  if (!result) {
    return <div className="text-sm text-red-500">Failed to calculate total</div>;
  }

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <h3 className="font-semibold">{t("orderSummary")}</h3>
      <div className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{result.subtotal.toFixed(result.currency === "BHD" ? 3 : 0)} {result.currency}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Shipping</span>
        <span>{result.shipping.toFixed(result.currency === "BHD" ? 3 : 0)} {result.currency}</span>
      </div>
      {result.discount > 0 && (
        <div className="flex justify-between text-sm text-green-500">
          <span>Discount</span>
          <span>-{result.discount.toFixed(result.currency === "BHD" ? 3 : 0)} {result.currency}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span>
          {result.taxName} ({(result.taxRate * 100).toFixed(1)}%)
        </span>
        <span>{result.tax.toFixed(result.currency === "BHD" ? 3 : 0)} {result.currency}</span>
      </div>
      <div className="flex justify-between border-t pt-2 font-bold">
        <span>{t("total")}</span>
        <span>{result.total.toFixed(result.currency === "BHD" ? 3 : 0)} {result.currency}</span>
      </div>
      {result.shippingMethod && (
        <p className="text-xs text-muted-foreground">
          Shipping: {result.shippingMethod}
          {result.shippingEstimatedDays ? ` (Est. ${result.shippingEstimatedDays} days)` : ""}
        </p>
      )}
      {result.codAvailable && (
        <p className="text-xs text-green-500">Cash on Delivery available</p>
      )}
    </div>
  );
}