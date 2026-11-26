"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ROUTES } from "@/lib/constants";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  deleteSavedSearchAction,
  setSavedSearchAlertsAction,
} from "@/features/saved-searches/actions/saved-search.actions";
import type { SavedSearchItem } from "@/features/saved-searches/repositories/saved-search.repository";

/** Renders a user's saved searches with re-run + delete actions. */
export function SavedSearchList({ items }: { items: SavedSearchItem[] }) {
  return (
    <ul className="divide-y rounded-xl border">
      {items.map((item) => (
        <SavedSearchRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

function SavedSearchRow({ item }: { item: SavedSearchItem }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [alertsPending, setAlertsPending] = React.useState(false);

  const href = item.query ? `${ROUTES.marketplace}?${item.query}` : ROUTES.marketplace;
  // Fixed locale keeps the server- and client-rendered label identical (no hydration drift).
  const savedOn = new Date(item.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  async function remove() {
    setPending(true);
    const result = await deleteSavedSearchAction(item.id);
    setPending(false);
    if (!result.ok) {
      toast.error("Could not remove this search.");
      return;
    }
    toast.success("Saved search removed");
    router.refresh();
  }

  async function toggleAlerts() {
    setAlertsPending(true);
    const enabled = !item.alertsEnabled;
    const result = await setSavedSearchAlertsAction({ id: item.id, enabled });
    setAlertsPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Could not update alert settings.");
      return;
    }
    toast.success(enabled ? "Alerts enabled" : "Alerts paused");
    router.refresh();
  }

  return (
    <li className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="text-muted-foreground text-xs">Saved {savedOn}</p>
      </div>
      <Link href={href} className={buttonVariants({ variant: "outline", size: "sm" })}>
        <Search className="size-4" />
        <span className="hidden sm:inline">View results</span>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleAlerts}
        disabled={alertsPending}
        aria-label={`${item.alertsEnabled ? "Pause" : "Enable"} alerts for ${item.name}`}
        title={
          item.alertsEnabled ? "Pause email and in-app alerts" : "Enable email and in-app alerts"
        }
      >
        {alertsPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : item.alertsEnabled ? (
          <Bell className="text-primary size-4" />
        ) : (
          <BellOff className="text-muted-foreground size-4" />
        )}
        <span className="hidden sm:inline">{item.alertsEnabled ? "Alerts on" : "Alerts off"}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={remove}
        disabled={pending}
        aria-label={`Remove saved search ${item.name}`}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="text-muted-foreground size-4" />
        )}
      </Button>
    </li>
  );
}
