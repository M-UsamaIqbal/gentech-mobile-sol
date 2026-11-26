import { redirect, notFound } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getOrder } from "@/features/orders/services/order.service";
import { PurchaseTracker } from "@/features/analytics/components/purchase-tracker";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400",
  CONFIRMED: "text-blue-400",
  PROCESSING: "text-purple-400",
  SHIPPED: "text-indigo-400",
  DELIVERED: "text-green-400",
  CANCELLED: "text-red-400",
  REFUNDED: "text-orange-400",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ country: string; locale: string; id: string }>;
}) {
  const { country, locale, id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const order = await getOrder(id);
  if (!order) notFound();

  // Ensure user owns this order (or is admin)
  if (order.customerId !== user.id && user.role !== "ADMIN") {
    redirect(ROUTES.dashboard);
  }

  const decimals = order.currency === "BHD" ? 3 : 0;

  const purchaseItems = order.items.map((item) => ({
    item_id: item.listingId ?? item.id,
    item_name: item.title,
    quantity: item.quantity,
    price: Number(item.unitPrice),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <a
        href={`/${country}/${locale}/dashboard/orders`}
        className="text-sm text-slate-400 hover:text-white"
      >
        ← Back to Orders
      </a>

      <h1 className="mt-4 text-2xl font-bold">Order #{order.orderNumber}</h1>

      <div className="mt-2 flex items-center gap-3">
        <span className={`text-sm font-medium ${STATUS_COLORS[order.status] || "text-slate-400"}`}>
          {STATUS_LABELS[order.status] || order.status}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            order.paymentStatus === "PAID"
              ? "bg-green-500/10 text-green-400"
              : "bg-yellow-500/10 text-yellow-400"
          }`}
        >
          {order.paymentStatus}
        </span>
        <span className="text-xs text-slate-500">
          {order.region === "BAHRAIN" ? "🇧🇭 Bahrain" : "🇵🇰 Pakistan"}
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        Placed on {new Date(order.createdAt).toLocaleString()}
      </p>

      {order.paymentStatus === "PAID" ? (
        <PurchaseTracker
          orderId={order.id}
          value={Number(order.total)}
          currency={order.currency}
          items={purchaseItems}
        />
      ) : null}

      {/* Order Items */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Order Items</h2>
        <div className="mt-3 space-y-3">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#1F1F1F] p-4"
            >
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="text-xs text-slate-400">
                  {Number(item.unitPrice).toFixed(decimals)} {item.currency} x {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-white">
                {Number(item.lineTotal).toFixed(decimals)} {item.currency}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Order Summary */}
      <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#1F1F1F] p-4">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Subtotal</span>
            <span className="text-white">
              {Number(order.subtotal).toFixed(decimals)} {order.currency}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Shipping</span>
            <span className="text-white">
              {Number(order.shipping).toFixed(decimals)} {order.currency}
            </span>
          </div>
          {order.discount && Number(order.discount) > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Discount</span>
              <span>
                -{Number(order.discount).toFixed(decimals)} {order.currency}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">
              {order.taxName || "Tax"} ({(Number(order.taxRate) * 100).toFixed(1)}%)
            </span>
            <span className="text-white">
              {Number(order.taxAmount).toFixed(decimals)} {order.currency}
            </span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
            <span className="text-white">Total</span>
            <span className="text-white">
              {Number(order.total).toFixed(decimals)} {order.currency}
            </span>
          </div>
        </div>
      </section>

      {/* Delivery Info */}
      {order.deliveryAddress ? (
        <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#1F1F1F] p-4">
          <h2 className="text-lg font-semibold">Delivery Information</h2>
          <div className="mt-3 space-y-1 text-sm">
            {order.shippingMethod && (
              <p className="text-slate-400">
                Shipping Method: <span className="text-white">{order.shippingMethod}</span>
              </p>
            )}
            {order.estimatedDays && (
              <p className="text-slate-400">
                Estimated Delivery: <span className="text-white">{order.estimatedDays} days</span>
              </p>
            )}
            <p className="text-slate-400">
              Address: <span className="text-white">{JSON.stringify(order.deliveryAddress)}</span>
            </p>
          </div>
        </section>
      ) : null}

      {/* Payment Info */}
      <section className="mt-6 rounded-lg border border-white/[0.08] bg-[#1F1F1F] p-4">
        <h2 className="text-lg font-semibold">Payment Information</h2>
        <div className="mt-3 space-y-1 text-sm">
          <p className="text-slate-400">
            Method: <span className="text-white">{order.paymentMethod || "Not specified"}</span>
          </p>
          <p className="text-slate-400">
            Status: <span className="text-white">{order.paymentStatus}</span>
          </p>
          {order.paymentRef && (
            <p className="text-slate-400">
              Reference: <span className="text-white">{order.paymentRef}</span>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
