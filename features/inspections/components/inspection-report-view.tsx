import { CheckCircle2, MinusCircle, ShieldCheck, ShieldX, XCircle } from "lucide-react";

import {
  INSPECTION_ITEM_RESULT_LABELS,
  INSPECTION_ITEM_RESULTS,
  INSPECTION_VERDICT_LABELS,
  INSPECTION_VERDICTS,
  type InspectionItemResult,
  type InspectionVerdict,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { InspectionReportDto } from "@/features/inspections/types";

const RESULT_META: Record<
  InspectionItemResult,
  { icon: typeof CheckCircle2; className: string }
> = {
  [INSPECTION_ITEM_RESULTS.PASS]: { icon: CheckCircle2, className: "text-emerald-600" },
  [INSPECTION_ITEM_RESULTS.MINOR_ISSUE]: { icon: MinusCircle, className: "text-amber-600" },
  [INSPECTION_ITEM_RESULTS.MAJOR_ISSUE]: { icon: XCircle, className: "text-destructive" },
  [INSPECTION_ITEM_RESULTS.NOT_APPLICABLE]: { icon: MinusCircle, className: "text-muted-foreground" },
};

const VERDICT_META: Record<
  InspectionVerdict,
  { icon: typeof ShieldCheck; className: string }
> = {
  [INSPECTION_VERDICTS.RECOMMENDED]: {
    icon: ShieldCheck,
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  [INSPECTION_VERDICTS.RECOMMENDED_WITH_NOTES]: {
    icon: ShieldCheck,
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  [INSPECTION_VERDICTS.NOT_RECOMMENDED]: {
    icon: ShieldX,
    className: "bg-destructive/10 text-destructive",
  },
};

function ScoreRing({ score, grade }: { score: number; grade: string | null }) {
  const tone =
    score >= 75 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-destructive";
  return (
    <div className="flex items-center gap-3">
      <div className={cn("grid size-16 place-items-center rounded-full border-4", tone)}>
        <span className="text-lg font-bold">{grade ?? score}</span>
      </div>
      <div>
        <p className="text-2xl leading-none font-bold">{score}/100</p>
        <p className="text-muted-foreground text-xs">Overall condition score</p>
      </div>
    </div>
  );
}

/** Renders a finished inspection report. Used publicly + in dashboards. */
export function InspectionReportView({ report }: { report: InspectionReportDto }) {
  const verdict = VERDICT_META[report.verdict];
  const VerdictIcon = verdict.icon;

  // Group checklist items by category.
  const groups = new Map<string, typeof report.items>();
  for (const item of report.items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScoreRing score={report.overallScore} grade={report.grade} />
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium",
            verdict.className,
          )}
        >
          <VerdictIcon className="size-4" />
          {INSPECTION_VERDICT_LABELS[report.verdict]}
        </span>
      </div>

      {report.summary ? (
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
          {report.summary}
        </p>
      ) : null}

      {/* Key trust signals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {report.imei ? <Fact label="IMEI" value={report.imei} /> : null}
        {report.ptaApproved !== null ? (
          <Fact label="PTA Approved" value={report.ptaApproved ? "Yes" : "No"} />
        ) : null}
        {report.batteryHealth !== null ? (
          <Fact label="Battery Health" value={`${report.batteryHealth}%`} />
        ) : null}
      </div>

      {/* Checklist */}
      <div className="space-y-4">
        {[...groups.entries()].map(([category, items]) => (
          <div key={category}>
            <h4 className="mb-2 text-sm font-semibold">{category}</h4>
            <ul className="divide-y rounded-lg border">
              {items.map((item) => {
                const meta = RESULT_META[item.result];
                const Icon = meta.icon;
                return (
                  <li key={item.id} className="flex items-start gap-3 px-3 py-2 text-sm">
                    <Icon className={cn("mt-0.5 size-4 shrink-0", meta.className)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span>{item.label}</span>
                        <span className={cn("text-xs font-medium", meta.className)}>
                          {INSPECTION_ITEM_RESULT_LABELS[item.result]}
                        </span>
                      </div>
                      {item.comment ? (
                        <p className="text-muted-foreground mt-0.5 text-xs">{item.comment}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Photos */}
      {report.photos.length > 0 ? (
        <div>
          <h4 className="mb-2 text-sm font-semibold">Inspection photos</h4>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {report.photos.map((photo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={photo.url}
                alt={photo.caption ?? "Inspection photo"}
                className="aspect-square w-full rounded-lg border object-cover"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/40 rounded-lg border px-3 py-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
