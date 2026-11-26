"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, Minus, Plus } from "lucide-react";

interface CartItem {
  id: string;
  listingId: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  region: string;
  image?: string;
}

interface CartItemsProps {
  items: CartItem[];
  country: string;
  locale: string;
  currency: string;
  onCartChange: () => void;
}

export function CartItems({ items: initialItems, country, locale, currency, onCartChange }: CartItemsProps) {
  const router = useRouter();
  const [items, setItems] = React.useState(initialItems);
  const [loading, setLoading] = React.useState<string | null>(null);

  const decimals = currency === "BHD" ? 3 : 0;

  const handleRemove = async (listingId: string) => {
    setLoading(listingId);
    try {
      await fetch(`/api/cart?listingId=${listingId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.listingId !== listingId));
      onCartChange();
    } catch {
      // Error handling
    } finally {
      setLoading(null);
    }
  };

  const handleQuantityChange = async (listingId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setLoading(listingId);
    try {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, quantity: newQuantity }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.listingId === listingId ? { ...item, quantity: newQuantity } : item,
        ),
      );
      onCartChange();
    } catch {
      // Error handling
    } finally {
      setLoading(null);
    }
  };

  const handleClearCart = async () => {
    setLoading("clear");
    try {
      await fetch("/api/cart", { method: "DELETE" });
      setItems([]);
      onCartChange();
    } catch {
      // Error handling
    } finally {
      setLoading(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-white/10 bg-[#1F1F1F]/60 px-5 py-12 text-center">
        <p className="text-sm font-semibold text-slate-200">Your cart is empty</p>
        <p className="mt-1 text-xs text-slate-500">Browse listings and add items to your cart.</p>
        <a
          href={`/${country}/${locale}/marketplace`}
          className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          Continue Shopping
        </a>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-4"
          >
            {item.image ? (
              <img src={item.image} alt={item.title} className="size-16 rounded-lg object-cover" />
            ) : (
              <div className="size-16 rounded-lg bg-slate-800" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
              <p className="text-xs text-slate-400">
                {item.price.toFixed(decimals)} {item.currency} x {item.quantity}
              </p>
              <p className="text-sm font-bold text-emerald-300 mt-1">
                {(item.price * item.quantity).toFixed(decimals)} {item.currency}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {item.region === "BAHRAIN" ? "🇧🇭" : "🇵🇰"}
              </span>
              {/* Quantity controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleQuantityChange(item.listingId, item.quantity - 1)}
                  disabled={loading === item.listingId || item.quantity <= 1}
                  className="rounded border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
                >
                  <Minus className="size-3" />
                </button>
                <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.listingId, item.quantity + 1)}
                  disabled={loading === item.listingId}
                  className="rounded border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
                >
                  <Plus className="size-3" />
                </button>
              </div>
              <button
                onClick={() => handleRemove(item.listingId)}
                disabled={loading === item.listingId}
                className="rounded-lg border border-rose-400/40 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-4">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-slate-300">Subtotal</span>
          <span className="text-lg font-bold text-white">
            {subtotal.toFixed(decimals)} {currency}
          </span>
        </div>
        <div className="mt-4 flex gap-3">
          <a
            href={`/${country}/${locale}/marketplace`}
            className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-center text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            Continue Shopping
          </a>
          <a
            href={`/${country}/${locale}/checkout`}
            className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-400"
          >
            Proceed to Checkout
          </a>
        </div>
        <button
          onClick={handleClearCart}
          disabled={loading === "clear"}
          className="mt-3 w-full rounded-lg border border-rose-400/40 px-4 py-2 text-sm font-medium text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
        >
          Clear Cart
        </button>
      </div>
    </>
  );
}