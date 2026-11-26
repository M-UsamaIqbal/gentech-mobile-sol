import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { Region } from "@/lib/generated/prisma/enums";
import { calculateTax } from "@/lib/tax";
import { calculateShipping } from "@/features/shipping/services/shipping.service";
import type { CountryCode } from "@/lib/countries/types";

export interface CreateOrderInput {
  customerId: string;
  country: CountryCode;
  shippingMethodId: string | null;
  zoneId?: string;
  deliveryAddress: Record<string, unknown>;
  paymentMethod?: string;
  notes?: string;
}

export interface OrderResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

/**
 * Generate a unique order number.
 */
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GT-${timestamp}-${random}`;
}

/**
 * Create an order from the user's cart.
 * Uses a database transaction to ensure atomicity.
 */
export async function createOrder(input: CreateOrderInput): Promise<OrderResult> {
  const region: Region = input.country === "BH" ? "BAHRAIN" : "PAKISTAN";
  const currency = input.country === "BH" ? "BHD" : "PKR";

  try {
    // 1. Get cart items with current product details
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: input.customerId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            region: true,
            status: true,
            deletedAt: true,
            sellerId: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // 2. Validate all items
    for (const item of cartItems) {
      if (!item.listing || item.listing.status !== "ACTIVE" || item.listing.deletedAt) {
        return { success: false, error: `Product ${item.listingId} is no longer available` };
      }
      if (item.listing.region !== region) {
        return { success: false, error: `Product ${item.listing.title} is not available in this country` };
      }
      if (item.listing.currency !== currency) {
        return { success: false, error: `Currency mismatch for ${item.listing.title}` };
      }
    }

    // 3. Calculate subtotal from current prices
    let subtotal = 0;
    const orderItems: {
      listingId: string;
      title: string;
      unitPrice: number;
      currency: string;
      quantity: number;
      lineTotal: number;
    }[] = [];

    for (const item of cartItems) {
      const unitPrice = Number(item.listing!.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      orderItems.push({
        listingId: item.listing!.id,
        title: item.listing!.title,
        unitPrice,
        currency: item.listing!.currency,
        quantity: item.quantity,
        lineTotal,
      });
    }

    // 4. Calculate shipping
    let shipping = 0;
    let shippingMethodName: string | null = null;
    let estimatedDays: number | null = null;

    if (input.shippingMethodId) {
      const shippingResult = await calculateShipping(
        input.country,
        input.shippingMethodId,
        input.zoneId,
      );
      if (shippingResult) {
        shipping = shippingResult.total;
        shippingMethodName = shippingResult.method.name;
        estimatedDays = shippingResult.estimatedDays;
      }
    }

    // 5. Calculate tax
    const taxableAmount = subtotal + shipping;
    const taxResult = calculateTax(taxableAmount, input.country);

    // 6. Calculate total
    const total = taxResult.total;

    // 7. Create order in a transaction
    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: input.customerId,
          region,
          currency,
          status: "PENDING",
          subtotal: new Prisma.Decimal(subtotal),
          shipping: new Prisma.Decimal(shipping),
          taxRate: new Prisma.Decimal(taxResult.taxRate),
          taxAmount: new Prisma.Decimal(taxResult.taxAmount),
          taxName: taxResult.taxName,
          discount: new Prisma.Decimal(0),
          total: new Prisma.Decimal(total),
          shippingMethod: shippingMethodName,
          estimatedDays,
          deliveryAddress: input.deliveryAddress as Prisma.InputJsonValue,
          paymentMethod: input.paymentMethod,
          paymentStatus: "UNPAID",
          notes: input.notes,
          items: {
            create: orderItems.map((item) => ({
              listingId: item.listingId,
              title: item.title,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              currency: item.currency,
              quantity: item.quantity,
              lineTotal: new Prisma.Decimal(item.lineTotal),
            })),
          },
        },
      });

      await tx.cartItem.deleteMany({
        where: { userId: input.customerId },
      });

      return newOrder;
    });

    // Send notification AFTER transaction succeeds
    try {
      const { sendOrderNotification } = await import("@/features/notifications/services/notification-delivery.service");
      await sendOrderNotification(input.customerId, "ORDER_CREATED", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: "",
        total: Number(order.total),
        currency: order.currency,
        status: "PENDING",
      });
    } catch (error) {
      console.error("[order] Notification failed:", error);
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  } catch (error) {
    console.error("[order] Failed to create order:", error);
    return { success: false, error: "Failed to create order" };
  }
}

/**
 * Get order by ID.
 */
export async function getOrder(orderId: string) {
  try {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        customer: { select: { name: true, email: true } },
      },
    });
  } catch {
    return null;
  }
}

/**
 * Get user's orders.
 */
export async function getUserOrders(userId: string) {
  try {
    return await prisma.order.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  } catch {
    return [];
  }
}