import {
  Bell,
  Clock,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Star,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

import { NOTIFICATION_TYPES, type NotificationType } from "@/lib/constants";

const ICONS: Record<NotificationType, LucideIcon> = {
  [NOTIFICATION_TYPES.MESSAGE]: MessageSquare,
  [NOTIFICATION_TYPES.LISTING_SOLD]: ShoppingBag,
  [NOTIFICATION_TYPES.LISTING_EXPIRED]: Clock,
  [NOTIFICATION_TYPES.NEW_REVIEW]: Star,
  [NOTIFICATION_TYPES.PRICE_DROP]: TrendingDown,
  [NOTIFICATION_TYPES.SYSTEM]: Bell,
  [NOTIFICATION_TYPES.INSPECTION_REQUESTED]: ShieldCheck,
  [NOTIFICATION_TYPES.INSPECTION_SCHEDULED]: ShieldCheck,
  [NOTIFICATION_TYPES.INSPECTION_COMPLETED]: ShieldCheck,
};

export function NotificationIcon({
  type,
  className,
}: {
  type: NotificationType;
  className?: string;
}) {
  const Icon = ICONS[type] ?? Bell;
  return <Icon className={className} />;
}
