import "server-only";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/features/notifications/repositories/notification.repository";
import { getUserLocalizationPreferences } from "@/features/localization/repositories/user-preferences.repository";

export type NotificationLocale = "en" | "ar" | "ur";

export interface OrderNotificationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  total: number;
  currency: string;
  status: string;
}

const ORDER_NOTIFICATION_TEMPLATES: Record<
  string,
  Record<NotificationLocale, { title: string; body: string }>
> = {
  ORDER_CREATED: {
    en: {
      title: "Order Created",
      body: "Your order #{orderNumber} has been created. Total: {total} {currency}",
    },
    ar: {
      title: "تم إنشاء الطلب",
      body: "تم إنشاء طلبك #{orderNumber}. المجموع: {total} {currency}",
    },
    ur: {
      title: "آرڈر بنایا گیا",
      body: "آپ کا آرڈر #{orderNumber} بنایا گیا ہے۔ کل: {total} {currency}",
    },
  },
  ORDER_CONFIRMED: {
    en: {
      title: "Order Confirmed",
      body: "Your order #{orderNumber} has been confirmed.",
    },
    ar: {
      title: "تم تأكيد الطلب",
      body: "تم تأكيد طلبك #{orderNumber}.",
    },
    ur: {
      title: "آرڈر کنفرم ہو گیا",
      body: "آپ کا آرڈر #{orderNumber} کنفرم ہو گیا ہے۔",
    },
  },
  ORDER_PROCESSING: {
    en: {
      title: "Order Processing",
      body: "Your order #{orderNumber} is being processed.",
    },
    ar: {
      title: "جاري معالجة الطلب",
      body: "جاري معالجة طلبك #{orderNumber}.",
    },
    ur: {
      title: "آرڈر پروسیس ہو رہا ہے",
      body: "آپ کا آرڈر #{orderNumber} پروسیس ہو رہا ہے۔",
    },
  },
  ORDER_SHIPPED: {
    en: {
      title: "Order Shipped",
      body: "Your order #{orderNumber} has been shipped.",
    },
    ar: {
      title: "تم شحن الطلب",
      body: "تم شحن طلبك #{orderNumber}.",
    },
    ur: {
      title: "آرڈر شپ ہو گیا",
      body: "آپ کا آرڈر #{orderNumber} شپ ہو گیا ہے۔",
    },
  },
  ORDER_DELIVERED: {
    en: {
      title: "Order Delivered",
      body: "Your order #{orderNumber} has been delivered.",
    },
    ar: {
      title: "تم توصيل الطلب",
      body: "تم توصيل طلبك #{orderNumber}.",
    },
    ur: {
      title: "آرڈر ڈیلیور ہو گیا",
      body: "آپ کا آرڈر #{orderNumber} ڈیلیور ہو گیا ہے۔",
    },
  },
  ORDER_CANCELLED: {
    en: {
      title: "Order Cancelled",
      body: "Your order #{orderNumber} has been cancelled.",
    },
    ar: {
      title: "تم إلغاء الطلب",
      body: "تم إلغاء طلبك #{orderNumber}.",
    },
    ur: {
      title: "آرڈر منسوخ ہو گیا",
      body: "آپ کا آرڈر #{orderNumber} منسوخ ہو گیا ہے۔",
    },
  },
};

/**
 * Uses the user's saved language when present; region is only a last-resort
 * default for accounts that never made an explicit selection.
 */
async function getUserLanguage(userId: string): Promise<NotificationLocale> {
  const preferences = await getUserLocalizationPreferences(userId);
  if (preferences?.locale) return preferences.locale;
  return preferences?.regionCountry === "BH" ? "ar" : "ur";
}

/**
 * Send an order notification to a user.
 * Prevents duplicates by checking recent notifications.
 */
export async function sendOrderNotification(
  userId: string,
  type: keyof typeof ORDER_NOTIFICATION_TEMPLATES,
  data: OrderNotificationData,
): Promise<boolean> {
  try {
    const template = ORDER_NOTIFICATION_TEMPLATES[type];
    if (!template) return false;

    const locale = await getUserLanguage(userId);
    const { title, body } = template[locale];

    // Replace placeholders
    const formattedTitle = title;
    const formattedBody = body
      .replace("{orderNumber}", data.orderNumber)
      .replace("{total}", data.total.toFixed(data.currency === "BHD" ? 3 : 0))
      .replace("{currency}", data.currency);

    // Check for duplicate (same type + order in last 5 minutes)
    const recent = await prisma.notification.findFirst({
      where: {
        userId,
        type: "SYSTEM",
        title: formattedTitle,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
    });

    if (recent) {
      return false; // Duplicate
    }

    await createNotification({
      userId,
      type: "SYSTEM",
      title: formattedTitle,
      body: formattedBody,
      url: `/dashboard/orders/${data.orderId}`,
      data: { orderId: data.orderId, orderNumber: data.orderNumber },
    });

    return true;
  } catch (error) {
    console.error("[notification] Failed to send:", error);
    return false;
  }
}

/**
 * Notify customer about order status change.
 */
export async function notifyOrderStatusChange(
  orderId: string,
  newStatus: string,
): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        customerId: true,
        total: true,
        currency: true,
      },
    });

    if (!order) return;

    const typeMap: Record<string, keyof typeof ORDER_NOTIFICATION_TEMPLATES> = {
      CONFIRMED: "ORDER_CONFIRMED",
      PROCESSING: "ORDER_PROCESSING",
      SHIPPED: "ORDER_SHIPPED",
      DELIVERED: "ORDER_DELIVERED",
      CANCELLED: "ORDER_CANCELLED",
    };

    const templateType = typeMap[newStatus];
    if (!templateType) return;

    await sendOrderNotification(order.customerId, templateType, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: "",
      total: Number(order.total),
      currency: order.currency,
      status: newStatus,
    });
  } catch (error) {
    console.error("[notification] Failed to notify status change:", error);
  }
}