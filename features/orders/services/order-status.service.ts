import "server-only";

import { prisma } from "@/lib/prisma";

export type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export interface StatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  allowedRoles: string[];
  requiresTracking?: boolean;
}

export interface TransitionResult {
  success: boolean;
  error?: string;
  previousStatus?: OrderStatus;
  newStatus?: OrderStatus;
}

interface OrderStatusAuditSnapshot {
  status?: OrderStatus;
  trackingNumber?: string;
}

function readStatusAuditSnapshot(value: unknown): OrderStatusAuditSnapshot {
  return value !== null && typeof value === "object" ? (value as OrderStatusAuditSnapshot) : {};
}

// Valid status transitions
const TRANSITIONS: StatusTransition[] = [
  { from: "PENDING", to: "CONFIRMED", allowedRoles: ["ADMIN", "SYSTEM"] },
  { from: "PENDING", to: "CANCELLED", allowedRoles: ["ADMIN", "CUSTOMER"] },
  { from: "CONFIRMED", to: "PROCESSING", allowedRoles: ["ADMIN", "SELLER"] },
  { from: "CONFIRMED", to: "CANCELLED", allowedRoles: ["ADMIN", "CUSTOMER"] },
  { from: "PROCESSING", to: "SHIPPED", allowedRoles: ["ADMIN", "SELLER"], requiresTracking: true },
  { from: "PROCESSING", to: "CANCELLED", allowedRoles: ["ADMIN"] },
  { from: "SHIPPED", to: "DELIVERED", allowedRoles: ["ADMIN", "SYSTEM"] },
  { from: "SHIPPED", to: "CANCELLED", allowedRoles: ["ADMIN"] },
  { from: "DELIVERED", to: "REFUNDED", allowedRoles: ["ADMIN"] },
];

/**
 * Check if a transition is valid.
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.to === to);
}

/**
 * Get allowed transitions from current status for a given role.
 */
export function getAllowedTransitions(currentStatus: OrderStatus, role: string): OrderStatus[] {
  return TRANSITIONS
    .filter((t) => t.from === currentStatus && t.allowedRoles.includes(role))
    .map((t) => t.to);
}

/**
 * Transition an order to a new status.
 * Validates permissions, records history, and prevents unauthorized changes.
 */
export async function transitionOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  actorId: string,
  actorRole: string,
  trackingNumber?: string,
): Promise<TransitionResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customerId: true,
        region: true,
        items: { select: { listing: { select: { sellerId: true } } } },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Ownership is enforced server-side: a customer may only act on their own
    // order, and a seller only on orders containing one of their listings.
    if (actorRole === "CUSTOMER" && order.customerId !== actorId) {
      return { success: false, error: "You do not own this order" };
    }
    if (actorRole === "SELLER" && !order.items.some((item) => item.listing?.sellerId === actorId)) {
      return { success: false, error: "You do not have an item in this order" };
    }

    const currentStatus = order.status as OrderStatus;

    // Validate transition
    if (!isValidTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${currentStatus} to ${newStatus}`,
        previousStatus: currentStatus,
      };
    }

    // Check role permission
    const transition = TRANSITIONS.find((t) => t.from === currentStatus && t.to === newStatus);
    if (!transition || !transition.allowedRoles.includes(actorRole)) {
      return {
        success: false,
        error: "Insufficient permissions for this transition",
        previousStatus: currentStatus,
      };
    }

    // Check tracking requirement
    if (transition.requiresTracking && !trackingNumber) {
      return {
        success: false,
        error: "Tracking number is required for this transition",
        previousStatus: currentStatus,
      };
    }

    // Perform transition in a transaction
    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          ...(trackingNumber ? { notes: `Tracking: ${trackingNumber}` } : {}),
        },
      });

      // Record in audit log
      await tx.auditLog.create({
        data: {
          actorId,
          action: "ORDER_STATUS_CHANGE",
          resource: "order",
          resourceId: orderId,
          before: { status: currentStatus },
          after: { status: newStatus, trackingNumber },
          metadata: { orderId, previousStatus: currentStatus, newStatus },
        },
      });
    });

    // Send notification AFTER transaction succeeds
    try {
      const { notifyOrderStatusChange } = await import("@/features/notifications/services/notification-delivery.service");
      await notifyOrderStatusChange(orderId, newStatus);
    } catch (error) {
      console.error("[order-status] Notification failed:", error);
    }

    return {
      success: true,
      previousStatus: currentStatus,
      newStatus,
    };
  } catch (error) {
    console.error("[order-status] Transition failed:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

/**
 * Get order status history from audit logs.
 */
export async function getOrderStatusHistory(orderId: string) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        resource: "order",
        resourceId: orderId,
        action: "ORDER_STATUS_CHANGE",
      },
      orderBy: { timestamp: "asc" },
      include: {
        actor: { select: { name: true, email: true } },
      },
    });
    return logs.map((log) => {
      const before = readStatusAuditSnapshot(log.before);
      const after = readStatusAuditSnapshot(log.after);
      return {
        id: log.id,
        actor: log.actor.name,
        previousStatus: before.status,
        newStatus: after.status,
        trackingNumber: after.trackingNumber,
        timestamp: log.timestamp.toISOString(),
      };
    });
  } catch {
    return [];
  }
}