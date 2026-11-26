"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

interface PaymentMethod {
  id: string;
  name: string;
  displayName: string;
  type: "online" | "offline";
  description?: string;
  enabled: boolean;
}

interface PaymentMethodSelectorProps {
  country: string;
  selectedMethod: string | null;
  onSelect: (methodId: string) => void;
}

export function PaymentMethodSelector({
  country,
  selectedMethod,
  onSelect,
}: PaymentMethodSelectorProps) {
  const t = useTranslations("payment");
  const [methods, setMethods] = React.useState<PaymentMethod[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/payment-methods?country=${country}`);
        const data = await res.json();
        setMethods(data.methods || []);
      } catch {
        setMethods([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [country]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading payment methods...</div>;
  }

  if (methods.length === 0) {
    return <div className="text-sm text-muted-foreground">No payment methods available</div>;
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{t("selectPayment")}</label>
      <div className="space-y-2">
        {methods.map((method) => (
          <label
            key={method.id}
            className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent ${
              selectedMethod === method.id ? "border-primary bg-accent" : ""
            } ${!method.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selectedMethod === method.id}
              onChange={() => method.enabled && onSelect(method.id)}
              disabled={!method.enabled}
              className="size-4"
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{method.displayName}</p>
              {method.description && (
                <p className="text-xs text-muted-foreground">{method.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {method.type === "online" ? "Online" : "Offline"}
                {!method.enabled ? " (Coming soon)" : ""}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}