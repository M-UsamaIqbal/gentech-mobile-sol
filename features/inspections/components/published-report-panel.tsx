"use client";

import * as React from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

import { INSPECTION_VERDICT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { InspectionReportView } from "@/features/inspections/components/inspection-report-view";
import type { InspectionReportDto } from "@/features/inspections/types";

/** Trust panel on the listing page when the seller/buyer has published a report. */
export function PublishedReportPanel({ report }: { report: InspectionReportDto }) {
  const [open, setOpen] = React.useState(false);

  return (
    <section className="border-primary/30 bg-primary/5 overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="bg-primary text-primary-foreground grid size-9 shrink-0 place-items-center rounded-lg">
          <ShieldCheck className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">GenTech Inspected · {report.overallScore}/100</p>
          <p className="text-muted-foreground text-sm">
            {INSPECTION_VERDICT_LABELS[report.verdict]} — tap to view the full report
          </p>
        </div>
        <ChevronDown
          className={cn("text-muted-foreground size-5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="border-t p-4">
          <InspectionReportView report={report} />
        </div>
      ) : null}
    </section>
  );
}
