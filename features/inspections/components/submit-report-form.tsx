"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  INSPECTION_ITEM_RESULT_LABELS,
  INSPECTION_ITEM_RESULTS,
  INSPECTION_KINDS,
  INSPECTION_KIND_LABELS,
  INSPECTION_VERDICT_LABELS,
  INSPECTION_VERDICTS,
  ROUTES,
  getInspectionChecklist,
  type InspectionItemResult,
  type InspectionKind,
  type InspectionVerdict,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/features/listings/components/image-uploader";
import type { UploadedImage } from "@/features/inspections/schemas/inspection";
import { submitReportAction } from "@/features/inspections/actions/inspector.actions";

interface ItemState {
  category: string;
  label: string;
  result: InspectionItemResult;
  comment: string;
}

const RESULT_OPTIONS = Object.values(INSPECTION_ITEM_RESULTS);
const VERDICT_OPTIONS = Object.values(INSPECTION_VERDICTS);

function initialItems(kind: InspectionKind): ItemState[] {
  return getInspectionChecklist(kind).flatMap((group) =>
    group.items.map((label) => ({
      category: group.category,
      label,
      // Nothing is graded by default: a blank form must never produce an A.
      result: INSPECTION_ITEM_RESULTS.NOT_APPLICABLE as InspectionItemResult,
      comment: "",
    })),
  );
}

interface Props {
  requestId: string;
  inspectionKind?: InspectionKind;
}

export function SubmitReportForm({
  requestId,
  inspectionKind = INSPECTION_KINDS.PHONE,
}: Props) {
  const router = useRouter();
  const isPhoneInspection = inspectionKind === INSPECTION_KINDS.PHONE;
  const deviceLabel = INSPECTION_KIND_LABELS[inspectionKind].toLowerCase();
  const [items, setItems] = React.useState<ItemState[]>(() => initialItems(inspectionKind));
  const [verdict, setVerdict] = React.useState<InspectionVerdict>(
    INSPECTION_VERDICTS.RECOMMENDED,
  );
  const [photos, setPhotos] = React.useState<UploadedImage[]>([]);
  const [pending, setPending] = React.useState(false);

  function updateItem(index: number, patch: Partial<ItemState>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const batteryRaw = String(form.get("batteryHealth") ?? "").trim();
    const ptaRaw = String(form.get("ptaApproved") ?? "");

    if (!items.some((item) => item.result !== INSPECTION_ITEM_RESULTS.NOT_APPLICABLE)) {
      toast.error("Grade at least one checklist item before submitting.");
      return;
    }

    setPending(true);
    const result = await submitReportAction({
      requestId,
      verdict,
      summary: String(form.get("summary") ?? "") || undefined,
      imei: isPhoneInspection ? String(form.get("imei") ?? "") || undefined : undefined,
      ptaApproved:
        isPhoneInspection && ptaRaw !== "" ? ptaRaw === "yes" : undefined,
      batteryHealth: batteryRaw === "" ? undefined : Number(batteryRaw),
      items: items.map((it) => ({
        category: it.category,
        label: it.label,
        result: it.result,
        comment: it.comment || undefined,
      })),
      photos,
    });
    setPending(false);

    if (result.ok) {
      toast.success("Report submitted. The buyer has been notified.");
      router.push(ROUTES.inspector);
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not submit the report.");
    }
  }

  // Group items (with their index) by category for rendering.
  const groups = new Map<string, Array<{ item: ItemState; index: number }>>();
  items.forEach((item, index) => {
    const list = groups.get(item.category) ?? [];
    list.push({ item, index });
    groups.set(item.category, list);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Device-specific trust signals */}
      <section className={cn("grid gap-4 sm:grid-cols-2", isPhoneInspection && "sm:grid-cols-3")}>
        {isPhoneInspection ? (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="imei">IMEI</Label>
              <Input
                id="imei"
                name="imei"
                inputMode="numeric"
                maxLength={15}
                placeholder="15 digits (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ptaApproved">PTA Approved</Label>
              <select
                id="ptaApproved"
                name="ptaApproved"
                defaultValue=""
                className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
              >
                <option value="">Unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="batteryHealth">
            {isPhoneInspection ? "Battery Health (%)" : "Battery Condition (%)"}
          </Label>
          <Input
            id="batteryHealth"
            name="batteryHealth"
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            step={1}
            placeholder="0–100"
          />
        </div>
      </section>

      {/* Checklist */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">{INSPECTION_KIND_LABELS[inspectionKind]} checklist</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Lines left as N/A are excluded from the score. Grade at least one item.
          </p>
        </div>
        {[...groups.entries()].map(([category, entries]) => (
          <div key={category}>
            <h3 className="mb-2 text-sm font-semibold">{category}</h3>
            <div className="space-y-2 rounded-lg border p-3">
              {entries.map(({ item, index }) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <span className="text-sm">{item.label}</span>
                  <select
                    aria-label={`${item.label} result`}
                    value={item.result}
                    onChange={(e) =>
                      updateItem(index, { result: e.target.value as InspectionItemResult })
                    }
                    className="border-input bg-background h-8 rounded-lg border px-2 text-sm sm:w-40"
                  >
                    {RESULT_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {INSPECTION_ITEM_RESULT_LABELS[r]}
                      </option>
                    ))}
                  </select>
                  {item.result !== INSPECTION_ITEM_RESULTS.PASS &&
                  item.result !== INSPECTION_ITEM_RESULTS.NOT_APPLICABLE ? (
                    <Input
                      value={item.comment}
                      onChange={(e) => updateItem(index, { comment: e.target.value })}
                      placeholder="Add a note"
                      maxLength={500}
                      className="sm:col-span-2"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Verdict + summary */}
      <section className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="verdict">Overall verdict</Label>
          <select
            id="verdict"
            value={verdict}
            onChange={(e) => setVerdict(e.target.value as InspectionVerdict)}
            className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm sm:max-w-sm"
          >
            {VERDICT_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {INSPECTION_VERDICT_LABELS[v]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            name="summary"
            rows={4}
            maxLength={2000}
            placeholder={`Summarise the ${deviceLabel}'s condition for the buyer…`}
          />
        </div>
      </section>

      {/* Photos */}
      <section className="space-y-2">
        <Label>Inspection photos</Label>
        <ImageUploader value={photos} onChange={setPhotos} max={20} folder="inspections" />
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Submitting…" : "Submit report"}
      </Button>
    </form>
  );
}
