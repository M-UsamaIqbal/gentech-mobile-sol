"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  estimatedDays: number;
}

interface DeliveryZone {
  id: string;
  name: string;
  city: string | null;
  surcharge: number;
  codAvailable: boolean;
}

interface ShippingSelectorProps {
  country: string;
  onShippingChange: (methodId: string | null, zoneId: string | null) => void;
  initialMethodId?: string;
  initialZoneId?: string;
}

export function ShippingSelector({
  country,
  onShippingChange,
  initialMethodId,
  initialZoneId,
}: ShippingSelectorProps) {
  const t = useTranslations("shipping");
  const [methods, setMethods] = React.useState<ShippingMethod[]>([]);
  const [zones, setZones] = React.useState<DeliveryZone[]>([]);
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(initialMethodId ?? null);
  const [selectedZone, setSelectedZone] = React.useState<string | null>(initialZoneId ?? null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/shipping/methods?country=${country}&zones=true`);
        const data = await res.json();
        setMethods(data.methods || []);
        setZones(data.zones || []);
      } catch {
        setMethods([]);
        setZones([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [country]);

  React.useEffect(() => {
    onShippingChange(selectedMethod, selectedZone);
  }, [selectedMethod, selectedZone, onShippingChange]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading shipping options...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Delivery Zone */}
      {zones.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Delivery Zone</label>
          <select
            value={selectedZone ?? ""}
            onChange={(e) => setSelectedZone(e.target.value || null)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} {z.city ? `(${z.city})` : ""}{" "}
                {z.surcharge > 0 ? `+${z.surcharge}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Shipping Method */}
      <div>
        <label className="block text-sm font-medium mb-1">Shipping Method</label>
        <div className="space-y-2">
          {methods.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent ${
                selectedMethod === m.id ? "border-primary bg-accent" : ""
              }`}
            >
              <input
                type="radio"
                name="shippingMethod"
                value={m.id}
                checked={selectedMethod === m.id}
                onChange={() => setSelectedMethod(m.id)}
                className="size-4"
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{m.name}</p>
                {m.description ? (
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Est. {m.estimatedDays} days
                </p>
              </div>
              <span className="text-sm font-semibold">
                {m.price > 0 ? `${m.price} ${m.currency}` : "Free"}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}