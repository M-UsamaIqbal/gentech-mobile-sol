"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, Loader2, MoreVertical, X } from "lucide-react";
import { toast } from "sonner";

import {
  REPORT_REASON_LABELS,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  type ReportStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminReportRow as AdminReportRowData } from "@/features/admin/types";
import { setReportStatusAction } from "@/features/admin/actions/admin.actions";

const STATUS_CLASSES: Record<ReportStatus, string> = {
  [REPORT_STATUSES.OPEN]: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
  [REPORT_STATUSES.REVIEWING]: "border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400",
  [REPORT_STATUSES.RESOLVED]:
    "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  [REPORT_STATUSES.DISMISSED]: "border-transparent bg-muted text-muted-foreground",
};

export function AdminReportRow({ report }: { report: AdminReportRowData }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function setStatus(status: ReportStatus) {
    if (
      status === REPORT_STATUSES.DISMISSED &&
      !window.confirm("Dismiss this report? The reported content will remain unchanged.")
    ) {
      return;
    }

    setPending(true);
    const result = await setReportStatusAction({ reportId: report.id, status });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error ?? "Action failed.");
      return;
    }
    toast.success(`Marked ${REPORT_STATUS_LABELS[status].toLowerCase()}`);
    router.refresh();
  }

  return (
    <div className="flex items-start gap-3 p-3 transition-colors hover:bg-white/[0.02] sm:px-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-100">
            {REPORT_REASON_LABELS[report.reason] ?? report.reason}
          </span>
          <Badge variant="outline" className={cn(STATUS_CLASSES[report.status])}>
            {REPORT_STATUS_LABELS[report.status]}
          </Badge>
        </div>

        {report.details ? (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{report.details}</p>
        ) : null}

        <p className="text-muted-foreground mt-1 text-xs">
          by {report.reporterName}
          {report.reportedUserName ? ` · against ${report.reportedUserName}` : ""}
          {" · "}
          {formatRelativeTime(report.createdAt)}
        </p>

        {report.listing ? (
          <Link
            href={`/listings/${report.listing.slug}`}
            className="text-primary mt-1 inline-flex items-center gap-1 text-xs hover:underline"
          >
            <Eye className="size-3.5" />
            {report.listing.title}
          </Link>
        ) : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label={`Actions for ${REPORT_REASON_LABELS[report.reason] ?? report.reason} report`}
              disabled={pending}
            />
          }
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MoreVertical className="size-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={pending} onClick={() => setStatus(REPORT_STATUSES.REVIEWING)}>
            <Eye className="size-4" />
            Mark reviewing
          </DropdownMenuItem>
          <DropdownMenuItem disabled={pending} onClick={() => setStatus(REPORT_STATUSES.RESOLVED)}>
            <Check className="size-4" />
            Resolve
          </DropdownMenuItem>
          <DropdownMenuItem disabled={pending} onClick={() => setStatus(REPORT_STATUSES.DISMISSED)}>
            <X className="size-4" />
            Dismiss
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
