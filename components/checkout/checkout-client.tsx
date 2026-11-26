"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { trackBeginCheckout } from "@/features/analytics/lib/events";
import { ShippingSelector } from "@/components/checkout/shipping-selector";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";

interface CartItem {
  id: string;
  listingId: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
}

interface CheckoutClientProps {
  country: string;
  locale: string;
  cartItems: CartItem[];
  subtotal: number;
  currency: string;
}

export function CheckoutClient({
  country,
  locale,
  cartItems,
  subtotal,
  currency,
}: CheckoutClientProps) {
  const router = useRouter();
  const t = useTranslations("checkout");
  const [shippingMethodId, setShippingMethodId] = React.useState<string | null>(null);
  const [zoneId, setZoneId] = React.useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<string | null>(null);
  const [total, setTotal] = React.useState(0);
  const [placing, setPlacing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const checkoutTracked = React.useRef(false);

  const checkoutItems = React.useMemo(
    () =>
      cartItems.map((item) => ({
        item_id: item.listingId,
        item_name: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
    [cartItems],
  );

  React.useEffect(() => {
    if (checkoutTracked.current || checkoutItems.length === 0) return;
    checkoutTracked.current = true;
    trackBeginCheckout({ value: subtotal, currency, items: checkoutItems });
  }, [checkoutItems, currency, subtotal]);

  const decimals = currency === "BHD" ? 3 : 0;

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          shippingMethodId,
          zoneId,
          deliveryAddress: {},
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }
      router.push(`/${country.toLowerCase()}/${locale}/dashboard/orders/${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t("checkout")}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Left: Cart items + Shipping */}
        <div className="space-y-6">
          {/* Cart items */}
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Order Items</h2>
            <div className="mt-3 space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="size-12 rounded object-cover"
                    />
                  ) : (
                    <div className="size-12 rounded bg-slate-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.price.toFixed(decimals)} {item.currency} x {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold">
                    {(item.price * item.quantity).toFixed(decimals)} {item.currency}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">{t("shippingAddress")}</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Address</label>
                <textarea
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>

          {/* Shipping method */}
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold">Shipping Method</h2>
            <div className="mt-3">
              <ShippingSelector
                country={country}
                onShippingChange={(methodId, zId) => {
                  setShippingMethodId(methodId);
                  setZoneId(zId);
                }}
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="rounded-lg border p-4">
            <PaymentMethodSelector
              country={country}
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
            />
          </div>
        </div>

        {/* Right: Summary */}
        <div>
          <CheckoutSummary
            country={country}
            subtotal={subtotal}
            shippingMethodId={shippingMethodId}
            zoneId={zoneId}
            currency={currency}
            onTotalChange={setTotal}
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <button
            className="bg-primary hover:bg-primary/90 mt-4 w-full rounded-md px-4 py-3 text-white disabled:opacity-50"
            onClick={handlePlaceOrder}
            disabled={placing || !shippingMethodId || !paymentMethod}
          >
            {placing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t("processing")}
              </span>
            ) : (
              t("placeOrder")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
