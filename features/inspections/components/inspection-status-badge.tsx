import {
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUSES,
  type InspectionStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STYLES: Record<InspectionStatus, string> = {
  [INSPECTION_STATUSES.REQUESTED]: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  [INSPECTION_STATUSES.PAYMENT_PENDING]: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  [INSPECTION_STATUSES.SCHEDULED]: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  [INSPECTION_STATUSES.IN_PROGRESS]: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  [INSPECTION_STATUSES.COMPLETED]: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  [INSPECTION_STATUSES.CANCELLED]: "bg-muted text-muted-foreground",
  [INSPECTION_STATUSES.EXPIRED]: "bg-muted text-muted-foreground",
};

export function InspectionStatusBadge({ status }: { status: InspectionStatus }) {
  return (
    <Badge className={cn("border-transparent", STYLES[status])}>
      {INSPECTION_STATUS_LABELS[status]}
    </Badge>
  );
}
