import { cn } from "@/lib/utils";
import { LISTING_STATUS_LABELS, LISTING_STATUSES, type ListingStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

/** Status-specific colours so sellers can scan inventory state at a glance. */
const STATUS_CLASSES: Record<ListingStatus, string> = {
  [LISTING_STATUSES.ACTIVE]:
    "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  [LISTING_STATUSES.PENDING_APPROVAL]:
    "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
  [LISTING_STATUSES.REJECTED]: "border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-400",
  [LISTING_STATUSES.SOLD]: "border-transparent bg-slate-500/15 text-slate-700 dark:text-slate-300",
  [LISTING_STATUSES.DRAFT]: "border-transparent bg-muted text-muted-foreground",
  [LISTING_STATUSES.EXPIRED]:
    "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
  [LISTING_STATUSES.REMOVED]: "border-transparent bg-destructive/15 text-destructive",
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status])}>
      {LISTING_STATUS_LABELS[status]}
    </Badge>
  );
}
