import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { Prisma, OrderStatus, type Region } from "@/lib/generated/prisma/client";
import { requireAdmin } from "@/features/admin/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { getAllowedTransitions } from "@/features/orders/services/order-status.service";
import { OrderStatusUpdate } from "@/components/orders/order-status-update";

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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect(ROUTES.dashboard);

  const sp = await searchParams;
  const country = (sp.country as string) || "ALL";
  const status = (sp.status as string) || "ALL";
  const q = (sp.q as string) || "";

  const where: Prisma.OrderWhereInput = {};
  if (country !== "ALL") {
    const region: Region = country === "BH" ? "BAHRAIN" : "PAKISTAN";
    where.region = region;
  }
  if (status !== "ALL" && (Object.values(OrderStatus) as string[]).includes(status)) {
    where.status = status as OrderStatus;
  }
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      customer: { select: { name: true, email: true } },
      items: { select: { title: true, quantity: true } },
    },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-slate-400">Manage and review orders.</p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Country filter */}
        <div className="flex gap-2">
          {["ALL", "BH", "PK"].map((c) => (
            <a
              key={c}
              href={`/admin/orders?country=${c}${status !== "ALL" ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}`}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                country === c
                  ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                  : "border-white/[0.07] text-slate-400"
              }`}
            >
              {c === "ALL" ? "All" : c === "BH" ? "🇧🇭 Bahrain" : "🇵🇰 Pakistan"}
            </a>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          {["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].map((s) => (
            <a
              key={s}
              href={`/admin/orders?status=${s}${country !== "ALL" ? `&country=${country}` : ""}${q ? `&q=${q}` : ""}`}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                status === s
                  ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                  : "border-white/[0.07] text-slate-400"
              }`}
            >
              {s === "ALL" ? "All Status" : STATUS_LABELS[s]}
            </a>
          ))}
        </div>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by order number or customer..."
          className="flex-1 rounded-lg border border-white/10 bg-[#1F1F1F] px-3 py-2 text-sm text-white"
        />
        <input type="hidden" name="country" value={country} />
        <input type="hidden" name="status" value={status} />
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
      </form>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#1F1F1F]/60 px-5 py-12 text-center">
          <p className="text-sm font-semibold text-slate-200">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const allowedTransitions = getAllowedTransitions(order.status, "ADMIN");
            return (
              <div
                key={order.id}
                className="rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-slate-400">
                      {order.customer.name} ({order.customer.email})
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleString()} · {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {Number(order.total).toFixed(order.currency === "BHD" ? 3 : 0)} {order.currency}
                    </p>
                    <p className={`text-xs font-medium ${STATUS_COLORS[order.status] || "text-slate-400"}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </p>
                    <p className="text-xs text-slate-500">
                      {order.region === "BAHRAIN" ? "🇧🇭" : "🇵🇰"} {order.paymentStatus}
                    </p>
                  </div>
                </div>

                {/* Status update controls */}
                <OrderStatusUpdate
                  orderId={order.id}
                  allowedTransitions={allowedTransitions}
                  statusLabels={STATUS_LABELS}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}