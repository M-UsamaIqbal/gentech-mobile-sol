"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

interface OrderStatusUpdateProps {
  orderId: string;
  allowedTransitions: string[];
  statusLabels: Record<string, string>;
}

export function OrderStatusUpdate({ orderId, allowedTransitions, statusLabels }: OrderStatusUpdateProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [showTracking, setShowTracking] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "SHIPPED" && !trackingNumber.trim()) {
      setShowTracking(true);
      setPendingStatus(newStatus);
      return;
    }

    setLoading(newStatus);
    setError(null);

    try {
      const res = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          newStatus,
          trackingNumber: trackingNumber.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      // Reset state
      setTrackingNumber("");
      setShowTracking(false);
      setPendingStatus(null);

      // Refresh the page
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setLoading(null);
    }
  };

  if (allowedTransitions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {error && <p className="text-xs text-red-400">{error}</p>}

      {showTracking && pendingStatus && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
            className="flex-1 rounded border border-white/10 bg-[#0e0f12] px-2 py-1 text-xs text-white"
            autoFocus
          />
          <button
            onClick={() => handleStatusChange(pendingStatus)}
            disabled={loading !== null || !trackingNumber.trim()}
            className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
          >
            {loading ? "..." : "Confirm Ship"}
          </button>
          <button
            onClick={() => {
              setShowTracking(false);
              setPendingStatus(null);
              setTrackingNumber("");
            }}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      )}

      {!showTracking && (
        <div className="flex flex-wrap gap-2">
          {allowedTransitions.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={loading !== null}
              className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              {loading === status ? "..." : statusLabels[status] || status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}