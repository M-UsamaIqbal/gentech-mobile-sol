"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { formatPrice } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPlanAction,
  setPlanActiveAction,
  updatePlanAction,
} from "@/features/inspections/actions/admin-plan.actions";
import type { InspectionPlanDto } from "@/features/inspections/types";

export function AdminPlansManager({
  plans,
  loadError,
}: {
  plans: InspectionPlanDto[];
  loadError?: string | null;
}) {
  const router = useRouter();
  const [creating, setCreating] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#1F1F1F] px-4 py-3">
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-slate-100">{plans.length.toLocaleString()}</span>{" "}
          package{plans.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" className="min-h-9" onClick={() => setCreating((v) => !v)}>
          <Plus className="size-4" />
          New package
        </Button>
      </div>

      {loadError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-300" aria-hidden="true" />
            <p className="text-sm leading-5 text-rose-100">{loadError}</p>
          </div>
          <Button variant="outline" size="sm" className="min-h-9" onClick={() => router.refresh()}>
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : null}

      {creating ? (
        <PlanForm onDone={() => setCreating(false)} submitLabel="Create package" />
      ) : null}

      {plans.length === 0 && !loadError && !creating ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#1F1F1F]/60 px-5 py-12 text-center">
          <Plus className="mx-auto size-6 text-slate-500" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-slate-200">No inspection packages yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Create a package to define pricing for inspection requests.
          </p>
          <Button size="sm" className="mt-4 min-h-9" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Create first package
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <PlanRow key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanRow({ plan }: { plan: InspectionPlanDto }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function toggleActive() {
    setPending(true);
    const result = await setPlanActiveAction({ id: plan.id, isActive: !plan.isActive });
    setPending(false);
    if (result.ok) router.refresh();
    else toast.error(result.error ?? "Could not update.");
  }

  return (
    <article className="rounded-xl border border-white/[0.08] bg-[#1F1F1F] p-4 transition-colors hover:border-white/[0.14] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{plan.name}</h3>
            <Badge
              variant="outline"
              className={
                plan.isActive
                  ? "border-transparent bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-white/[0.04] text-slate-400"
              }
            >
              {plan.isActive ? "Active" : "Hidden"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {formatPrice(plan.price, { currency: plan.currency })} · {plan.checkpoints}+ checkpoints
          </p>
          {plan.features.length > 0 ? (
            <p className="text-muted-foreground mt-1 text-xs">{plan.features.join(" · ")}</p>
          ) : null}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="min-h-9 flex-1 sm:flex-none"
            onClick={toggleActive}
            disabled={pending}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {plan.isActive ? "Hide" : "Show"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-9 flex-1 sm:flex-none"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Close" : "Edit"}
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 border-t pt-4">
          <PlanForm plan={plan} onDone={() => setEditing(false)} submitLabel="Save changes" />
        </div>
      ) : null}
    </article>
  );
}

function PlanForm({
  plan,
  onDone,
  submitLabel,
}: {
  plan?: InspectionPlanDto;
  onDone: () => void;
  submitLabel: string;
}) {
  const router = useRouter();
  const formId = React.useId();
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const features = String(form.get("features") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? "") || undefined,
      price: Number(form.get("price") ?? 0),
      checkpoints: Number(form.get("checkpoints") ?? 0),
      features,
    };

    setPending(true);
    const result = plan
      ? await updatePlanAction({ id: plan.id, ...payload })
      : await createPlanAction(payload);
    setPending(false);

    if (result.ok) {
      toast.success(plan ? "Package updated." : "Package created.");
      onDone();
      router.refresh();
    } else {
      toast.error(result.error ?? "Could not save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-name`}>Name</Label>
          <Input
            id={`${formId}-name`}
            name="name"
            required
            defaultValue={plan?.name}
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-price`}>Price (PKR)</Label>
          <Input
            id={`${formId}-price`}
            name="price"
            type="number"
            min={0}
            step="1"
            required
            defaultValue={plan?.price}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${formId}-checkpoints`}>Checkpoints</Label>
          <Input
            id={`${formId}-checkpoints`}
            name="checkpoints"
            type="number"
            min={0}
            step="1"
            defaultValue={plan?.checkpoints ?? 0}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-description`}>Description</Label>
        <Input
          id={`${formId}-description`}
          name="description"
          defaultValue={plan?.description ?? ""}
          maxLength={500}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${formId}-features`}>Features (one per line)</Label>
        <Textarea
          id={`${formId}-features`}
          name="features"
          rows={4}
          defaultValue={plan?.features.join("\n")}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
