import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getUserOrders } from "@/features/orders/services/order.service";

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

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string; locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { country, locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const sp = await searchParams;
  const statusFilter = (sp.status as string) || "ALL";

  const orders = await getUserOrders(user.id);

  const filteredOrders =
    statusFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {/* Status filter */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map(
          (status) => (
            <a
              key={status}
              href={`/${country}/${locale}/dashboard/orders?status=${status}`}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                statusFilter === status
                  ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                  : "border-white/[0.07] text-slate-400 hover:bg-white/[0.04]"
              }`}
            >
              {status === "ALL" ? "All" : STATUS_LABELS[status]}
            </a>
          ),
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-white/10 bg-[#1F1F1F]/60 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-slate-200">No orders found</p>
          <p className="mt-1 text-xs text-slate-500">
            {statusFilter === "ALL"
              ? "You haven't placed any orders yet."
              : `No ${STATUS_LABELS[statusFilter]?.toLowerCase()} orders.`}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredOrders.map((order) => (
            <a
              key={order.id}
              href={`/${country}/${locale}/dashboard/orders/${order.id}`}
              className="block rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-4 transition-colors hover:bg-white/[0.02]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString()} · {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    {Number(order.total).toFixed(order.currency === "BHD" ? 3 : 0)} {order.currency}
                  </p>
                  <p className={`text-xs font-medium ${STATUS_COLORS[order.status] || "text-slate-400"}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
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
            </a>
          ))}
        </div>
      )}
    </div>
  );
}