import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BellOff } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { getNotifications } from "@/features/notifications/services/notification.service";
import { NotificationList } from "@/features/notifications/components/notification-list";

export const metadata: Metadata = { 
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.signIn);

  const notifications = await getNotifications(user.id, 50);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground text-sm">Messages, sales and activity updates</p>
      </header>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <BellOff className="text-muted-foreground size-10" />
          <p className="text-muted-foreground text-sm">No notifications yet.</p>
        </div>
      ) : (
        <NotificationList items={notifications} />
      )}
    </div>
  );
}
