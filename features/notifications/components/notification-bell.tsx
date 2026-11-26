"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotificationDto } from "@/features/notifications/types";
import { NotificationIcon } from "@/features/notifications/components/notification-icon";
import {
  getUnreadCountAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions/notification.actions";

const POLL_INTERVAL_MS = 25_000;

export function NotificationBell({
  initialCount,
  initialItems,
}: {
  initialCount: number;
  initialItems: NotificationDto[];
}) {
  const router = useRouter();
  const [count, setCount] = React.useState(initialCount);

  // Keep the badge fresh without a full page load.
  React.useEffect(() => {
    let active = true;
    const timer = setInterval(async () => {
      const next = await getUnreadCountAction();
      if (active) setCount(next);
    }, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function onOpen(item: NotificationDto) {
    if (!item.readAt) {
      setCount((c) => Math.max(0, c - 1));
      await markNotificationReadAction(item.id);
      router.refresh();
    }
  }

  async function markAll() {
    setCount(0);
    await markAllNotificationsReadAction();
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />
        }
      >
        <Bell className="size-5" />
        {count > 0 ? (
          <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full px-1 text-xs font-medium">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold">Notifications</span>
          {count > 0 ? (
            <button
              type="button"
              onClick={markAll}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator />

        {initialItems.length === 0 ? (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">
            You&apos;re all caught up.
          </p>
        ) : (
          initialItems.slice(0, 6).map((item) => (
            <DropdownMenuItem
              key={item.id}
              render={<Link href={item.url ?? ROUTES.notifications} />}
              onClick={() => onOpen(item)}
              className={cn("items-start gap-2 py-2", !item.readAt && "bg-accent/40")}
            >
              <NotificationIcon type={item.type} className="text-muted-foreground mt-0.5 size-4" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                {item.body ? (
                  <span className="text-muted-foreground block truncate text-xs">{item.body}</span>
                ) : null}
                <span className="text-muted-foreground block text-xs">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </span>
              {!item.readAt ? (
                <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
              ) : null}
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={ROUTES.notifications} />} className="justify-center">
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
